import React, { useEffect } from 'react';
import { SpotifyEmbed } from '.';
import { useAuth, useSpotifyPlayer } from '../context';

const GlobalSpotifyPlayer: React.FC = () => {
  const { spotifyReference, stopPlayer, currentTrack } = useSpotifyPlayer();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated && spotifyReference) {
      stopPlayer();
    }
  }, [isAuthenticated, spotifyReference, stopPlayer]);

  if (!spotifyReference || !currentTrack) {
    return null;
  }

  const trackId = currentTrack.id || currentTrack.externalUrl || '';

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-3 md:px-10">
      <div className="w-full max-w-5xl">
        <div className="group rounded-3xl border border-white/20 bg-gradient-to-br from-[#1a0f2a]/98 via-[#0f0719]/98 to-[#05030a]/98 backdrop-blur-2xl p-5 shadow-[0_20px_60px_rgba(120,60,255,0.25)] hover:shadow-[0_25px_70px_rgba(120,60,255,0.35)] transition-all duration-300">
          {/* Spotify Embed Player */}
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm">
            <SpotifyEmbed urlOrId={spotifyReference} autoPlay compact />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSpotifyPlayer;


