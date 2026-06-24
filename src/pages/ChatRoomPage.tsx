import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { format } from 'date-fns'
import './Chat.css'
import { API_BASE_URL } from '../api';

interface User {
  id: number
  first_name: string
  last_name: string
  profile_picture_url: string
  headline: string
}

interface ChatRoom {
  id: number
  name: string
  description: string
  tags: string[]
  owner_id: number
}

interface ChatMessage {
  id: number
  room_id: number
  sender_id: number
  content: string
  created_at: string
  first_name: string
  last_name: string
  profile_picture_url: string
  star_count: number
  is_starred: boolean
}

interface StarredMessage {
  id: number
  content: string
  first_name: string
  last_name: string
  star_count: number
}

const ChatRoomPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { token } = useAuthStore()

  const [room, setRoom] = useState<ChatRoom | null>(null)
  const [activeUsers, setActiveUsers] = useState<User[]>([])
  const [starredMessages, setStarredMessages] = useState<StarredMessage[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollingRef = useRef<number | null>(null)

  useEffect(() => {
    fetchRoomDetails()
    fetchMessages()

    // Setup polling every 3 seconds for new messages and active user lists
    const intervalId = window.setInterval(() => {
      pollMessagesAndDetails()
    }, 3000)
    pollingRef.current = intervalId

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [id])

  // Scroll to bottom when message size increases
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchRoomDetails = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat/rooms/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        setRoom(data.room)
        setActiveUsers(data.activeUsers)
        setStarredMessages(data.starredMessages)
      }
    } catch (err) {
      console.error('Error fetching room details', err)
    }
  }

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat/rooms/${id}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        setMessages(data)
      }
    } catch (err) {
      console.error('Error fetching messages', err)
    } finally {
      setLoading(false)
    }
  }

  const pollMessagesAndDetails = async () => {
    try {
      // Fetch room details
      const detailsRes = await fetch(`${API_BASE_URL}/api/chat/rooms/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (detailsRes.ok) {
        const detailsData = await detailsRes.json()
        setActiveUsers(detailsData.activeUsers)
        setStarredMessages(detailsData.starredMessages)
      }

      // Fetch messages
      const msgsRes = await fetch(`${API_BASE_URL}/api/chat/rooms/${id}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (msgsRes.ok) {
        const msgsData = await msgsRes.json()
        
        // Only update state if new messages arrived to prevent infinite scroll updates
        if (msgsData.length !== messages.length || (msgsData.length > 0 && msgsData[msgsData.length - 1].id !== messages[messages.length - 1]?.id)) {
          setMessages(msgsData)
        } else {
          // Sync star updates on current messages
          setMessages(prev => prev.map(p => {
            const match = msgsData.find((m: ChatMessage) => m.id === p.id)
            return match ? { ...p, star_count: match.star_count, is_starred: match.is_starred } : p
          }))
        }
      }
    } catch (err) {
      console.error('Error polling chat messages', err)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim() || sending) return

    setSending(true)
    const contentToSend = inputMessage.trim()
    setInputMessage('')

    try {
      const res = await fetch(`${API_BASE_URL}/api/chat/rooms/${id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: contentToSend })
      })
      const data = await res.json()
      if (res.ok) {
        setMessages(prev => [...prev, data])
      } else {
        alert(data.error || 'Failed to send message')
      }
    } catch (err) {
      console.error('Error sending message', err)
    } finally {
      setSending(false)
    }
  }

  const handleStarMessage = async (messageId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat/messages/${messageId}/star`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        // Update local message state
        setMessages(messages.map(m => {
          if (m.id === messageId) {
            return { ...m, star_count: data.star_count, is_starred: data.is_starred }
          }
          return m
        }))

        // Refresh starred messages list
        fetchRoomDetails()
      }
    } catch (err) {
      console.error('Error starring message', err)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  // Parse inline and block code snippet blocks
  const renderMessageContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g)
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const code = part.slice(3, -3).trim()
        return (
          <pre key={index}>
            <code>{code}</code>
          </pre>
        )
      } else {
        const subParts = part.split(/(`[^`\n]+`)/g)
        return (
          <span key={index}>
            {subParts.map((subPart, subIndex) => {
              if (subPart.startsWith('`') && subPart.endsWith('`')) {
                return <code key={subIndex}>{subPart.slice(1, -1)}</code>
              }
              return subPart
            })}
          </span>
        )
      }
    })
  }

  if (loading) {
    return (
      <div className="forum-container flex-center" style={{ minHeight: '60vh' }}>
        <div style={{ fontSize: '18px', color: 'black' }}>Entering chat room...</div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="forum-container flex-center" style={{ minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', color: 'black', marginBottom: '16px' }}>⚠️ Error</div>
          <p>Chat room not found or access denied.</p>
          <Link to="/chat" className="btn btn-primary" style={{ display: 'inline-block', marginTop: '20px' }}>
            Back to Chat Rooms
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="forum-container">
      {/* Main Content Area */}
      <div className="forum-main-content">
        <div className="chatroom-layout">
          {/* Timeline and Input Box */}
          <div className="chatroom-main">
            <div className="chatroom-header">
              <div>
                <div className="chatroom-title">{room.name}</div>
                <div className="chatroom-desc-text">{room.description}</div>
              </div>
              <Link to="/chat" className="btn btn-secondary" style={{ padding: '6px 12px' }}>
                Leave
              </Link>
            </div>

            {/* Message stream */}
            <div className="chat-messages-timeline">
              {messages.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', color: 'black' }}>
                  This room has no messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((msg, index) => {
                  // Check if we can group this message with the previous one
                  // Group if same sender AND within 2 minutes of the previous message
                  const prevMsg = index > 0 ? messages[index - 1] : null
                  const isGrouped = prevMsg && 
                    prevMsg.sender_id === msg.sender_id &&
                    (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime()) < 120000

                  return (
                    <div key={msg.id} className="chat-message-group" style={{ marginTop: isGrouped ? '-6px' : '8px' }}>
                      {/* Avatar placeholder - only show if not grouped */}
                      <div className="chat-message-avatar" style={{ visibility: isGrouped ? 'hidden' : 'visible' }}>
                        {msg.profile_picture_url ? (
                          <img src={msg.profile_picture_url} alt="avatar" />
                        ) : (
                          '👤'
                        )}
                      </div>

                      <div className="chat-message-content-wrapper">
                        {/* Sender name - only show if not grouped */}
                        {!isGrouped && (
                          <span className="chat-message-sender-name">
                            {msg.first_name} {msg.last_name}
                          </span>
                        )}

                        <div className="chat-message-bubble">
                          {renderMessageContent(msg.content)}
                          
                          {/* Star count and action */}
                          <span 
                            onClick={() => handleStarMessage(msg.id)}
                            className={`chat-message-star-action ${msg.is_starred ? 'starred' : ''}`}
                            title="Star this message"
                          >
                            ★ {msg.star_count > 0 && msg.star_count}
                          </span>
                          <span className="chat-message-time">
                            {format(new Date(msg.created_at), 'HH:mm')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input form */}
            <div className="chatroom-input-pane">
              <form onSubmit={handleSendMessage}>
                <div className="chatroom-input-group">
                  <textarea
                    className="chatroom-textarea"
                    placeholder="Type a message... (Markdown code blocks supported, press Enter to send, Shift+Enter for new line)"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    required
                  />
                  <button
                    type="submit"
                    className="btn btn-primary chatroom-send-btn"
                    disabled={sending || !inputMessage.trim()}
                  >
                    Send
                  </button>
                </div>
                <div className="chatroom-input-tips">
                  Use backticks for code: \`let x = 5;\` or triple backticks for blocks.
                </div>
              </form>
            </div>
          </div>

          {/* Right Sidebar - Users & Stars */}
          <div className="chatroom-sidebar">
            {/* Active Users */}
            <div className="chatroom-sidebar-panel">
              <h3>Active Users ({activeUsers.length})</h3>
              <div className="chatroom-users-list">
                {activeUsers.map((u) => (
                  <div key={u.id} className="chatroom-user-badge" title={u.headline}>
                    <div className="chatroom-user-badge-avatar">
                      {u.profile_picture_url ? (
                        <img src={u.profile_picture_url} style={{ width: '100%', height: '100%', borderRadius: '50%' }} alt="av" />
                      ) : (
                        '👤'
                      )}
                    </div>
                    <span>{u.first_name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Starred Messages */}
            <div className="chatroom-sidebar-panel" style={{ flexGrow: 1, minHeight: '180px', overflowY: 'auto' }}>
              <h3>Starred Messages ({starredMessages.length})</h3>
              {starredMessages.length === 0 ? (
                <div style={{ color: 'black', fontSize: '11px', textAlign: 'center', marginTop: '20px' }}>
                  No starred messages in this room yet.
                </div>
              ) : (
                starredMessages.map((sm) => (
                  <div key={sm.id} className="chatroom-starred-item">
                    <div className="chatroom-starred-text">
                      {sm.content}
                    </div>
                    <div className="chatroom-starred-meta">
                      <span>by {sm.first_name}</span>
                      <span className="chatroom-star-indicator">★ {sm.star_count}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatRoomPage
