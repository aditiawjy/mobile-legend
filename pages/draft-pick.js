import ManualDraftPick from '../components/draft/ManualDraftPick';
import AppLayout from '../components/common/AppLayout';

export default function DraftPickPage() {
  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <ManualDraftPick />
      </div>
    </AppLayout>
  );
}
