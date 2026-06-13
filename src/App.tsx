import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router'
import { Layout } from './components/Layout'
import { AdminPage } from './pages/AdminPage'
import { ArchivePage } from './pages/ArchivePage'
import { HomePage } from './pages/HomePage'
import { PollPage } from './pages/PollPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="polls/:slug" element={<PollPage />} />
            <Route path="archive" element={<ArchivePage />} />
            <Route path="admin" element={<AdminPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
