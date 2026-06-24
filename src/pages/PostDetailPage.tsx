import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { formatDistanceToNow } from 'date-fns'
import './PostDetail.css'
import { API_BASE_URL } from '../api';

interface Post {
  id: number
  user_id: number
  content: string
  first_name: string
  last_name: string
  profile_picture_url: string
  headline: string
  likes_count: number
  comments_count: number
  created_at: string
  image_urls: string[] | string
  video_url: string | null
}

interface Comment {
  id: number
  post_id: number
  user_id: number
  content: string
  created_at: string
  first_name: string
  last_name: string
  profile_picture_url: string
}

// Unused icons removed

const PostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { token } = useAuthStore()
  const navigate = useNavigate()
  
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [likesCount, setLikesCount] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingComments, setLoadingComments] = useState(false)
  const [error, setError] = useState('')
  const [isMuted, setIsMuted] = useState(true)
  const [isPlaying, setIsPlaying] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (id) {
      fetchPostDetails()
    }
  }, [id])

  const fetchPostDetails = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) {
        throw new Error('Post not found')
      }
      const data = await res.json()
      setPost(data)
      setLikesCount(data.likes_count)
      
      // Fetch comments for this post
      fetchComments()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to load post details')
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    setLoadingComments(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/${id}/comments`)
      if (res.ok) {
        const data = await res.json()
        setComments(data)
      }
    } catch (err) {
      console.error('Failed to fetch comments', err)
    } finally {
      setLoadingComments(false)
    }
  }

  const handleLike = async () => {
    if (!post) return
    try {
      const method = isLiked ? 'DELETE' : 'POST'
      const res = await fetch(`${API_BASE_URL}/api/posts/${post.id}/like`, {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        setIsLiked(!isLiked)
        setLikesCount(prev => isLiked ? Math.max(prev - 1, 0) : prev + 1)
      }
    } catch (err) {
      console.error('Error liking post', err)
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!post || !newComment.trim()) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/${post.id}/comments`, {
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
        // Optionally reload post to get updated comment count
        setPost(prev => prev ? { ...prev, comments_count: prev.comments_count + 1 } : null)
      }
    } catch (err) {
      console.error('Error submitting comment', err)
    }
  }

  const handleShare = () => {
    if (!post) return
    const postUrl = `${window.location.origin}/posts/${post.id}`
    navigator.clipboard.writeText(postUrl)
    alert('Post link copied to clipboard! Share it with your friends.')
  }

  const toggleMute = () => {
    if (videoRef.current) {
      const newMutedState = !videoRef.current.muted
      videoRef.current.muted = newMutedState
      setIsMuted(newMutedState)
      setVolume(newMutedState ? 0 : 1)
    }
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      videoRef.current.muted = newVolume === 0
      setVolume(newVolume)
      setIsMuted(newVolume === 0)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const formatTime = (timeInSeconds: number) => {
    const mins = Math.floor(timeInSeconds / 60)
    const secs = Math.floor(timeInSeconds % 60)
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  if (loading) {
    return (
      <div className="post-detail-container flex-center">
        <div className="loading-spinner">Loading post details...</div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="post-detail-container flex-center">
        <div className="error-card">
          <h2>⚠️ Error</h2>
          <p>{error || 'The post could not be found or has been deleted.'}</p>
          <button onClick={() => navigate('/feed')} className="btn btn-primary">Back to Feed</button>
        </div>
      </div>
    )
  }

  const parsedImageUrls = Array.isArray(post.image_urls)
    ? post.image_urls
    : (post.image_urls ? [post.image_urls] : [])

  const hasMedia = post.video_url || parsedImageUrls.length > 0

  return (
    <div className={`post-detail-page ${hasMedia ? 'has-media-layout' : 'text-only-layout'}`}>
      
      {/* Back button overlay */}
      <button className="post-detail-back-btn" onClick={() => navigate('/feed')}>
        ← Back
      </button>

      {hasMedia ? (
        <div className="detail-split-container">
          
          {/* Media Column (Left) */}
          <div className="detail-media-column">
            <div className="post-media-container detail-view">
              
              {/* Video Element */}
              {post.video_url && (
                <div className="post-video-wrapper detail-view" onClick={(e) => { e.stopPropagation(); togglePlay(); }}>
                  <video
                    ref={videoRef}
                    src={post.video_url}
                    className="post-video detail-view"
                    playsInline
                    autoPlay
                    loop
                    muted={isMuted}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                  />
                  <div className="video-controls-overlay detail-view" onClick={(e) => e.stopPropagation()}>
                    <button className="video-control-btn" onClick={togglePlay}>
                      {isPlaying ? '⏸' : '▶'}
                    </button>
                    <div className="video-timeline-wrapper">
                      <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        className="video-timeline-slider"
                      />
                      <span className="video-time-display">{formatTime(currentTime)} / {formatTime(duration)}</span>
                    </div>
                    <div className="video-volume-wrapper">
                      <button className="video-control-btn volume-icon-btn" onClick={toggleMute}>
                        {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="video-volume-slider"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Images Grid */}
              {!post.video_url && parsedImageUrls.length > 0 && (
                <div className="post-images-grid detail-view">
                  {parsedImageUrls.map((url: string, index: number) => (
                    <img key={index} src={url} alt={`attachment-${index}`} className="post-attachment-img detail-view" />
                  ))}
                </div>
              )}

              {/* TikTok Vertical Actions Overlay */}
              <div className="media-vertical-actions">
                <div className="vertical-action-item">
                  <button className={`vertical-btn ${isLiked ? 'liked' : ''}`} onClick={handleLike} title="Like">
                    {isLiked ? '❤️' : '🤍'}
                  </button>
                  <span className="vertical-action-label">{likesCount}</span>
                </div>
                <div className="vertical-action-item">
                  <button className="vertical-btn" onClick={() => {
                    const commentInput = document.getElementById('detail-comment-input');
                    if (commentInput) commentInput.focus();
                  }} title="Comment">
                    💬
                  </button>
                  <span className="vertical-action-label">{comments.length}</span>
                </div>
                <div className="vertical-action-item">
                  <button className="vertical-btn" onClick={handleShare} title="Share Link">
                    🔄
                  </button>
                </div>
                <div className="vertical-action-item">
                  <button className="vertical-btn votes-btn" onClick={() => navigate('/questions?tab=votes')} title="Knowledge Votes">
                    🗳️
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Details & Comments Column (Right) */}
          <div className="detail-info-column">
            
            {/* Header info */}
            <div className="post-header border-bottom">
              <div className="post-user-info">
                <div className="avatar">👤</div>
                <div>
                  <h3>{post.first_name} {post.last_name}</h3>
                  <p className="text-muted text-small">{post.headline}</p>
                  <p className="text-muted text-extra-small">
                    {formatDistanceToNow(new Date(post.created_at))} ago
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="detail-description-section">
              <p className="post-content detail-text">{post.content}</p>
            </div>

            {/* Comments list container */}
            <div className="detail-comments-list-wrapper">
              <h4>Comments ({comments.length})</h4>
              
              {loadingComments ? (
                <p className="text-muted text-small">Loading comments...</p>
              ) : comments.length === 0 ? (
                <p className="text-muted text-small empty-comments">No comments yet. Start the conversation!</p>
              ) : (
                <div className="comments-list detail-view">
                  {comments.map((c) => (
                    <div key={c.id} className="comment-item detail-view">
                      <div className="comment-avatar">👤</div>
                      <div className="comment-content-box">
                        <div className="comment-author">{c.first_name} {c.last_name}</div>
                        <div className="comment-text">{c.content}</div>
                        <div className="comment-time">
                          {formatDistanceToNow(new Date(c.created_at))} ago
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comment form at the bottom */}
            <div className="detail-comment-form-container">
              <form onSubmit={handleCommentSubmit} className="comment-form detail-view">
                <input
                  id="detail-comment-input"
                  type="text"
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary btn-sm">Post</button>
              </form>
            </div>

          </div>

        </div>
      ) : (
        /* Text Only Page Layout (Centered Post Card) */
        <div className="detail-centered-container">
          <div className="card post-card detail-view text-only">
            
            {/* Header */}
            <div className="post-header">
              <div className="post-user-info">
                <div className="avatar">👤</div>
                <div>
                  <h3>{post.first_name} {post.last_name}</h3>
                  <p className="text-muted text-small">{post.headline}</p>
                  <p className="text-muted text-extra-small">
                    {formatDistanceToNow(new Date(post.created_at))} ago
                  </p>
                </div>
              </div>
            </div>

            {/* Text description */}
            <p className="post-content detail-text">{post.content}</p>

            {/* Stats row */}
            <div className="post-stats">
              <span>{likesCount} likes</span>
              <span>{comments.length} comments</span>
            </div>

            {/* Flat Layout Action Icons */}
            <div className="post-actions flat-icons">
              <button className={`action-btn-icon ${isLiked ? 'active' : ''}`} onClick={handleLike} title="Like">
                {isLiked ? '❤️' : '🤍'}
              </button>
              <button className="action-btn-icon" onClick={() => {
                const commentInput = document.getElementById('centered-comment-input');
                if (commentInput) commentInput.focus();
              }} title="Comment">
                💬
              </button>
              <button className="action-btn-icon" onClick={handleShare} title="Share Link">
                🔄
              </button>
              <button className="action-btn-icon votes-btn" onClick={() => navigate('/questions?tab=votes')} title="Knowledge Votes">
                🗳️
              </button>
            </div>

            {/* Comments block */}
            <div className="post-comments-section detail-view">
              <form onSubmit={handleCommentSubmit} className="comment-form">
                <input
                  id="centered-comment-input"
                  type="text"
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary btn-sm">Comment</button>
              </form>

              {loadingComments ? (
                <p className="text-small" style={{ margin: '8px 0', color: 'black' }}>Loading comments...</p>
              ) : (
                <div className="comments-list">
                  {comments.map((c) => (
                    <div key={c.id} className="comment-item">
                      <div className="comment-avatar">👤</div>
                      <div className="comment-content-box">
                        <div className="comment-author">{c.first_name} {c.last_name}</div>
                        <div className="comment-text">{c.content}</div>
                        <div className="comment-time" style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>
                          {formatDistanceToNow(new Date(c.created_at))} ago
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

export default PostDetailPage
