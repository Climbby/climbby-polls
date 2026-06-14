import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router'
import { AuthorNameProvider } from './lib/AuthorNameProvider'
import { AuthProvider } from './lib/auth/AuthProvider'
import { ThemeProvider } from './lib/ThemeProvider'
import { AppRoutes } from './routes/AppRoutes'

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
      <AuthorNameProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </QueryClientProvider>
        </AuthProvider>
      </AuthorNameProvider>
    </ThemeProvider>
  )
}
