import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import './Feed.css'

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

interface ActiveMember {
  id: number
  first_name: string
  last_name: string
  profile_picture_url: string
  skills: string[]
  current_position: string
}

interface TrendingTopic {
  id: number
  name: string
  discussion_count: number
}

// Modern SVG Icons
const HeartIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill={active ? "#ff3b30" : "none"} stroke={active ? "#ff3b30" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
)

const CommentIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
)

const ShareIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
)

const VoteIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
)

const PostCardComponent: React.FC<{ post: Post; token: string }> = ({ post, token }) => {
  const navigate = useNavigate()
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [isLiked, setIsLiked] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsCount, setCommentsCount] = useState(post.comments_count)
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [isPlaying, setIsPlaying] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

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

  const handleLike = async () => {
    try {
      const method = isLiked ? 'DELETE' : 'POST'
      const res = await fetch(`http://localhost:5000/api/posts/${post.id}/like`, {
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

  const fetchComments = async () => {
    setLoadingComments(true)
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${post.id}/comments`)
      const data = await res.json()
      if (res.ok) {
        setComments(data)
      }
    } catch (err) {
      console.error('Failed to fetch comments', err)
    } finally {
      setLoadingComments(false)
    }
  }

  const toggleComments = () => {
    if (!showComments) {
      fetchComments()
    }
    setShowComments(!showComments)
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${post.id}/comments`, {
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
        setCommentsCount(prev => prev + 1)
      }
    } catch (err) {
      console.error('Error submitting comment', err)
    }
  }

  const handleShare = () => {
    const postUrl = `${window.location.origin}/posts/${post.id}`
    navigator.clipboard.writeText(postUrl)
    alert('Post link copied to clipboard! Share it with your friends.')
  }

  const parsedImageUrls = Array.isArray(post.image_urls)
    ? post.image_urls
    : (post.image_urls ? [post.image_urls] : [])

  const hasMedia = post.video_url || parsedImageUrls.length > 0

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (
      target.closest('.media-vertical-actions') ||
      target.closest('.post-actions') ||
      target.closest('.post-comments-section') ||
      target.closest('.video-volume-btn') ||
      target.closest('.avatar') ||
      target.closest('.comment-avatar') ||
      target.tagName === 'BUTTON' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'A'
    ) {
      return
    }
    navigate(`/posts/${post.id}`)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000)
    if (diff < 1) return 'Just now'
    if (diff < 60) return `${diff}m ago`
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="card post-card clickable" onClick={handleCardClick}>
      <div className="post-header">
        <div className="post-user-info">
          <div className="avatar">{post.profile_picture_url ? <img src={post.profile_picture_url} alt="avatar" /> : '👤'}</div>
          <div>
            <h3>{post.first_name} {post.last_name}</h3>
            <p className="text-muted text-small">{post.headline} · {formatDate(post.created_at)}</p>
          </div>
        </div>
      </div>

      <p className="post-content">{post.content}</p>

      {hasMedia && (
        <div className="post-media-container">
          {parsedImageUrls.length > 0 && !post.video_url && (
            <div className={`post-images-grid ${parsedImageUrls.length === 1 ? 'single' : ''}`}>
              {parsedImageUrls.map((url: string, index: number) => (
                <img key={index} src={url} alt={`attachment-${index}`} className="post-attachment-img" />
              ))}
            </div>
          )}

          {post.video_url && (
            <div className="post-video-wrapper" onClick={(e) => { e.stopPropagation(); togglePlay(); }}>
              <video
                ref={videoRef}
                src={post.video_url}
                className="post-video"
                playsInline
                autoPlay
                loop
                muted={isMuted}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              />
              <div className="video-controls-overlay" onClick={(e) => e.stopPropagation()}>
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

          <div className="media-vertical-actions">
            <div className="vertical-action-item">
              <button className={`vertical-btn ${isLiked ? 'liked' : ''}`} onClick={(e) => { e.stopPropagation(); handleLike(); }} title="Like">
                <HeartIcon active={isLiked} />
              </button>
              <span className="vertical-action-label">{likesCount}</span>
            </div>
            <div className="vertical-action-item">
              <button className="vertical-btn" onClick={(e) => { e.stopPropagation(); toggleComments(); }} title="Comment">
                <CommentIcon />
              </button>
              <span className="vertical-action-label">{commentsCount}</span>
            </div>
            <div className="vertical-action-item">
              <button className="vertical-btn" onClick={(e) => { e.stopPropagation(); handleShare(); }} title="Share Link">
                <ShareIcon />
              </button>
            </div>
            <div className="vertical-action-item">
              <button className="vertical-btn votes-btn" onClick={(e) => { e.stopPropagation(); navigate('/questions?tab=votes'); }} title="Knowledge Votes">
                <VoteIcon />
              </button>
            </div>
          </div>
        </div>
      )}

      {!hasMedia && (
        <>
          <div className="post-stats">
            <span className="stat-item"><span className="stat-icon">❤️</span> {likesCount}</span>
            <span className="stat-item" onClick={toggleComments} style={{ cursor: 'pointer' }}><span className="stat-icon">💬</span> {commentsCount}</span>
          </div>
          <div className="post-actions flat-icons">
            <button className={`action-btn-icon ${isLiked ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); handleLike(); }} title="Like">
              <HeartIcon active={isLiked} />
              <span>{isLiked ? 'Liked' : 'Like'}</span>
            </button>
            <button className="action-btn-icon" onClick={(e) => { e.stopPropagation(); toggleComments(); }} title="Comment">
              <CommentIcon />
              <span>Comment</span>
            </button>
            <button className="action-btn-icon" onClick={(e) => { e.stopPropagation(); handleShare(); }} title="Share">
              <ShareIcon />
              <span>Share</span>
            </button>
            <button className="action-btn-icon votes-btn" onClick={(e) => { e.stopPropagation(); navigate('/questions?tab=votes'); }} title="Votes">
              <VoteIcon />
              <span>Vote</span>
            </button>
          </div>
        </>
      )}

      {showComments && (
        <div className="post-comments-section">
          <form onSubmit={handleCommentSubmit} className="comment-form">
            <input
              type="text"
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm">Post</button>
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const FeedPage: React.FC = () => {
  const { token } = useAuthStore()
  const [posts, setPosts] = useState<Post[]>([])
  const [activeMembers, setActiveMembers] = useState<ActiveMember[]>([])
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([])
  const [content, setContent] = useState('')
  const [imageUrls, setImageUrls] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [showMediaForm, setShowMediaForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchPosts()
    fetchActiveMembers()
    fetchTrendingTopics()
  }, [])

  const fetchActiveMembers = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/users/active-members', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        setActiveMembers(await res.json())
      }
    } catch (err) {
      console.error('Failed to fetch active members', err)
    }
  }

  const fetchTrendingTopics = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/posts/trending/topics', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        setTrendingTopics(await res.json())
      }
    } catch (err) {
      console.error('Failed to fetch trending topics', err)
    }
  }

  const handleConnect = async (userId: number) => {
    try {
      const res = await fetch('http://localhost:5000/api/connections/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ connected_user_id: userId })
      })
      if (res.ok) {
        alert('Connection request sent!')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to send request')
      }
    } catch (err) {
      console.error('Failed to send connection request', err)
    }
  }

  const fetchPosts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/posts/feed', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setPosts(data)
    } catch (err) {
      console.error('Failed to fetch posts', err)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files))
    }
  }

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() && selectedFiles.length === 0 && !imageUrls && !videoUrl) return

    setLoading(true)
    let uploadedImageUrls: string[] = []
    let uploadedVideoUrl: string | null = null

    if (selectedFiles.length > 0) {
      setUploadingMedia(true)
      const formData = new FormData()
      selectedFiles.forEach(file => {
        formData.append('media', file)
      })

      try {
        const uploadRes = await fetch('http://localhost:5000/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        })
        const uploadData = await uploadRes.json()
        if (uploadRes.ok) {
          uploadData.urls.forEach((url: string) => {
            if (url.match(/\.(mp4|mov|avi|wmv)$/i) || url.includes('video')) {
              if (!uploadedVideoUrl) uploadedVideoUrl = url
            } else {
              uploadedImageUrls.push(url)
            }
          })
        } else {
          alert('Failed to upload media: ' + uploadData.error)
          setUploadingMedia(false)
          setLoading(false)
          return
        }
      } catch (err) {
        console.error('Upload error:', err)
        alert('Upload error. Please try again.')
        setUploadingMedia(false)
        setLoading(false)
        return
      }
      setUploadingMedia(false)
    }

    try {
      const res = await fetch('http://localhost:5000/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content,
          image_urls: uploadedImageUrls.length > 0 ? uploadedImageUrls : (imageUrls ? imageUrls.split(',').map(u => u.trim()) : []),
          video_url: uploadedVideoUrl ? uploadedVideoUrl : (videoUrl ? videoUrl.trim() : null),
          visibility: 'public'
        })
      })
      const newPost = await res.json()
      
      setPosts([{
        ...newPost,
        first_name: 'You',
        last_name: '',
        profile_picture_url: '',
        headline: 'Author'
      }, ...posts])
      
      setContent('')
      setImageUrls('')
      setVideoUrl('')
      setSelectedFiles([])
      if (fileInputRef.current) fileInputRef.current.value = ''
      setShowMediaForm(false)
    } catch (err) {
      console.error('Failed to create post', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="feed-container">
      <div className="feed-content">
        <div className="card create-post">
          <form onSubmit={handlePostSubmit}>
            <div className="post-input-group">
              <div className="user-avatar">👤</div>
              <input
                type="text"
                placeholder="Start a community discussion thread..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
            <div className="post-actions create-actions">
              <div className="media-toggle-group">
                <button type="button" className={`media-toggle-btn ${showMediaForm ? 'active' : ''}`} onClick={() => setShowMediaForm(!showMediaForm)}>
                  <span className="media-icon">📸</span>
                  <span>{showMediaForm ? 'Hide Media' : 'Add Media'}</span>
                </button>
              </div>
              <button type="submit" className="btn btn-primary publish-btn" disabled={loading || (!content.trim() && selectedFiles.length === 0 && !imageUrls && !videoUrl)}>
                {loading ? (uploadingMedia ? 'Uploading...' : 'Publishing...') : 'Publish Thread'}
              </button>
            </div>

            {showMediaForm && (
              <div className="post-media-fields">
                <div className="form-group">
                  <label className="text-small font-weight-600">Upload Media <span className="text-muted">(Images, Videos, Files)</span></label>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="file-input"
                    style={{ display: 'block', padding: '10px 0' }}
                  />
                  {selectedFiles.length > 0 && (
                    <div className="selected-files-list" style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {selectedFiles.map((f, i) => (
                        <span key={i} className="badge" style={{ background: '#f1f5f9', color: '#1e293b', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{f.name}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label className="text-small font-weight-600">Or use Image URLs <span className="text-muted">(comma-separated)</span></label>
                  <input
                    type="text"
                    placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                    value={imageUrls}
                    onChange={(e) => setImageUrls(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="text-small font-weight-600">Or use Video URL</label>
                  <input
                    type="text"
                    placeholder="https://example.com/video.mp4"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                  />
                </div>
              </div>
            )}
          </form>
        </div>

        {posts.map((post) => (
          <PostCardComponent key={post.id} post={post} token={token || ''} />
        ))}
      </div>

      <div className="feed-sidebar">
        <div className="card sidebar-card">
          <div className="sidebar-header">
            <h3>🔥 Active Members</h3>
          </div>
          {activeMembers.map((member) => (
            <div key={member.id} className="suggested-item">
              <div className="avatar small">
                {member.profile_picture_url ? <img src={member.profile_picture_url} alt="avatar" /> : '👤'}
              </div>
              <div>
                <p className="font-weight-600">{member.first_name} {member.last_name}</p>
                <p className="text-small text-muted">{member.skills && member.skills.length > 0 ? member.skills[0] : member.current_position}</p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => handleConnect(member.id)}>Connect</button>
            </div>
          ))}
          {activeMembers.length === 0 && <p className="text-muted text-small">No active members found.</p>}
        </div>

        <div className="card sidebar-card">
          <div className="sidebar-header">
            <h3>📈 Trending Topics</h3>
          </div>
          {trendingTopics.map((topic, index) => (
            <div key={topic.id} className="trending-item">
              <span className="trending-rank">#{index + 1}</span>
              <div>
                <p className="font-weight-600">{topic.name}</p>
                <p className="text-small text-muted">{topic.discussion_count} discussions</p>
              </div>
            </div>
          ))}
          {trendingTopics.length === 0 && <p className="text-muted text-small">No trending topics found.</p>}
        </div>
      </div>
    </div>
  )
}

export default FeedPage