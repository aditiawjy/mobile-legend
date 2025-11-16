import ManualDraftPick from '../components/ManualDraftPick';

export default function DraftPickPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black p-8">
      <div className="max-w-6xl mx-auto mb-6">
        <h1 className="text-3xl font-bold text-center text-white">Manual Draft Pick</h1>
        <p className="text-center text-gray-500 text-sm mt-3">
          Manually select all 5 heroes for your team and enemy draft with autocomplete.
        </p>
      </div>

      <ManualDraftPick />
    </div>
  );
}
