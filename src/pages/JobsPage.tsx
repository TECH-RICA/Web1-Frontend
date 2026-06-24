import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { API_BASE_URL } from '../api';

interface Job {
  id: number
  title: string
  description: string
  location: string
  employment_type: string
  experience_level: string
  salary_min: string
  salary_max: string
  first_name: string
  last_name: string
}

const JobsPage: React.FC = () => {
  const { token } = useAuthStore()
  const [jobs, setJobs] = useState<Job[]>([])
  const [appliedJobs, setAppliedJobs] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedExperience, setSelectedExperience] = useState<string>('')

  useEffect(() => {
    fetchJobs()
  }, [selectedExperience])

  const fetchJobs = async () => {
    setLoading(true)
    try {
      let url = `${API_BASE_URL}/api/jobs`
      if (selectedExperience) {
        url += `?experience_level=${selectedExperience}`
      }
      const res = await fetch(url)
      const data = await res.json()
      if (res.ok) {
        setJobs(data)
      }
    } catch (err) {
      console.error('Failed to fetch jobs', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async (jobId: number) => {
    if (!token) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          resume_url: 'https://raw.githubusercontent.com/resume/sample.pdf',
          cover_letter: 'Applying via Opportunities Hub.'
        })
      })
      if (res.ok) {
        setAppliedJobs(prev => [...prev, jobId])
        alert('Application submitted successfully!')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to submit application.')
      }
    } catch (err) {
      console.error('Failed to apply', err)
    }
  }

  const formatSalary = (min: any, max: any) => {
    if (!min && !max) return 'Competitive'
    const formatNum = (num: any) => {
      const val = parseFloat(num)
      if (isNaN(val)) return ''
      return val >= 1000 ? `$${(val / 1000).toFixed(0)}K` : `$${val}`
    }
    if (min && max) return `${formatNum(min)} - ${formatNum(max)}`
    return min ? `${formatNum(min)}+` : `${formatNum(max)} max`
  }

  const handleFilterChange = (level: string) => {
    if (selectedExperience === level) {
      setSelectedExperience('')
    } else {
      setSelectedExperience(level)
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: '100%', padding: '0' }}>
      <div className="card">
        <h1>Opportunities Hub</h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', marginTop: '24px' }}>
          <div>
            {loading ? (
              <p>Loading jobs...</p>
            ) : jobs.length === 0 ? (
              <p>No job postings found.</p>
            ) : (
              jobs.map(job => {
                const isApplied = appliedJobs.includes(job.id)
                return (
                  <div key={job.id} className="card" style={{ marginBottom: '16px' }}>
                    <h3>{job.title}</h3>
                    <p className="text-muted">Posted by: {job.first_name} {job.last_name}</p>
                    <p className="text-small">{job.location} ({job.experience_level})</p>
                    <p style={{ marginTop: '8px', fontSize: '14px', lineHeight: '1.5' }}>{job.description}</p>
                    <div style={{ marginTop: '12px', display: 'flex', gap: '12px' }}>
                      <span className="text-small" style={{ background: 'var(--secondary)', padding: '4px 8px', borderRadius: '4px' }}>{job.employment_type}</span>
                      <span className="text-small" style={{ background: 'var(--secondary)', padding: '4px 8px', borderRadius: '4px' }}>{formatSalary(job.salary_min, job.salary_max)}</span>
                    </div>
                    <button 
                      onClick={() => handleApply(job.id)} 
                      className="btn btn-primary" 
                      style={{ marginTop: '12px' }}
                      disabled={isApplied}
                    >
                      {isApplied ? 'Applied' : 'Apply'}
                    </button>
                  </div>
                )
              })
            )}
          </div>

          <div className="card">
            <h3>Filters</h3>
            <div style={{ marginTop: '12px' }}>
              <p className="font-weight-600">Experience Level</p>
              <label>
                <input 
                  type="checkbox" 
                  checked={selectedExperience === 'Entry'} 
                  onChange={() => handleFilterChange('Entry')} 
                /> Entry
              </label><br />
              <label>
                <input 
                  type="checkbox" 
                  checked={selectedExperience === 'Mid'} 
                  onChange={() => handleFilterChange('Mid')} 
                /> Mid
              </label><br />
              <label>
                <input 
                  type="checkbox" 
                  checked={selectedExperience === 'Senior'} 
                  onChange={() => handleFilterChange('Senior')} 
                /> Senior
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JobsPage
