import { AppLayout } from '../components/layout/AppLayout';

export function Dashboard() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">Calendar component will go here</p>
        </div>
      </div>
    </AppLayout>
  );
}
