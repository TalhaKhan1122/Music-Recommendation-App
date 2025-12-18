import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { Track } from '../api/music.api';

interface SpotifyPlayerContextValue {
  currentTrack: Track | null;
  spotifyReference: string | null;
  playTrack: (track: Track, reference: string) => void;
  stopPlayer: () => void;
}

const SpotifyPlayerContext = createContext<SpotifyPlayerContextValue | undefined>(undefined);

interface SpotifyPlayerProviderProps {
  children: React.ReactNode;
}

export const SpotifyPlayerProvider: React.FC<SpotifyPlayerProviderProps> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [spotifyReference, setSpotifyReference] = useState<string | null>(null);

  const playTrack = useCallback((track: Track, reference: string) => {
    console.log('🎵 SpotifyPlayerContext: playTrack called');
    console.log('   Track:', track.name);
    console.log('   Reference:', reference);
    setCurrentTrack(track);
    setSpotifyReference(reference);
    console.log('✅ SpotifyPlayerContext: Track and reference set');
  }, []);

  const stopPlayer = useCallback(() => {
    setCurrentTrack(null);
    setSpotifyReference(null);
  }, []);

  const value = useMemo(
    () => ({
      currentTrack,
      spotifyReference,
      playTrack,
      stopPlayer,
    }),
    [currentTrack, spotifyReference, playTrack, stopPlayer]
  );

  return (
    <SpotifyPlayerContext.Provider value={value}>
      {children}
    </SpotifyPlayerContext.Provider>
  );
};

export const useSpotifyPlayer = (): SpotifyPlayerContextValue => {
  const context = useContext(SpotifyPlayerContext);
  if (!context) {
    throw new Error('useSpotifyPlayer must be used within a SpotifyPlayerProvider');
  }
  return context;
};


