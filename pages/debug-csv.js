import { useState } from 'react'
import AppLayout from '../components/AppLayout'

export default function DebugCSVPage() {
  const [itemsResult, setItemsResult] = useState(null)
  const [csvResult, setCsvResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const testItemsDatabase = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test/items-count')
      const data = await response.json()
      setItemsResult(data)
    } catch (err) {
      setItemsResult({ error: err.message })
    } finally {
      setLoading(false)
    }
  }

  const testItemsCSVExport = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/export/items-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      setCsvResult(data)
    } catch (err) {
      setCsvResult({ error: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">CSV Export Debug</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Test Items Database */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">1. Test Items Database</h2>
              <button
                onClick={testItemsDatabase}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg"
              >
                {loading ? 'Testing...' : 'Test Database Connection'}
              </button>

              {itemsResult && (
                <div className="mt-4 p-4 bg-gray-50 rounded text-sm">
                  <pre className="whitespace-pre-wrap overflow-auto">
                    {JSON.stringify(itemsResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Test CSV Export */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">2. Test Items CSV Export</h2>
              <button
                onClick={testItemsCSVExport}
                disabled={loading}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg"
              >
                {loading ? 'Testing...' : 'Test CSV Generation'}
              </button>

              {csvResult && (
                <div className="mt-4 p-4 bg-gray-50 rounded text-sm">
                  <pre className="whitespace-pre-wrap overflow-auto">
                    {JSON.stringify(csvResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="font-semibold text-yellow-900 mb-2">Instructions:</h3>
            <ol className="text-sm text-yellow-800 space-y-2">
              <li>1. Click "Test Database Connection" to verify items exist in database</li>
              <li>2. Check the result - should show total items count and sample items</li>
              <li>3. Click "Test CSV Generation" to test the export process</li>
              <li>4. Check console (F12) for detailed logs</li>
              <li>5. If successful, check /csv/items.csv file</li>
            </ol>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">Expected Results:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✅ Database test should show totalItems &gt; 0</li>
              <li>✅ CSV export should show success: true</li>
              <li>✅ itemCount should match database count</li>
              <li>✅ fileSize should be &gt; 200 bytes</li>
            </ul>
          </div>

          <div className="mt-6 text-center">
            <a href="/items" className="text-blue-600 hover:text-blue-800 underline">
              ← Back to Items Page
            </a>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
