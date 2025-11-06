import AppLayout from '../components/AppLayout'

function Error({ statusCode }) {
  return (
    <AppLayout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Terjadi Kesalahan</h1>
          <p className="text-gray-600 mb-6">
            {statusCode
              ? `Server mengembalikan status ${statusCode}.`
              : 'Terjadi error di sisi client.'}
          </p>
          <a href="/" className="inline-flex items-center px-4 py-2 rounded-md bg-sky-600 text-white hover:bg-sky-700">Kembali ke Dashboard</a>
        </div>
      </div>
    </AppLayout>
  )
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default Error
