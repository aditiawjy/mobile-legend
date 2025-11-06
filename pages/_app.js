import "../styles/globals.css"
import { ToastProvider } from "../components/Toast"
import { SWRConfig } from 'swr'

export default function App({ Component, pageProps }) {
  return (
    <SWRConfig
      value={{
        // Global SWR configuration
        fetcher: async (url) => {
          const res = await fetch(url)
          if (!res.ok) {
            const error = new Error('An error occurred while fetching the data.')
            error.info = await res.json().catch(() => ({}))
            error.status = res.status
            throw error
          }
          return res.json()
        },
        
        // Revalidation settings
        revalidateOnFocus: false,      // Don't revalidate on window focus
        revalidateOnReconnect: true,   // Revalidate on network reconnect
        dedupingInterval: 5000,        // Dedupe requests within 5 seconds
        
        // Error retry settings
        errorRetryCount: 3,
        errorRetryInterval: 5000,
        
        // Cache settings
        shouldRetryOnError: true,
        
        // Loading timeout
        loadingTimeout: 3000,
        
        // Focus throttle
        focusThrottleInterval: 5000,
        
        // Keep previous data while revalidating
        keepPreviousData: true,
      }}
    >
      <ToastProvider>
        <Component {...pageProps} />
      </ToastProvider>
    </SWRConfig>
  )
}
