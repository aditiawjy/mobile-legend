import { useState } from 'react';
import DraftPickSimulator from '../components/DraftPickSimulator';
import ManualDraftPick from '../components/ManualDraftPick';

export default function DraftPickPage() {
  const [mode, setMode] = useState('auto'); // 'auto' or 'manual'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black p-8">
      {/* Mode Toggle */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setMode('auto')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              mode === 'auto'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Auto Recommendation
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              mode === 'manual'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Manual Selection
          </button>
        </div>
        <p className="text-center text-gray-500 text-sm mt-3">
          {mode === 'auto' 
            ? 'Choose a hero and get 4 recommended partners' 
            : 'Manually select all 5 heroes with autocomplete'}
        </p>
      </div>

      {/* Content */}
      {mode === 'auto' ? <DraftPickSimulator /> : <ManualDraftPick />}
    </div>
  );
}
