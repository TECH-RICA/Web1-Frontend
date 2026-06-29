import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import './Auth.css'

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState<number>(0)
  const navigate = useNavigate()
  const { login } = useAuthStore()

  // Check lockout on mount and handle countdown
  useEffect(() => {
    const checkLockout = () => {
      const lockoutUntilStr = localStorage.getItem('login_lockout_until')
      if (lockoutUntilStr) {
        const lockoutUntil = parseInt(lockoutUntilStr, 10)
        const now = Date.now()
        if (lockoutUntil > now) {
          const timeLeft = Math.ceil((lockoutUntil - now) / 1000)
          setLockoutTimeLeft(timeLeft)
          return timeLeft
        }
      }
      return 0
    }

    const timeLeft = checkLockout()
    if (timeLeft > 0) {
      const interval = setInterval(() => {
        const remaining = checkLockout()
        if (remaining <= 0) {
          setLockoutTimeLeft(0)
          localStorage.removeItem('login_lockout_until')
          localStorage.removeItem('login_failed_attempts')
          setError('')
          clearInterval(interval)
        }
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [lockoutTimeLeft])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (lockoutTimeLeft > 0) return

    setError('')
    setLoading(true)
    try {
      await login(email, password)
      // Clear attempts on success
      localStorage.removeItem('login_failed_attempts')
      localStorage.removeItem('login_lockout_until')
      navigate('/feed')
    } catch (err: any) {
      // If the error indicates a lockout (status 429) or if we reach 5 attempts locally
      const isBackendLockout = err.status === 429 || err.message?.includes('blocked')
      
      let attempts = parseInt(localStorage.getItem('login_failed_attempts') || '0', 10) + 1
      localStorage.setItem('login_failed_attempts', attempts.toString())

      if (attempts >= 5 || isBackendLockout) {
        const lockoutDuration = 60 * 1000 // 60 seconds
        const lockoutUntil = Date.now() + lockoutDuration
        localStorage.setItem('login_lockout_until', lockoutUntil.toString())
        setLockoutTimeLeft(60)
        setError('Too many failed login attempts. The login area is blocked for 60 seconds.')
      } else {
        const remaining = 5 - attempts
        setError(`Invalid email or password. ${remaining} attempts remaining.`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-split-left">
        <h1 className="auth-logo-large">Florante Community</h1>
        <p className="auth-welcome-text">Join the ultimate hub for discussions, knowledge sharing, and professional growth.</p>
      </div>
      <div className="auth-split-right">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Login</h1>
            <p>Welcome back! Please enter your details.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={error ? 'input-error' : ''}
                required
                disabled={loading || lockoutTimeLeft > 0}
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Password</label>
                <Link 
                  to="/forgot-password" 
                  style={{ 
                    fontSize: '13px', 
                    color: 'var(--primary)', 
                    fontWeight: 'bold', 
                    textDecoration: 'none' 
                  }}
                  tabIndex={-1}
                >
                  Forgot Password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={error ? 'input-error' : ''}
                required
                disabled={loading || lockoutTimeLeft > 0}
              />
            </div>

            {error && <p className="error">{error}</p>}

            <button 
              type="submit" 
              className="btn btn-primary btn-full" 
              disabled={loading || lockoutTimeLeft > 0}
            >
              {loading ? <span className="spinner"></span> : null}
              {lockoutTimeLeft > 0 
                ? `Blocked (${lockoutTimeLeft}s)` 
                : (loading ? 'Logging in...' : 'Login')}
            </button>
          </form>

          <div className="divider">or</div>

          <p className="auth-link">
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
