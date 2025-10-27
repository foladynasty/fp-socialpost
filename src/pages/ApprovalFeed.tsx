import { AppLayout } from '../components/layout/AppLayout';

export function ApprovalFeed() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">Approval Feed</h1>
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">Pending posts will appear here</p>
        </div>
      </div>
    </AppLayout>
  );
}
