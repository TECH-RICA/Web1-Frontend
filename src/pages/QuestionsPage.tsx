import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
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
  answers_count: string
  has_accepted_answer: boolean
}

const QuestionsPage: React.FC = () => {
  const { token } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [questions, setQuestions] = useState<Question[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Read URL params
  const tab = searchParams.get('tab') || 'newest'
  const page = parseInt(searchParams.get('page') || '1')
  const query = searchParams.get('q') || ''
  const tag = searchParams.get('tag') || ''
  const limit = 10
  const offset = (page - 1) * limit

  useEffect(() => {
    fetchQuestions()
    if (query) {
      setSearchQuery(query)
    } else {
      setSearchQuery('')
    }
  }, [tab, page, query, tag])

  const fetchQuestions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('tab', tab)
      params.append('limit', limit.toString())
      params.append('offset', offset.toString())
      if (query) params.append('q', query)
      if (tag) params.append('tag', tag)

      const res = await fetch(`${API_BASE_URL}/api/questions?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        setQuestions(data.questions)
        setTotalCount(data.totalCount)
      }
    } catch (err) {
      console.error('Failed to fetch questions', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchParams({ q: searchQuery, page: '1', tab })
  }

  const handleTabChange = (selectedTab: string) => {
    setSearchParams({ tab: selectedTab, page: '1', q: query, tag })
  }

  const handlePageChange = (newPage: number) => {
    setSearchParams({ tab, page: newPage.toString(), q: query, tag })
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSearchParams({ tab: 'newest', page: '1' })
  }

  const totalPages = Math.ceil(totalCount / limit)

  return (
    <div className="forum-container">
      {/* Main content pane */}
      <div className="forum-main-content">
        <div className="forum-header-row">
          <h1>{query ? 'Search Results' : tag ? `Questions tagged [${tag}]` : 'All Questions'}</h1>
          <button onClick={() => navigate('/questions/ask')} className="btn btn-primary">
            Ask Question
          </button>
        </div>

        {/* Local search bar */}
        <div style={{ marginBottom: '20px' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="forum-form-input"
              placeholder="Search title, description or use tags [reactjs]..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flexGrow: 1 }}
            />
            <button type="submit" className="btn btn-primary" style={{ cursor: 'pointer' }}>Search</button>
            {(query || tag) && (
              <button type="button" onClick={clearFilters} className="btn btn-secondary" style={{ borderRadius: '3px' }}>
                Clear
              </button>
            )}
          </form>
        </div>

        {/* Filters and count row */}
        <div className="forum-filters-row">
          <div className="forum-question-count">
            {totalCount.toLocaleString()} question{totalCount !== 1 ? 's' : ''}
          </div>

          <div className="forum-tabs-container">
            <button
              onClick={() => handleTabChange('newest')}
              className={`forum-tab-btn ${tab === 'newest' ? 'active' : ''}`}
            >
              Newest
            </button>
            <button
              onClick={() => handleTabChange('votes')}
              className={`forum-tab-btn ${tab === 'votes' ? 'active' : ''}`}
            >
              Votes
            </button>
            <button
              onClick={() => handleTabChange('unanswered')}
              className={`forum-tab-btn ${tab === 'unanswered' ? 'active' : ''}`}
            >
              Unanswered
            </button>
          </div>
        </div>

        {/* Questions list */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', fontSize: '16px', color: 'var(--text-dark)' }}>
            Loading questions...
          </div>
        ) : questions.length === 0 ? (
          <div style={{ padding: '60px 40px', textAlign: 'center', border: '2px dashed var(--border)', borderRadius: '5px' }}>
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>No questions found</div>
            <p className="text-muted">Try looking for something else or ask a new question!</p>
          </div>
        ) : (
          <div>
            {questions.map((q) => {
              const answersCountNum = parseInt(q.answers_count)
              let answersClass = 'forum-stat-badge'
              if (answersCountNum > 0) {
                answersClass += ' has-answers'
              }
              if (q.has_accepted_answer) {
                answersClass += ' has-accepted'
              }

              return (
                <div key={q.id} className="forum-question-summary card">
                  <div className="forum-question-content">
                    <h3>
                      <Link to={`/questions/${q.id}`} className="forum-question-title-link">
                        {q.title}
                      </Link>
                    </h3>
                    <p className="forum-question-excerpt">{q.content}</p>

                    {/* Inline Stats Row */}
                    <div className="forum-card-stats-row">
                      <span className="forum-stat-badge">{q.votes_count} vote{q.votes_count !== 1 ? 's' : ''}</span>
                      <span className={answersClass}>{answersCountNum} answer{answersCountNum !== 1 ? 's' : ''}</span>
                      <span className="forum-stat-badge">{q.views_count} view{q.views_count !== 1 ? 's' : ''}</span>
                    </div>

                    <div className="forum-question-footer">
                      <div className="forum-tags-row">
                        {q.tags && q.tags.map((t) => (
                          <Link
                            key={t}
                            to={`/questions?tag=${t}`}
                            className="forum-tag-badge"
                          >
                            {t}
                          </Link>
                        ))}
                      </div>

                      <div className="forum-user-card">
                        <div className="avatar-box">
                          {q.profile_picture_url ? (
                            <img src={q.profile_picture_url} className="avatar-image" alt="avatar" />
                          ) : (
                            '👤'
                          )}
                        </div>
                        <div className="user-details">
                          <span className="username">
                            {q.first_name} {q.last_name}
                          </span>
                          <span style={{ fontSize: '10px', color: 'black' }}>
                            asked {formatDistanceToNow(new Date(q.created_at))} ago
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="forum-pagination">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="forum-page-btn"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pNum) => (
                  <button
                    key={pNum}
                    onClick={() => handlePageChange(pNum)}
                    className={`forum-page-btn ${page === pNum ? 'active' : ''}`}
                  >
                    {pNum}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="forum-page-btn"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Sidebar Widget */}
      <div className="forum-right-sidebar">
        <div className="forum-sidebar-card">
          <div className="card-header">Community Announcements</div>
          <div className="card-body">
            <ul>
              <li>
                <span>◈</span>
                <a href="#">Why is the developer community so obsessed with Rust?</a>
              </li>
              <li>
                <span>◈</span>
                <a href="#">Announcing the Florante Tech Forum launch.</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="forum-sidebar-card">
          <div className="card-header">Helpful Guidelines</div>
          <div className="card-body">
            <ul>
              <li>
                <span>◈</span>
                <a href="#">How to format code block in your discussions.</a>
              </li>
              <li>
                <span>◈</span>
                <a href="#">Community Rules & guidelines update.</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="forum-sidebar-card" style={{ backgroundColor: '#ffffff', borderColor: 'var(--border)' }}>
          <div className="card-header" style={{ backgroundColor: 'var(--primary-light)', borderBottomColor: 'var(--border)' }}>
            Popular Tags
          </div>
          <div className="card-body" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['javascript', 'reactjs', 'css', 'html', 'python', 'node', 'fastapi'].map(pt => (
              <Link key={pt} to={`/questions?tag=${pt}`} className="forum-tag-badge">
                {pt}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuestionsPage
