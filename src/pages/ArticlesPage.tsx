import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { formatDistanceToNow } from 'date-fns'

interface Article {
  id: number
  title: string
  content: string
  featured_image_url: string
  views_count: number
  likes_count: number
  comments_count: number
  published_at: string
  first_name: string
  last_name: string
  profile_picture_url: string
}

interface ArticleComment {
  id: number
  article_id: number
  user_id: number
  content: string
  created_at: string
  first_name: string
  last_name: string
  profile_picture_url: string
}

const ArticlesPage: React.FC = () => {
  const { token } = useAuthStore()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedArticleId, setExpandedArticleId] = useState<number | null>(null)
  const [comments, setComments] = useState<ArticleComment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async () => {
    setLoading(true)
    try {
      const res = await fetch('http://localhost:5000/api/articles')
      const data = await res.json()
      if (res.ok) {
        setArticles(data)
      }
    } catch (err) {
      console.error('Failed to fetch articles', err)
    } finally {
      setLoading(false)
    }
  }

  const handleArticleClick = async (articleId: number) => {
    if (expandedArticleId === articleId) {
      setExpandedArticleId(null)
      setComments([])
      return
    }

    setExpandedArticleId(articleId)
    setLoadingComments(true)
    try {
      // Fetch article comments
      const res = await fetch(`http://localhost:5000/api/articles/${articleId}/comments`)
      const data = await res.json()
      if (res.ok) {
        setComments(data)
      }

      // Proactively trigger view increment
      fetch(`http://localhost:5000/api/articles/${articleId}`)
    } catch (err) {
      console.error('Failed to fetch article details/comments', err)
    } finally {
      setLoadingComments(false)
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent, articleId: number) => {
    e.preventDefault()
    if (!newComment.trim() || !token) return
    try {
      const res = await fetch(`http://localhost:5000/api/articles/${articleId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment })
      })
      const data = await res.json()
      if (res.ok) {
        setComments(prev => [...prev, {
          ...data,
          first_name: 'You',
          last_name: '',
          profile_picture_url: ''
        }])
        setNewComment('')
        // Increment comments count locally
        setArticles(prev => prev.map(art => art.id === articleId ? { ...art, comments_count: art.comments_count + 1 } : art))
      }
    } catch (err) {
      console.error('Failed to submit comment', err)
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: '100%', padding: '0' }}>
      <div className="card">
        <h1>Articles</h1>
        <p style={{ marginBottom: '24px', color: 'var(--text-light)' }}>Explore long-form articles, engineering design specs, and industry insights written by community members.</p>

        {loading ? (
          <p>Loading articles...</p>
        ) : articles.length === 0 ? (
          <p>No articles published yet.</p>
        ) : (
          articles.map(article => {
            const isExpanded = expandedArticleId === article.id
            return (
              <div key={article.id} className="card" style={{ marginBottom: '20px', border: '1px solid var(--border)' }}>
                {article.featured_image_url && (
                  <img 
                    src={article.featured_image_url} 
                    alt={article.title} 
                    style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px', marginBottom: '12px' }} 
                  />
                )}
                <h3 style={{ fontSize: '20px', cursor: 'pointer', color: 'var(--primary)' }} onClick={() => handleArticleClick(article.id)}>
                  {article.title}
                </h3>
                <p className="text-muted" style={{ fontSize: '13px', margin: '4px 0 12px 0' }}>
                  By {article.first_name} {article.last_name} • {formatDistanceToNow(new Date(article.published_at))} ago
                </p>
                
                {isExpanded ? (
                  <div style={{ margin: '16px 0', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    <p style={{ lineHeight: '1.6', fontSize: '15px', color: '#333', whiteSpace: 'pre-line' }}>{article.content}</p>
                    
                    {/* Comments section */}
                    <div style={{ marginTop: '24px', borderTop: '2px solid var(--border)', paddingTop: '16px' }}>
                      <h4>Comments ({article.comments_count})</h4>
                      {token && (
                        <form onSubmit={(e) => handleCommentSubmit(e, article.id)} style={{ display: 'flex', gap: '8px', margin: '12px 0' }}>
                          <input
                            type="text"
                            placeholder="Add your comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            style={{ flexGrow: 1, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '4px' }}
                          />
                          <button type="submit" className="btn btn-primary btn-sm">Comment</button>
                        </form>
                      )}

                      {loadingComments ? (
                        <p className="text-small">Loading comments...</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                          {comments.map(c => (
                            <div key={c.id} style={{ display: 'flex', gap: '10px', background: '#f8f9fa', padding: '10px', borderRadius: '6px' }}>
                              <div style={{ fontSize: '20px' }}>👤</div>
                              <div>
                                <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{c.first_name} {c.last_name}</span>
                                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#444' }}>{c.content}</p>
                              </div>
                            </div>
                          ))}
                          {comments.length === 0 && <p className="text-muted text-small">No comments yet. Be the first to comment!</p>}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p>{article.content.substring(0, 150)}...</p>
                )}

                <div style={{ marginTop: '12px', display: 'flex', gap: '24px', color: 'var(--text-light)', fontSize: '13px' }}>
                  <span>👁️ {article.views_count} views</span>
                  <span>❤️ {article.likes_count} likes</span>
                  <span>💬 {article.comments_count} comments</span>
                  <button 
                    onClick={() => handleArticleClick(article.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold', padding: 0 }}
                  >
                    {isExpanded ? 'Show Less' : 'Read Article'}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default ArticlesPage
