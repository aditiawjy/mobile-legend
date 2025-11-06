import { useState } from 'react'
import AppLayout from '../components/AppLayout'

export default function CSVSetupPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleInitialize = async () => {
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const response = await fetch('/api/export/init-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Failed to initialize CSV files')
      }
    } catch (err) {
      setError(err.message || 'Error initializing CSV files')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">CSV Setup</h1>
            <p className="text-gray-600 mb-8">Initialize or regenerate CSV files from database</p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-blue-900 mb-4">CSV Files</h2>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>✅ <strong>heroes.csv</strong> - All heroes data</li>
                <li>✅ <strong>items.csv</strong> - All items data with stats</li>
              </ul>
              <p className="text-xs text-blue-700 mt-4">Files will be saved to: /public/csv/</p>
            </div>

            <button
              onClick={handleInitialize}
              disabled={loading}
              className="w-full px-6 py-3 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
            >
              {loading ? 'Initializing...' : 'Initialize CSV Files'}
            </button>

            {result && (
              <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-4">✓ Success!</h3>
                <div className="space-y-2 text-sm text-green-800">
                  {result.results.heroes && (
                    <p>🦸 Heroes CSV: <strong>{result.results.heroes.count}</strong> heroes generated</p>
                  )}
                  {result.results.items && (
                    <p>📦 Items CSV: <strong>{result.results.items.count}</strong> items generated</p>
                  )}
                </div>
                <div className="mt-4 text-xs text-green-700 space-y-1">
                  <p>Files location:</p>
                  <code className="block bg-green-100 p-2 rounded">/public/csv/heroes.csv</code>
                  <code className="block bg-green-100 p-2 rounded">/public/csv/items.csv</code>
                </div>
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded p-2">
                    <p className="text-xs font-semibold text-red-800">Warnings:</p>
                    {result.errors.map((err, i) => (
                      <p key={i} className="text-xs text-red-700">{err}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-900 mb-2">✗ Error</h3>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-4">Quick Updates</h3>
              <p className="text-sm text-gray-600 mb-4">After initial setup, use these buttons to update CSV files:</p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>📍 <strong>Heroes Page:</strong> Click "Update CSV" button in header</li>
                <li>📍 <strong>Items Page:</strong> Click "Update CSV" button in header</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
