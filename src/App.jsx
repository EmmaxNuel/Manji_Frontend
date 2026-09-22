import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { TourProvider } from './features/tour/TourContext'

import { PrivateRoute, PublicRoute, CreatorRoute } from './components/auth/RouteGuards'

// Auth pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'

// Main pages
import HomePage from './pages/HomePage'
import ProfilePage from './pages/profile/ProfilePage'
import DiscoverPage from './pages/DiscoverPage'
import LibraryPage from './pages/LibraryPage'
import StoryDetailPage from './pages/stories/StoryDetailPage'
import ChapterReaderPage from './pages/reader/ChapterReaderPage'
import OfficialPage from './pages/OfficialPage'
import DownloadPage from './pages/DownloadPage'
import { NotFoundPage } from './pages/placeholders'

// Creator pages
import CreatorStudioPage from './pages/creator/CreatorStudioPage'
import CreateStoryPage from './pages/creator/CreateStoryPage'
import ChapterManagePage from './pages/creator/ChapterManagePage'
import AiStudioPage from './pages/creator/AiStudioPage'

// Projects (MANJI STUDIO)
import ProjectsPage from './features/projects/ProjectsPage'
import ProjectFormPage from './features/projects/ProjectFormPage'
import ProjectWorkspacePage from './features/projects/ProjectWorkspacePage'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <TourProvider>
            <Routes>
            {/* Public routes (redirect to / if already logged in) */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />

            {/* Open routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/download" element={<DownloadPage />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/official" element={<OfficialPage />} />
            <Route path="/profile/:username" element={<ProfilePage />} />
            <Route path="/stories/:slug" element={<StoryDetailPage />} />
            <Route path="/chapters/:id" element={<ChapterReaderPage />} />

            {/* Protected routes */}
            <Route
              path="/library"
              element={
                <PrivateRoute>
                  <LibraryPage />
                </PrivateRoute>
              }
            />

            {/* Projects – MANJI STUDIO */}
            <Route
              path="/projects"
              element={
                <PrivateRoute>
                  <ProjectsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/projects/new"
              element={
                <CreatorRoute>
                  <ProjectFormPage />
                </CreatorRoute>
              }
            />
            <Route
              path="/projects/:id"
              element={
                <PrivateRoute>
                  <ProjectWorkspacePage />
                </PrivateRoute>
              }
            />
            <Route
              path="/projects/:id/edit"
              element={
                <CreatorRoute>
                  <ProjectFormPage />
                </CreatorRoute>
              }
            />

            {/* Creator routes */}
            <Route
              path="/create"
              element={
                <PrivateRoute>
                  <CreatorStudioPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/create/ai"
              element={
                <PrivateRoute>
                  <AiStudioPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/create/new"
              element={
                <CreatorRoute>
                  <CreateStoryPage />
                </CreatorRoute>
              }
            />
            <Route
              path="/create/:slug/edit"
              element={
                <CreatorRoute>
                  <CreateStoryPage />
                </CreatorRoute>
              }
            />
            <Route
              path="/create/:slug/chapters"
              element={
                <CreatorRoute>
                  <ChapterManagePage />
                </CreatorRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--color-card)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
              },
            }}
          />
          </TourProvider>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
