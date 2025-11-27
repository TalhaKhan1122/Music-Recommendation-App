import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { HomePage, Dashboard, AIMode, Player, Artists, ArtistDetail, AuthCallback, NotFound } from './pages';
import { ProtectedRoute, GlobalSpotifyPlayer } from './components';
import { SpotifyPlayerProvider, FollowedArtistsProvider } from './context';

function App() {
  return (
    <FollowedArtistsProvider>
      <SpotifyPlayerProvider>
        <>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
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
      </SpotifyPlayerProvider>
    </FollowedArtistsProvider>
  );
}

export default App;

