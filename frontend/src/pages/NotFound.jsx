import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-bg-light flex flex-col items-center justify-center px-4">
      <div className="card text-center max-w-md">
        <div className="text-6xl font-bold text-marine mb-4">404</div>
        <h1 className="text-xl font-semibold text-heading mb-2">Page not found</h1>
        <p className="text-body-dark text-sm mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate('/')} className="btn-secondary text-sm">
            Home
          </button>
          <button onClick={() => navigate('/dashboard')} className="btn-primary text-sm">
            Clinical Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
