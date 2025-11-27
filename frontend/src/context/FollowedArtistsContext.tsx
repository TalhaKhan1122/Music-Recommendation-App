import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ArtistMetadata, FollowedArtistSummary } from '../api/music.api';
import {
  getFollowedArtistsFromApi,
  followArtistRequest,
  unfollowArtistRequest,
} from '../api/music.api';
import { useAuth } from './AuthContext';

interface FollowedArtistsContextValue {
  followedArtists: Record<string, FollowedArtistSummary>;
  isFollowed: (artistId: string) => boolean;
  toggleFollow: (artist: ArtistMetadata) => Promise<'followed' | 'unfollowed'>;
  unfollow: (artistId: string) => Promise<void>;
  follow: (artist: ArtistMetadata) => Promise<void>;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

interface FollowedArtistsProviderProps {
  children: React.ReactNode;
}

const FollowedArtistsContext = createContext<FollowedArtistsContextValue | undefined>(undefined);

const listToRecord = (artists: FollowedArtistSummary[]): Record<string, FollowedArtistSummary> =>
  artists.reduce<Record<string, FollowedArtistSummary>>((acc, artist) => {
    const identifier = artist?.id || artist?.artistId;
    if (!identifier) {
      return acc;
    }
    acc[identifier] = {
      ...artist,
      id: identifier,
    };
    return acc;
  }, {});

export const FollowedArtistsProvider: React.FC<FollowedArtistsProviderProps> = ({ children }) => {
  const [followedArtists, setFollowedArtists] = useState<Record<string, FollowedArtistSummary>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const refresh = useCallback(async () => {
    // Don't fetch if not authenticated or auth is still loading
    if (!isAuthenticated || authLoading) {
      setFollowedArtists({});
      return;
    }

    setIsLoading(true);
    try {
      const artists = await getFollowedArtistsFromApi();
      console.log('✅ Loaded followed artists from API:', artists.length);
      setFollowedArtists(listToRecord(artists));
    } catch (error: any) {
      console.error('❌ Failed to load followed artists from API:', error);
      // Only clear if it's an auth error (401/403), otherwise keep existing data
      if (error?.status === 401 || error?.status === 403) {
        setFollowedArtists({});
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  // Refresh when authentication state changes
  useEffect(() => {
    if (!authLoading) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading]);

  const isFollowed = useCallback(
    (artistId: string) => Boolean(artistId && followedArtists[artistId]),
    [followedArtists]
  );

  const follow = useCallback(async (artist: ArtistMetadata) => {
    if (!artist?.id) {
      throw new Error('Artist id is required to follow.');
    }
    const saved = await followArtistRequest(artist);
    const identifier = saved?.id || artist.id;
    setFollowedArtists((prev) => ({
      ...prev,
      [identifier]: {
        ...saved,
        id: identifier,
      },
    }));
  }, []);

  const unfollow = useCallback(async (artistId: string) => {
    if (!artistId) {
      throw new Error('artistId is required to unfollow.');
    }
    await unfollowArtistRequest(artistId);
    setFollowedArtists((prev) => {
      if (!prev[artistId]) {
        return prev;
      }
      const next = { ...prev };
      delete next[artistId];
      return next;
    });
  }, []);

  const toggleFollow = useCallback(
    async (artist: ArtistMetadata) => {
      if (!artist?.id) {
        throw new Error('Artist id is required to toggle follow.');
      }
      if (isFollowed(artist.id)) {
        await unfollow(artist.id);
        return 'unfollowed';
      }
      await follow(artist);
      return 'followed';
    },
    [follow, isFollowed, unfollow]
  );

  const value = useMemo(
    () => ({
      followedArtists,
      isFollowed,
      toggleFollow,
      unfollow,
      follow,
      isLoading,
      refresh,
    }),
    [followedArtists, follow, isFollowed, isLoading, refresh, toggleFollow, unfollow]
  );

  return (
    <FollowedArtistsContext.Provider value={value}>
      {children}
    </FollowedArtistsContext.Provider>
  );
};

export const useFollowedArtists = (): FollowedArtistsContextValue => {
  const context = useContext(FollowedArtistsContext);
  if (!context) {
    throw new Error('useFollowedArtists must be used within a FollowedArtistsProvider');
  }
  return context;
};

