import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import '@fontsource-variable/cormorant-garamond'
import '@fontsource-variable/jost'
import App from './App'
import { queryClient } from './lib/queryClient'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/*
      The provider is mounted ONCE, here, so every part of the app shares
      a single cache. The client itself is created at module scope in
      `lib/queryClient.ts` — creating it during render would throw the
      cache away on every re-render.
    */}
    <QueryClientProvider client={queryClient}>
      <App />
      {/*
        The devtools are a development-only aid. They are stripped from the
        production bundle by the `import.meta.env.DEV` guard, so they cost
        the deployed site nothing.
      */}
      {import.meta.env.DEV ? (
        <ReactQueryDevtools initialIsOpen={false} />
      ) : null}
    </QueryClientProvider>
  </React.StrictMode>,
)
