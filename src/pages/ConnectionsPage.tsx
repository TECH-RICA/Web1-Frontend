import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { API_BASE_URL } from '../api';

interface Connection {
  id: number
  first_name: string
  last_name: string
  headline: string
  profile_picture_url: string
}

interface PendingRequest {
  id: number
  user_id: number
  first_name: string
  last_name: string
  headline: string
  profile_picture_url: string
}

const ConnectionsPage: React.FC = () => {
  const { user, token } = useAuthStore()
  const navigate = useNavigate()
  const [connections, setConnections] = useState<Connection[]>([])
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      fetchNetwork()
    }
  }, [user?.id])

  const fetchNetwork = async () => {
    setLoading(true)
    try {
      // Fetch accepted connections
      const connRes = await fetch(`${API_BASE_URL}/api/connections/${user?.id}`)
      const connData = await connRes.json()
      if (connRes.ok) {
        setConnections(connData)
      }

      // Fetch pending requests
      if (token) {
        const reqRes = await fetch(`${API_BASE_URL}/api/connections/user/pending`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const reqData = await reqRes.json()
        if (reqRes.ok) {
          setPendingRequests(reqData)
        }
      }
    } catch (err) {
      console.error('Failed to fetch connections network', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (requestId: number) => {
    if (!token) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/connections/${requestId}/accept`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        // Find the accepted request and add to connections list
        const accepted = pendingRequests.find(req => req.id === requestId)
        if (accepted) {
          setConnections(prev => [...prev, {
            id: accepted.user_id,
            first_name: accepted.first_name,
            last_name: accepted.last_name,
            headline: accepted.headline,
            profile_picture_url: accepted.profile_picture_url
          }])
        }
        setPendingRequests(prev => prev.filter(req => req.id !== requestId))
        alert('Connection request accepted!')
      }
    } catch (err) {
      console.error('Failed to accept request', err)
    }
  }

  const handleReject = async (requestId: number) => {
    if (!token) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/connections/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        setPendingRequests(prev => prev.filter(req => req.id !== requestId))
        alert('Connection request rejected.')
      }
    } catch (err) {
      console.error('Failed to reject request', err)
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: '100%', padding: '0' }}>
      <div className="card">
        <h1>Florante Network</h1>
        <p style={{ color: 'var(--text-light)', marginBottom: '24px' }}>View and manage your community connections, request invitations, and grow your professional developer network.</p>
        
        {loading ? (
          <p>Loading your network...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* Pending Requests Section */}
            {pendingRequests.length > 0 && (
              <div>
                <h2 style={{ fontSize: '18px', borderBottom: '2px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>
                  Pending Invitations ({pendingRequests.length})
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {pendingRequests.map(req => (
                    <div key={req.id} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '20px', border: '1px dashed var(--primary)' }}>
                      <div style={{ fontSize: '40px', marginBottom: '12px' }}>👤</div>
                      <h3 style={{ fontSize: '16px' }}>{req.first_name} {req.last_name}</h3>
                      <p className="text-muted text-small" style={{ minHeight: '36px', margin: '4px 0 16px 0' }}>{req.headline || 'Technical Member'}</p>
                      <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                        <button onClick={() => handleAccept(req.id)} className="btn btn-primary btn-sm" style={{ flex: 1 }}>Accept</button>
                        <button onClick={() => handleReject(req.id)} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>Ignore</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* My Connections Section */}
            <div>
              <h2 style={{ fontSize: '18px', borderBottom: '2px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>
                Connected Members ({connections.length})
              </h2>
              {connections.length === 0 ? (
                <p className="text-muted">You do not have any connections yet. Start connecting with members!</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                  {connections.map(conn => (
                    <div key={conn.id} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '20px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '40px', marginBottom: '12px' }}>👤</div>
                      <h3 style={{ fontSize: '16px' }}>{conn.first_name} {conn.last_name}</h3>
                      <p className="text-muted text-small" style={{ minHeight: '36px', margin: '4px 0 16px 0' }}>{conn.headline || 'Technical Member'}</p>
                      <button onClick={() => navigate(`/profile/${conn.id}`)} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                        View Profile
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  )
}

export default ConnectionsPage
