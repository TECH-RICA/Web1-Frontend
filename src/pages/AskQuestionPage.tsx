import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import './Questions.css'

const AskQuestionPage: React.FC = () => {
  const { token } = useAuthStore()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim() || title.trim().length < 15) {
      setError('Title must be at least 15 characters long.')
      return
    }

    if (!content.trim() || content.trim().length < 30) {
      setError('Body must be at least 30 characters long to provide enough detail.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('http://localhost:5000/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          tags: tags
        })
      })

      const data = await res.json()
      if (res.ok) {
        navigate(`/questions/${data.id}`)
      } else {
        setError(data.error || 'Failed to submit question')
      }
    } catch (err) {
      console.error('Error posting question', err)
      setError('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="forum-ask-container">
      <div className="forum-ask-header">
        <h1>Ask a Community Question</h1>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ padding: '12px', backgroundColor: 'var(--primary-light)', border: '2px solid var(--primary)', color: 'black', borderRadius: '4px', marginBottom: '16px', fontSize: '14px', fontWeight: 'bold' }}>
            {error}
          </div>
        )}

        {/* Title Input Card */}
        <div className="card forum-form-card">
          <div className="forum-form-group">
            <label className="forum-form-label" htmlFor="title">Question Title</label>
            <span className="forum-form-helper">Be descriptive. Imagine you are explaining your problem to another community member.</span>
            <input
              id="title"
              type="text"
              className="forum-form-input"
              placeholder="e.g. How to handle connection pooling with Neon Serverless Postgres in a Node.js backend?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Body Text Area Card */}
        <div className="card forum-form-card">
          <div className="forum-form-group">
            <label className="forum-form-label" htmlFor="body">What are the details of your question?</label>
            <span className="forum-form-helper">Provide context, describe what you have tried, and include code snippets if applicable. Minimum 30 characters.</span>
            <textarea
              id="body"
              className="forum-form-textarea"
              placeholder="Explain the background details of your query here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Tags Input Card */}
        <div className="card forum-form-card">
          <div className="forum-form-group">
            <label className="forum-form-label" htmlFor="tags">Tags</label>
            <span className="forum-form-helper">Add up to 5 tags to categorize your question, separated by commas.</span>
            <input
              id="tags"
              type="text"
              className="forum-form-input"
              placeholder="e.g. javascript, node, neon, postgres"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{ cursor: 'pointer' }}
          >
            {submitting ? 'Publishing...' : 'Publish Question'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/questions')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default AskQuestionPage
