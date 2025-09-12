import { HomePage } from './pages/HomePage'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ErrorProvider } from './contexts/ErrorContext'
import { LoadingProvider } from './contexts/LoadingContext'
import { ToastContainer } from './components/Toast'
import './index.css'

function App() {
  return (
    <ErrorBoundary>
      <ErrorProvider>
        <LoadingProvider>
          <div className="min-h-screen bg-gray-50">
            <HomePage />
            <ToastContainer />
          </div>
        </LoadingProvider>
      </ErrorProvider>
    </ErrorBoundary>
  )
}

export default App
