-- ApprovalFeed Database Setup Script
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  role text not null default 'creator' check (role in ('creator', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create posts table
create table posts (
  id uuid default uuid_generate_v4() primary key,
  creator_id uuid references profiles(id) on delete cascade not null,
  content text not null check (char_length(content) >= 1 and char_length(content) <= 500),
  image_url text,
  scheduled_date timestamp with time zone not null,
  status text not null default 'draft' check (status in ('draft', 'pending', 'approved', 'rejected')),
  rejection_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table profiles enable row level security;
alter table posts enable row level security;

-- RLS Policies for profiles
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on profiles for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- RLS Policies for posts
create policy "Creators can view own posts"
  on posts for select
  using (creator_id = auth.uid());

create policy "Admins can view all posts"
  on posts for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Creators can create posts"
  on posts for insert
  with check (creator_id = auth.uid());

create policy "Creators can update own draft/rejected posts"
  on posts for update
  using (
    creator_id = auth.uid()
    and status in ('draft', 'rejected')
  );

create policy "Admins can update any post"
  on posts for update
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Creators can delete own draft/rejected posts"
  on posts for delete
  using (
    creator_id = auth.uid()
    and status in ('draft', 'rejected')
  );

create policy "Admins can delete any post"
  on posts for delete
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'creator'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create storage bucket for images
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

-- Storage policies
create policy "Authenticated users can upload images"
  on storage.objects for insert
  with check (
    bucket_id = 'post-images'
    and auth.role() = 'authenticated'
  );

create policy "Public can view images"
  on storage.objects for select
  using (bucket_id = 'post-images');

create policy "Users can delete own images"
  on storage.objects for delete
  using (
    bucket_id = 'post-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger update_profiles_updated_at before update on profiles
  for each row execute procedure update_updated_at_column();

create trigger update_posts_updated_at before update on posts
  for each row execute procedure update_updated_at_column();
