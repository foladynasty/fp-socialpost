import { useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { useProfile } from '../hooks/useProfile';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export function Settings() {
  const { profile, updateProfile } = useProfile();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await updateProfile.mutateAsync({ full_name: fullName });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update profile',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">Settings</h1>

        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your account details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <div className="flex items-center gap-2">
                  <span className="inline-block rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-foreground">
                    {profile?.role === 'admin' ? 'Admin' : 'Creator'}
                  </span>
                  <p className="text-xs text-gray-500">
                    Contact an administrator to change your role
                  </p>
                </div>
              </div>

              {message && (
                <div
                  className={`rounded-md p-3 text-sm ${
                    message.type === 'success'
                      ? 'bg-green-50 text-green-800'
                      : 'bg-destructive/10 text-destructive'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
