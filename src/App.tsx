import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import FeedPage from './pages/FeedPage'
import ProfilePage from './pages/ProfilePage'
import ConnectionsPage from './pages/ConnectionsPage'
import MessagesPage from './pages/MessagesPage'
import JobsPage from './pages/JobsPage'
import ArticlesPage from './pages/ArticlesPage'
import QuestionsPage from './pages/QuestionsPage'
import QuestionDetailPage from './pages/QuestionDetailPage'
import AskQuestionPage from './pages/AskQuestionPage'
import ChatExplorePage from './pages/ChatExplorePage'
import ChatRoomPage from './pages/ChatRoomPage'
import PostDetailPage from './pages/PostDetailPage'

// Components
import Navbar from './components/Navbar'

const App: React.FC = () => {
  const { user } = useAuthStore()

  return (
    <BrowserRouter>
      <div className="app-layout">
        {user && <Navbar />}
        <main className="app-content">
          <Routes>
            <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/feed" />} />
            <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/feed" />} />
            
            {user ? (
              <>
                <Route path="/feed" element={<FeedPage />} />
                <Route path="/posts/:id" element={<PostDetailPage />} />
                <Route path="/profile/:userId" element={<ProfilePage />} />
                <Route path="/connections" element={<ConnectionsPage />} />
                <Route path="/messages" element={<MessagesPage />} />
                <Route path="/jobs" element={<JobsPage />} />
                <Route path="/articles" element={<ArticlesPage />} />
                <Route path="/questions" element={<QuestionsPage />} />
                <Route path="/questions/:id" element={<QuestionDetailPage />} />
                <Route path="/questions/ask" element={<AskQuestionPage />} />
                <Route path="/chat" element={<ChatExplorePage />} />
                <Route path="/chat/:id" element={<ChatRoomPage />} />
                <Route path="/" element={<Navigate to="/feed" />} />
              </>
            ) : (
              <Route path="/" element={<Navigate to="/login" />} />
            )}
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
