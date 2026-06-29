import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { apiClient } from '../api'
import './Auth.css'

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const res = await apiClient.post('/api/auth/forgot-password', { email })
      setMessage(res.data.message || 'If that email is registered, we have sent a password reset link.')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send reset link. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-split-left">
        <h1 className="auth-logo-large">Florante Community</h1>
        <p className="auth-welcome-text">Reset your password to regain access to the ultimate hub for professional growth.</p>
      </div>
      <div className="auth-split-right">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Forgot Password</h1>
            <p>Enter your email address and we'll send you a link to reset your password.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={error ? 'input-error' : ''}
                placeholder="name@example.com"
                required
                disabled={loading}
              />
            </div>

            {error && <p className="error">{error}</p>}
            {message && <p style={{ color: 'green', fontWeight: 'bold', textAlign: 'center', margin: '10px 0' }}>{message}</p>}

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? <span className="spinner"></span> : null}
              {loading ? 'Sending link...' : 'Reset Password'}
            </button>
          </form>

          <div className="divider">or</div>

          <p className="auth-link">
            Remembered your password? <Link to="/login">Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
