import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import './Auth.css'

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(email, password)
      navigate('/feed')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
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
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="error">{error}</p>}

            <button type="submit" className="btn btn-primary btn-full">
              Login
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
