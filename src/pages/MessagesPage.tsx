import React, { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import { formatDistanceToNow } from 'date-fns'

interface Conversation {
  id: number
  updated_at: string
  participant_id: number
  first_name: string
  last_name: string
  profile_picture_url: string
  headline: string
  last_message: string | null
  last_message_at: string | null
}

interface Message {
  id: number
  conversation_id: number
  sender_id: number
  content: string
  created_at: string
  first_name: string
  last_name: string
  profile_picture_url: string
}

const MessagesPage: React.FC = () => {
  const { user, token } = useAuthStore()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (token) {
      fetchConversations()
    }
  }, [token])

  useEffect(() => {
    if (selectedConv && token) {
      fetchMessages(selectedConv.id)
    }
  }, [selectedConv, token])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchConversations = async () => {
    setLoadingConvs(true)
    try {
      const res = await fetch('http://localhost:5000/api/messages/conversations', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        setConversations(data)
      }
    } catch (err) {
      console.error('Failed to fetch conversations', err)
    } finally {
      setLoadingConvs(false)
    }
  }

  const fetchMessages = async (convId: number) => {
    setLoadingMessages(true)
    try {
      const res = await fetch(`http://localhost:5000/api/messages/${convId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        setMessages(data)
      }
    } catch (err) {
      console.error('Failed to fetch messages', err)
    } finally {
      setLoadingMessages(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConv || !token) return

    try {
      const res = await fetch('http://localhost:5000/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          conversation_id: selectedConv.id,
          content: newMessage.trim()
        })
      })
      const data = await res.json()
      if (res.ok) {
        const appendedMessage: Message = {
          ...data,
          first_name: user?.first_name || 'You',
          last_name: user?.last_name || '',
          profile_picture_url: ''
        }
        setMessages(prev => [...prev, appendedMessage])
        
        // Update local conversation list to reflect new last message
        setConversations(prev => prev.map(c => 
          c.id === selectedConv.id 
            ? { ...c, last_message: newMessage.trim(), last_message_at: new Date().toISOString() }
            : c
        ))
        
        setNewMessage('')
      }
    } catch (err) {
      console.error('Failed to send message', err)
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: '100%', padding: '0', display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', height: 'calc(100vh - 120px)' }}>
      {/* Left Pane - Inbox Channels */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Inbox Lounge</h2>
        
        {loadingConvs ? (
          <p>Loading chats...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flexGrow: 1 }}>
            {conversations.map(conv => {
              const isSelected = selectedConv?.id === conv.id
              return (
                <div 
                  key={conv.id} 
                  onClick={() => setSelectedConv(conv)}
                  style={{ 
                    padding: '12px', 
                    borderBottom: '1px solid var(--border)', 
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: isSelected ? 'var(--primary-light)' : 'transparent',
                    border: isSelected ? '1.5px solid var(--primary)' : '1.5px solid transparent',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ fontSize: '28px' }}>👤</div>
                    <div style={{ flexGrow: 1, overflow: 'hidden' }}>
                      <p className="font-weight-600" style={{ margin: 0, fontSize: '14px' }}>{conv.first_name} {conv.last_name}</p>
                      <p className="text-small text-muted" style={{ margin: '2px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {conv.last_message || 'Start messaging...'}
                      </p>
                    </div>
                  </div>
                  {conv.last_message_at && (
                    <p className="text-extra-small text-muted" style={{ textAlign: 'right', margin: '6px 0 0 0', fontSize: '10px' }}>
                      {formatDistanceToNow(new Date(conv.last_message_at))} ago
                    </p>
                  )}
                </div>
              )}
            )}
            {conversations.length === 0 && <p className="text-muted text-small">No conversations found.</p>}
          </div>
        )}
      </div>

      {/* Right Pane - Chat Window */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' }}>
        {selectedConv ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            
            {/* Active User Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1.5px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ fontSize: '32px' }}>👤</div>
              <div>
                <h3 style={{ fontSize: '16px', margin: 0 }}>{selectedConv.first_name} {selectedConv.last_name}</h3>
                <p className="text-muted text-small" style={{ margin: '2px 0 0 0' }}>{selectedConv.headline || 'Developer Community Member'}</p>
              </div>
            </div>

            {/* Messages Log */}
            <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '8px', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              {loadingMessages ? (
                <p className="text-muted">Loading messages...</p>
              ) : (
                messages.map(msg => {
                  const isMe = msg.sender_id === user?.id
                  return (
                    <div 
                      key={msg.id} 
                      style={{ 
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '70%',
                        background: isMe ? 'var(--primary)' : '#f1f3f5',
                        color: isMe ? 'white' : 'black',
                        padding: '10px 14px',
                        borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                      }}
                    >
                      {!isMe && (
                        <p style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: 'bold', color: 'var(--primary-dark)' }}>
                          {msg.first_name}
                        </p>
                      )}
                      <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.4', wordBreak: 'break-word' }}>{msg.content}</p>
                      <p style={{ 
                        margin: '4px 0 0 0', 
                        fontSize: '9px', 
                        textAlign: 'right', 
                        color: isMe ? 'rgba(255,255,255,0.7)' : '#868e96' 
                      }}>
                        {formatDistanceToNow(new Date(msg.created_at))} ago
                      </p>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input bar */}
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px', borderTop: '1.5px solid var(--border)', paddingTop: '16px' }}>
              <input 
                type="text" 
                placeholder="Type a message..." 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                style={{ flexGrow: 1, padding: '10px 16px', border: '1.5px solid var(--border)', borderRadius: '6px' }}
              />
              <button type="submit" className="btn btn-primary">Send</button>
            </form>

          </div>
        ) : (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', gap: '12px' }}>
            <div style={{ fontSize: '48px' }}>💬</div>
            <h3>Florante Inbox Lounge</h3>
            <p className="text-small text-muted">Select a conversation from the left sidebar to start messaging in real-time.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default MessagesPage
