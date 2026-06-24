import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import './Navbar.css'
import { API_BASE_URL } from '../api';

const Navbar: React.FC = () => {
  const { user, logout, token } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{
    users: any[]
    posts: any[]
    jobs: any[]
  } | null>(null)
  const [showResults, setShowResults] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const hamburgerRef = useRef<HTMLButtonElement>(null)

  const handleLogout = () => {
    logout()
    navigate('/login')
    setIsMenuOpen(false)
  }

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearchQuery(val)
    if (!val.trim()) {
      setSearchResults(null)
      return
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/search/all/${encodeURIComponent(val)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        setSearchResults(data)
      }
    } catch (err) {
      console.error('Failed to search', err)
    }
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        hamburgerRef.current &&
        !hamburgerRef.current.contains(event.target as Node)
      ) {
        closeMenu()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuOpen])

  // Close search results when clicking outside
  useEffect(() => {
    const clickOutside = () => setShowResults(false)
    document.addEventListener('click', clickOutside)
    return () => document.removeEventListener('click', clickOutside)
  }, [])

  // Close menu on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMenu()
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [])

  const navItems = [
    { to: '/feed', icon: '⊞', label: 'Timeline' },
    { to: '/connections', icon: '👥', label: 'People' },
    { to: '/jobs', icon: '💼', label: 'Opportunities' },
    { to: '/messages', icon: '✉️', label: 'Inbox' },
    { to: '/questions', icon: '❖', label: 'Knowledge' },
    { to: '/chat', icon: '💬', label: 'Lounge' },
    { to: `/profile/${user?.id}`, icon: '👤', label: 'My Profile' },
  ]

  return (
    <nav className="navbar" onClick={(e) => e.stopPropagation()}>
      <div className="navbar-container">
        <Link to="/feed" className="navbar-brand">
          Florante Community
        </Link>

        {/* Global Search Bar */}
        <div className="navbar-search-container">
          <input
            type="text"
            placeholder="Search database (people, threads, jobs)..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setShowResults(true)}
            className="navbar-search-input"
          />
          {showResults && searchResults && (
            <div className="navbar-search-dropdown">
              {searchResults.users && searchResults.users.length > 0 && (
                <div className="search-section">
                  <div className="search-section-header">People</div>
                  {searchResults.users.map((u) => (
                    <div
                      key={u.id}
                      className="search-item"
                      onClick={() => {
                        setShowResults(false)
                        setSearchQuery('')
                        navigate(`/profile/${u.id}`)
                      }}
                    >
                      <span className="search-item-avatar">👤</span>
                      <div>
                        <div className="search-item-name">{u.name}</div>
                        <div className="search-item-sub">{u.headline}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchResults.posts && searchResults.posts.length > 0 && (
                <div className="search-section">
                  <div className="search-section-header">Timeline Threads</div>
                  {searchResults.posts.map((p) => (
                    <div
                      key={p.id}
                      className="search-item"
                      onClick={() => {
                        setShowResults(false)
                        setSearchQuery('')
                        navigate(`/feed`)
                      }}
                    >
                      <span className="search-item-icon">⊞</span>
                      <div className="search-item-name excerpt">{p.name}</div>
                    </div>
                  ))}
                </div>
              )}

              {searchResults.jobs && searchResults.jobs.length > 0 && (
                <div className="search-section">
                  <div className="search-section-header">Opportunities</div>
                  {searchResults.jobs.map((j) => (
                    <div
                      key={j.id}
                      className="search-item"
                      onClick={() => {
                        setShowResults(false)
                        setSearchQuery('')
                        navigate(`/jobs`)
                      }}
                    >
                      <span className="search-item-icon">💼</span>
                      <div className="search-item-name">{j.name}</div>
                    </div>
                  ))}
                </div>
              )}

              {(!searchResults.users || searchResults.users.length === 0) &&
               (!searchResults.posts || searchResults.posts.length === 0) &&
               (!searchResults.jobs || searchResults.jobs.length === 0) && (
                <div className="search-no-results">No results found for "{searchQuery}"</div>
              )}
            </div>
          )}
        </div>

        {/* Desktop Navigation */}
        <div className="navbar-menu desktop-menu">
          {navItems.map((item) => (
            <Link key={item.to} to={item.to} className={`nav-item ${location.pathname.startsWith(item.to) ? 'active' : ''}`}>
              <span className="icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Hamburger Menu Button */}
        <button 
          ref={hamburgerRef}
          className={`hamburger-menu ${isMenuOpen ? 'active' : ''}`} 
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>

        {/* Mobile Dropdown Menu */}
        {isMenuOpen && (
          <div ref={menuRef} className="mobile-menu-dropdown">
            <div className="mobile-menu-items">
              {navItems.map((item) => (
                <Link 
                  key={item.to} 
                  to={item.to} 
                  className={`mobile-nav-item ${location.pathname.startsWith(item.to) ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  <span className="icon">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
              <button className="mobile-logout-btn" onClick={handleLogout}>
                <span className="icon">🚪</span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}

        {/* Desktop Logout Button */}
        <div className="navbar-footer desktop-logout">
          <button className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar