import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import './Chat.css'

interface ChatRoom {
  id: number
  name: string
  description: string
  tags: string[]
  owner_id: number
  created_at: string
  active_users: string
  last_message: string | null
  last_message_at: string | null
  last_message_sender: string | null
}

const ChatExplorePage: React.FC = () => {
  const { token } = useAuthStore()
  const navigate = useNavigate()

  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  // Form states for creating room
  const [roomName, setRoomName] = useState('')
  const [roomDesc, setRoomDesc] = useState('')
  const [roomTags, setRoomTags] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchRooms()
  }, [])

  const fetchRooms = async () => {
    setLoading(true)
    try {
      const res = await fetch('http://localhost:5000/api/chat/rooms', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        setRooms(data)
      }
    } catch (err) {
      console.error('Failed to fetch rooms', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!roomName.trim()) {
      setError('Room name is required')
      return
    }

    setCreating(true)
    try {
      const res = await fetch('http://localhost:5000/api/chat/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: roomName.trim(),
          description: roomDesc.trim(),
          tags: roomTags
        })
      })
      const data = await res.json()
      if (res.ok) {
        setShowModal(false)
        setRoomName('')
        setRoomDesc('')
        setRoomTags('')
        // Append new room and navigate to it or refetch
        setRooms([
          {
            ...data,
            active_users: '0',
            last_message: null,
            last_message_at: null,
            last_message_sender: null
          },
          ...rooms
        ])
        navigate(`/chat/${data.id}`)
      } else {
        setError(data.error || 'Failed to create room')
      }
    } catch (err) {
      console.error('Error creating room', err)
      setError('An error occurred. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="forum-container">
      {/* Main Area */}
      <div className="forum-main-content">
        <div className="chat-header">
          <div className="chat-logo-section">
            <div className="chat-logo-icon">💬</div>
            <div className="chat-logo-title">
              Florante <span>chat lounge</span>
            </div>
          </div>

          <div className="chat-tabs">
            <div className="chat-tab active">Explore Lounge</div>
            <div onClick={() => setShowModal(true)} className="chat-tab" style={{ color: 'var(--chat-link)', fontWeight: 'bold' }}>
              + Create Lounge Room
            </div>
          </div>
        </div>

        {/* Dashboard grid */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', fontSize: '15px', color: 'var(--chat-muted)' }}>
            Loading chat rooms...
          </div>
        ) : rooms.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed var(--chat-border)', borderRadius: '4px' }}>
            <h4>No active chat rooms found.</h4>
            <button onClick={() => setShowModal(true)} className="so-btn-orange" style={{ marginTop: '12px' }}>
              Create the First Room
            </button>
          </div>
        ) : (
          <div className="chat-rooms-grid">
            {rooms.map((room) => {
              const activeUsersNum = parseInt(room.active_users)

              return (
                <div key={room.id} className="chat-room-card">
                  <div>
                    <Link to={`/chat/${room.id}`} className="chat-room-name">
                      {room.name}
                    </Link>
                    <div className="chat-room-desc">{room.description}</div>
                  </div>

                  {/* Room tags row */}
                  <div className="so-tags-row" style={{ marginTop: '6px', marginBottom: '4px' }}>
                    {room.tags && room.tags.map((t) => (
                      <span key={t} className="so-tag-badge" style={{ fontSize: '10px', padding: '2px 4px' }}>
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Card bottom meta */}
                  <div className="chat-room-meta">
                    <div className="chat-room-users">
                      👤 {activeUsersNum} user{activeUsersNum !== 1 ? 's' : ''} active
                    </div>
                    <button onClick={() => navigate(`/chat/${room.id}`)} className="chat-room-btn">
                      Join
                    </button>
                  </div>

                  {room.last_message && (
                    <div style={{ fontSize: '10px', color: 'var(--chat-muted)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <strong>{room.last_message_sender}:</strong> {room.last_message}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal for creating a new room */}
      {showModal && (
        <div className="chat-modal-overlay">
          <div className="chat-modal">
            <h2>Create a new chat room</h2>
            <form onSubmit={handleCreateRoom}>
              {error && (
                <div style={{ color: 'red', fontSize: '12px', marginBottom: '8px' }}>
                  {error}
                </div>
              )}
              <div className="so-form-group">
                <label className="so-form-label" style={{ fontSize: '13px' }}>Room Name</label>
                <input
                  type="text"
                  className="so-form-input"
                  placeholder="e.g. C++ Developers"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  required
                />
              </div>

              <div className="so-form-group" style={{ marginTop: '12px' }}>
                <label className="so-form-label" style={{ fontSize: '13px' }}>Description</label>
                <input
                  type="text"
                  className="so-form-input"
                  placeholder="e.g. Chat about core design, libraries, and compiler details"
                  value={roomDesc}
                  onChange={(e) => setRoomDesc(e.target.value)}
                />
              </div>

              <div className="so-form-group" style={{ marginTop: '12px' }}>
                <label className="so-form-label" style={{ fontSize: '13px' }}>Tags (comma-separated)</label>
                <input
                  type="text"
                  className="so-form-input"
                  placeholder="e.g. cpp, compiler, stl"
                  value={roomTags}
                  onChange={(e) => setRoomTags(e.target.value)}
                />
              </div>

              <div className="chat-modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="chat-btn-cancel">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="chat-btn-submit">
                  {creating ? 'Creating...' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatExplorePage
