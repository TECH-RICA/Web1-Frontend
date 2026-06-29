import React, { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { apiClient } from '../api'
import './Auth.css'

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!token) {
      setError('Reset token is missing from the URL.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const res = await apiClient.post('/api/auth/reset-password', { token, password })
      setMessage(res.data.message || 'Password reset successfully! Redirecting to login...')
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-split-left">
        <h1 className="auth-logo-large">Florante Community</h1>
        <p className="auth-welcome-text">Reset your password to secure your account and continue your journey.</p>
      </div>
      <div className="auth-split-right">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Reset Password</h1>
            <p>Enter your new password below.</p>
          </div>

          {!token ? (
            <div className="error" style={{ textAlign: 'center', marginBottom: '20px' }}>
              Invalid or missing password reset token. Please request a new reset link.
              <div style={{ marginTop: '15px' }}>
                <Link to="/forgot-password" style={{ color: 'white', textDecoration: 'underline', fontWeight: 'bold' }}>
                  Go to Forgot Password
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={error && password !== confirmPassword ? 'input-error' : ''}
                  placeholder="At least 6 characters"
                  required
                  disabled={loading || !!message}
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={error && password !== confirmPassword ? 'input-error' : ''}
                  placeholder="Re-enter new password"
                  required
                  disabled={loading || !!message}
                />
              </div>

              {error && <p className="error">{error}</p>}
              {message && <p style={{ color: 'green', fontWeight: 'bold', textAlign: 'center', margin: '10px 0' }}>{message}</p>}

              <button type="submit" className="btn btn-primary btn-full" disabled={loading || !!message}>
                {loading ? <span className="spinner"></span> : null}
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          <div className="divider">or</div>

          <p className="auth-link">
            <Link to="/login">Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage
