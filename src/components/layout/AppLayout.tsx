import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useProfile } from '../../hooks/useProfile';
import { signOut } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Home, CheckSquare, Settings, LogOut, Menu, X } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navItems = [
    { name: 'Dashboard', icon: Home, path: '/dashboard', roles: ['creator', 'admin'] },
    {
      name: 'Approval Feed',
      icon: CheckSquare,
      path: '/approval-feed',
      roles: ['admin'],
    },
    { name: 'Settings', icon: Settings, path: '/settings', roles: ['creator', 'admin'] },
  ];

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(profile?.role || 'creator')
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo and close button */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h1 className="text-xl font-bold text-primary">ApprovalFeed</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User info and logout */}
          <div className="border-t p-4">
            <div className="mb-3 rounded-lg bg-gray-50 p-3">
              <p className="text-sm font-medium text-gray-900">
                {profile?.full_name || 'User'}
              </p>
              <p className="text-xs text-gray-500">{profile?.email}</p>
              <span className="mt-1 inline-block rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                {profile?.role === 'admin' ? 'Admin' : 'Creator'}
              </span>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="border-b bg-white px-4 py-3 lg:hidden">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
