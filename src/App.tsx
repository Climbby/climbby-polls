import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { Layout } from './components/Layout'
import { ThemeProvider } from './lib/ThemeProvider'
import { AdminPage } from './pages/AdminPage'
import { HomePage } from './pages/HomePage'
import { PollRedirectPage } from './pages/PollRedirectPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="polls/:slug" element={<PollRedirectPage />} />
              <Route path="archive" element={<Navigate to="/" replace />} />
              <Route path="admin" element={<AdminPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
