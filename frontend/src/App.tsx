import { Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { HomePage, Dashboard, AIMode, Player, Artists, ArtistDetail, StationDetail, AuthCallback, NotFound, ForgotPassword, ResetPassword } from './pages';
import { ProtectedRoute, GlobalSpotifyPlayer, GlobalHeader } from './components';
import { SpotifyPlayerProvider, FollowedArtistsProvider } from './context';

function AppContent() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isAuthPage = location.pathname === '/forgot-password' || location.pathname === '/reset-password';

  return (
    <>
      {!isHomePage && !isAuthPage && <GlobalHeader />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/ai-mode" 
          element={
            <ProtectedRoute>
              <AIMode />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/player" 
          element={
            <ProtectedRoute>
              <Player />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/artists" 
          element={
            <ProtectedRoute>
              <Artists />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/artists/:artistId"
          element={
            <ProtectedRoute>
              <ArtistDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/station/:stationId"
          element={
            <ProtectedRoute>
              <StationDetail />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <GlobalSpotifyPlayer />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </>
  );
}

function App() {
  return (
    <FollowedArtistsProvider>
      <SpotifyPlayerProvider>
        <AppContent />
      </SpotifyPlayerProvider>
    </FollowedArtistsProvider>
  );
}

export default App;

