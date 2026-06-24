import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { formatDistanceToNow } from 'date-fns'
import './Questions.css'
import { API_BASE_URL } from '../api';

interface Question {
  id: number
  user_id: number
  title: string
  content: string
  tags: string[]
  views_count: number
  votes_count: number
  created_at: string
  first_name: string
  last_name: string
  profile_picture_url: string
  headline: string
}

interface Answer {
  id: number
  question_id: number
  user_id: number
  content: string
  votes_count: number
  is_accepted: boolean
  created_at: string
  first_name: string
  last_name: string
  profile_picture_url: string
  headline: string
  user_vote: number
}

const QuestionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { token, user } = useAuthStore()
  const navigate = useNavigate()

  const [question, setQuestion] = useState<Question | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [userQuestionVote, setUserQuestionVote] = useState(0)
  const [newAnswer, setNewAnswer] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchQuestionDetails()
  }, [id])

  const fetchQuestionDetails = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/questions/${id}`, {
        headers: { 
          'Authorization': `Bearer ${token}` 
        }
      })
      const data = await res.json()
      if (res.ok) {
        setQuestion(data.question)
        setAnswers(data.answers)
        setUserQuestionVote(data.userQuestionVote)
      } else {
        setError(data.error || 'Failed to fetch question')
      }
    } catch (err) {
      console.error('Error fetching details', err)
      setError('An error occurred while loading question.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuestionVote = async (voteValue: number) => {
    if (!token) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/questions/${id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ vote_value: voteValue })
      })
      const data = await res.json()
      if (res.ok) {
        // Toggle or update vote state
        setUserQuestionVote(prev => prev === voteValue ? 0 : voteValue)
        setQuestion(q => q ? { ...q, votes_count: data.votes_count } : null)
      } else {
        alert(data.error || 'Failed to vote')
      }
    } catch (err) {
      console.error('Error voting on question', err)
    }
  }

  const handleAnswerVote = async (answerId: number, voteValue: number) => {
    if (!token) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/questions/answers/${answerId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ vote_value: voteValue })
      })
      const data = await res.json()
      if (res.ok) {
        setAnswers(answers.map(ans => {
          if (ans.id === answerId) {
            return {
              ...ans,
              votes_count: data.votes_count,
              user_vote: ans.user_vote === voteValue ? 0 : voteValue
            }
          }
          return ans
        }))
      } else {
        alert(data.error || 'Failed to vote')
      }
    } catch (err) {
      console.error('Error voting on answer', err)
    }
  }

  const handleAcceptAnswer = async (answerId: number) => {
    if (!token) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/questions/answers/${answerId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await res.json()
      if (res.ok) {
        setAnswers(answers.map(ans => {
          if (ans.id === answerId) {
            return { ...ans, is_accepted: data.is_accepted }
          }
          // Set others to false since only one can be accepted
          if (data.is_accepted) {
            return { ...ans, is_accepted: false }
          }
          return ans
        }))
      } else {
        alert(data.error || 'Failed to accept answer')
      }
    } catch (err) {
      console.error('Error accepting answer', err)
    }
  }

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAnswer.trim() || !token) return

    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/questions/${id}/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newAnswer })
      })
      const data = await res.json()
      if (res.ok) {
        setAnswers([...answers, data])
        setNewAnswer('')
      } else {
        alert(data.error || 'Failed to submit answer')
      }
    } catch (err) {
      console.error('Error submitting answer', err)
    } finally {
      setSubmitting(false)
    }
  }

  // Simple Markdown Formatter for Code Snippets
  const formatBodyText = (text: string) => {
    if (!text) return ''

    // Split text by code blocks ```
    const parts = text.split(/(```[\s\S]*?```)/g)
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        // Strip out the backticks
        const code = part.slice(3, -3).trim()
        return (
          <pre key={index}>
            <code>{code}</code>
          </pre>
        )
      } else {
        // Handle inline code `code`
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
        <div style={{ fontSize: '18px', color: 'black' }}>Loading question...</div>
      </div>
    )
  }

  if (error || !question) {
    return (
      <div className="forum-container flex-center" style={{ minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', color: 'black', marginBottom: '16px' }}>⚠️ Error</div>
          <p>{error || 'Question could not be loaded.'}</p>
          <Link to="/questions" className="btn btn-primary" style={{ display: 'inline-block', marginTop: '20px' }}>
            Back to Questions
          </Link>
        </div>
      </div>
    )
  }

  const isQuestionOwner = user?.id === question.user_id

  return (
    <div className="forum-container">
      {/* Main Content Column */}
      <div className="forum-main-content">
        {/* Title and Top Header */}
        <div style={{ borderBottom: '2px solid var(--border)', paddingBottom: '12px' }}>
          <div className="forum-header-row" style={{ marginBottom: '8px' }}>
            <h1 style={{ fontSize: '26px', flexGrow: 1 }}>{question.title}</h1>
            <button onClick={() => navigate('/questions/ask')} className="btn btn-primary" style={{ flexShrink: 0 }}>
              Ask Question
            </button>
          </div>
          {/* Metadata Row */}
          <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'black' }}>
            <span>Asked <strong>{formatDistanceToNow(new Date(question.created_at))} ago</strong></span>
            <span>Viewed <strong>{question.views_count} times</strong></span>
          </div>
        </div>

        {/* Question body layout */}
        <div className="forum-post-details card">
          <div className="forum-post-body-column">
            <div className="forum-post-text">
              {formatBodyText(question.content)}
            </div>

            {/* Tags row */}
            <div className="forum-tags-row" style={{ marginTop: '24px', marginBottom: '16px' }}>
              {question.tags && question.tags.map((t) => (
                <Link key={t} to={`/questions?tag=${t}`} className="forum-tag-badge">
                  {t}
                </Link>
              ))}
            </div>

            {/* Action bar for question voting */}
            <div className="forum-action-bar">
              <button 
                className={`forum-vote-btn up ${userQuestionVote === 1 ? 'voted' : ''}`}
                onClick={() => handleQuestionVote(1)}
              >
                ▲ Upvote ({question.votes_count})
              </button>
              <button 
                className={`forum-vote-btn down ${userQuestionVote === -1 ? 'voted' : ''}`}
                onClick={() => handleQuestionVote(-1)}
              >
                ▼ Downvote
              </button>
            </div>

            {/* Author info card */}
            <div className="forum-post-metadata">
              <div className="forum-post-author-box owner">
                <div className="post-time">
                  asked {formatDistanceToNow(new Date(question.created_at))} ago
                </div>
                <div className="forum-user-card">
                  <div className="avatar-box">
                    {question.profile_picture_url ? (
                      <img src={question.profile_picture_url} className="avatar-image" alt="avatar" />
                    ) : (
                      '👤'
                    )}
                  </div>
                  <div className="user-details">
                    <span className="username">{question.first_name} {question.last_name}</span>
                    <span style={{ fontSize: '10px', lineHeight: 1.1, color: 'black' }}>
                      {question.headline}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Answers List */}
        <div>
          <h2 className="forum-answers-header">
            {answers.length} Answer{answers.length !== 1 ? 's' : ''}
          </h2>

          {answers.map((ans) => (
            <div key={ans.id} className="forum-answer-card card">
              <div className="forum-post-body-column">
                <div className="forum-post-text">
                  {formatBodyText(ans.content)}
                </div>

                {/* Action bar for answer voting and accepting */}
                <div className="forum-action-bar">
                  <button 
                    className={`forum-vote-btn up ${ans.user_vote === 1 ? 'voted' : ''}`}
                    onClick={() => handleAnswerVote(ans.id, 1)}
                  >
                    ▲ Upvote ({ans.votes_count})
                  </button>
                  <button 
                    className={`forum-vote-btn down ${ans.user_vote === -1 ? 'voted' : ''}`}
                    onClick={() => handleAnswerVote(ans.id, -1)}
                  >
                    ▼ Downvote
                  </button>

                  {isQuestionOwner && (
                    <button 
                      className={`forum-accept-btn ${ans.is_accepted ? 'accepted' : ''}`}
                      onClick={() => handleAcceptAnswer(ans.id)}
                      title="Click to accept this solution"
                    >
                      {ans.is_accepted ? '✓ Accepted Solution' : 'Accept Solution'}
                    </button>
                  )}
                  {!isQuestionOwner && ans.is_accepted && (
                    <span className="forum-accepted-badge">✓ Accepted Solution</span>
                  )}
                </div>

                {/* Answerer user card */}
                <div className="forum-post-metadata">
                  <div className="forum-post-author-box">
                    <div className="post-time">
                      answered {formatDistanceToNow(new Date(ans.created_at))} ago
                    </div>
                    <div className="forum-user-card">
                      <div className="avatar-box">
                        {ans.profile_picture_url ? (
                          <img src={ans.profile_picture_url} className="avatar-image" alt="avatar" />
                        ) : (
                          '👤'
                        )}
                      </div>
                      <div className="user-details">
                        <span className="username">{ans.first_name} {ans.last_name}</span>
                        <span style={{ fontSize: '10px', lineHeight: 1.1, color: 'black' }}>
                          {ans.headline}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Post New Answer */}
        {token ? (
          <div className="card" style={{ marginTop: '24px' }}>
            <h3 className="forum-new-answer-header" style={{ marginBottom: '16px' }}>Your Answer</h3>
            <form onSubmit={handleAnswerSubmit} className="forum-new-answer-form">
              <textarea
                placeholder="Share your solution! Code blocks can be wrapped in triple backticks \`\`\` code here \`\`\`..."
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                style={{ width: '100%', minHeight: '150px', marginBottom: '16px' }}
                required
              />
              <button
                type="submit"
                disabled={submitting || !newAnswer.trim()}
                className="btn btn-primary"
                style={{ cursor: 'pointer' }}
              >
                {submitting ? 'Submitting...' : 'Post Your Answer'}
              </button>
            </form>
          </div>
        ) : (
          <div style={{ marginTop: '24px', padding: '16px', backgroundColor: 'var(--primary-light)', border: '2px solid var(--primary)', borderRadius: '4px', textAlign: 'center' }}>
            Please <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>login</Link> to post an answer.
          </div>
        )}
      </div>
    </div>
  )
}

export default QuestionDetailPage
