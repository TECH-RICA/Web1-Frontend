import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

interface UserProfile {
  id: number
  first_name: string
  last_name: string
  headline: string
  bio: string
  location: string
  profile_picture_url: string
}

const ProfilePage: React.FC = () => {
  const { userId } = useParams()
  const { token } = useAuthStore()
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    fetchProfile()
  }, [userId])

  const fetchProfile = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/users/${userId}/full-profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setProfile(data)
    } catch (err) {
      console.error('Failed to fetch profile', err)
    }
  }

  if (!profile) return <div>Loading...</div>

  return (
    <div className="profile-container">
      <div className="profile-header" style={{ backgroundImage: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)' }}>
        <div className="cover-image" />
      </div>

      <div className="profile-content">
        <div className="profile-info">
          <div className="avatar-large">👤</div>
          <div>
            <h1>{profile.first_name} {profile.last_name}</h1>
            <p className="headline">{profile.headline}</p>
            <p className="location">{profile.location}</p>
          </div>
          <button className="btn btn-primary">Connect</button>
        </div>

        <div className="profile-bio">
          <p>{profile.bio}</p>
        </div>

        <div className="profile-sections">
          <section className="card">
            <h2>About</h2>
            <p>{profile.bio}</p>
          </section>

          <section className="card">
            <h2>Experience</h2>
            <p>No experience added yet</p>
          </section>

          <section className="card">
            <h2>Education</h2>
            <p>No education added yet</p>
          </section>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
