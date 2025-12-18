import React, { useEffect, useState } from 'react';

interface SpotifyEmbedProps {
  urlOrId?: string; // Optional initial URL or ID
  onEmbedChange?: (embedData: { type: string; id: string; url: string }) => void;
  autoPlay?: boolean;
  compact?: boolean;
}

/**
 * Utility: Extract Spotify ID and type from a URL or raw ID
 */
const parseSpotifyInput = (input: string): { type: string; id: string } | null => {
  if (!input || input.trim() === '') {
    console.log('⚠️ parseSpotifyInput: Empty input');
    return null;
  }

  // Remove any whitespace
  const cleaned = input.trim();
  console.log('🔍 parseSpotifyInput: Cleaning input:', cleaned);

  // Try to match Spotify URL pattern
  // Matches: https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC
  // Or: spotify:track:4uLU6hMCjMI75M1A2tKUQC
  // Updated regex to handle query parameters and fragments
  const urlRegex = /(?:https?:\/\/)?(?:open\.)?spotify\.com\/(track|album|playlist|artist|episode)\/([A-Za-z0-9]+)(?:\?.*)?(?:#.*)?/;
  const uriRegex = /spotify:(track|album|playlist|artist|episode):([A-Za-z0-9]+)/;

  const urlMatch = cleaned.match(urlRegex);
  if (urlMatch) {
    console.log('✅ parseSpotifyInput: URL match found, type:', urlMatch[1], 'id:', urlMatch[2]);
    return { type: urlMatch[1], id: urlMatch[2] };
  }

  const uriMatch = cleaned.match(uriRegex);
  if (uriMatch) {
    console.log('✅ parseSpotifyInput: URI match found, type:', uriMatch[1], 'id:', uriMatch[2]);
    return { type: uriMatch[1], id: uriMatch[2] };
  }

  // Fallback: assume it's just a track ID if no URL pattern found
  // Spotify IDs are typically 22 characters alphanumeric, but can vary
  // Let's be more lenient - accept any alphanumeric string of reasonable length
  if (/^[A-Za-z0-9]{15,}$/.test(cleaned)) {
    console.log('✅ parseSpotifyInput: Assuming track ID (fallback), id:', cleaned);
    return { type: 'track', id: cleaned };
  }

  console.error('❌ parseSpotifyInput: No match found for input:', cleaned);
  return null;
};

const buildEmbedUrl = (type: string, id: string, autoPlay?: boolean) => {
  const baseUrl = `https://open.spotify.com/embed/${type}/${id}`;
  if (!autoPlay) {
    return baseUrl;
  }
  return `${baseUrl}?utm_source=embed&autoplay=1`;
};

const SpotifyEmbed: React.FC<SpotifyEmbedProps> = ({ urlOrId, onEmbedChange, autoPlay, compact }) => {
  const [input, setInput] = useState<string>(urlOrId || '');
  const [embedData, setEmbedData] = useState<{ type: string; id: string; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoplayToken, setAutoplayToken] = useState<number>(0);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    setError(null);

    if (!input || input.trim() === '') {
      setError('Please enter a Spotify URL or ID');
      return;
    }

    const parsed = parseSpotifyInput(input);
    
    if (!parsed) {
      setError('Invalid Spotify URL or ID. Please enter a valid Spotify track, album, playlist, or artist URL.');
      return;
    }

    const embedUrl = buildEmbedUrl(parsed.type, parsed.id, autoPlay);
    
    const newEmbedData = {
      type: parsed.type,
      id: parsed.id,
      url: embedUrl,
    };

    setEmbedData(newEmbedData);
    
    // Notify parent component if callback provided
    if (onEmbedChange) {
      onEmbedChange(newEmbedData);
    }
  };

  // Auto-load if urlOrId prop is provided
  React.useEffect(() => {
    console.log('🎵 SpotifyEmbed: useEffect triggered, urlOrId:', urlOrId);
    if (urlOrId && urlOrId.trim() !== '') {
      console.log('🎵 SpotifyEmbed: Auto-loading with urlOrId:', urlOrId);
      console.log('🎵 SpotifyEmbed: urlOrId type:', typeof urlOrId);
      console.log('🎵 SpotifyEmbed: urlOrId length:', urlOrId.length);
      
      // Ensure we have a valid URL format
      let processedUrl = urlOrId.trim();
      if (!processedUrl.includes('spotify.com') && !processedUrl.includes('spotify:')) {
        // If it's just an ID, construct the full URL
        if (/^[A-Za-z0-9]{15,}$/.test(processedUrl)) {
          processedUrl = `https://open.spotify.com/track/${processedUrl}`;
          console.log('🔧 Constructed full URL from ID:', processedUrl);
        }
      }
      
      setInput(processedUrl);
      // Parse and set embed data directly
      const parsed = parseSpotifyInput(processedUrl);
      console.log('🎵 SpotifyEmbed: Parsed result:', parsed);
      if (parsed) {
        const embedUrl = buildEmbedUrl(parsed.type, parsed.id, autoPlay);
        console.log('🎵 SpotifyEmbed: Parsed successfully!');
        console.log('🎵 SpotifyEmbed: Type:', parsed.type);
        console.log('🎵 SpotifyEmbed: ID:', parsed.id);
        console.log('🎵 SpotifyEmbed: Embed URL:', embedUrl);
        
        // Increment autoplay token to force iframe reload
        setAutoplayToken((prev) => prev + 1);
        
        setEmbedData({
          type: parsed.type,
          id: parsed.id,
          url: embedUrl,
        });
        setError(null);
        
        // Notify parent component if callback provided
        if (onEmbedChange) {
          onEmbedChange({
            type: parsed.type,
            id: parsed.id,
            url: embedUrl,
          });
        }
      } else {
        console.error('⚠️ SpotifyEmbed: Could not parse urlOrId:', urlOrId);
        console.error('⚠️ SpotifyEmbed: Processed URL:', processedUrl);
        console.error('⚠️ SpotifyEmbed: Input value:', JSON.stringify(urlOrId));
        setError('Invalid Spotify URL or ID');
        setEmbedData(null);
      }
    } else {
      console.log('🎵 SpotifyEmbed: No urlOrId provided or empty');
      setEmbedData(null);
      setError(null);
    }
  }, [urlOrId, autoPlay]);

  useEffect(() => {
    if (!embedData) {
      return;
    }

    // regenerate URL when autoplay token changes (forces iframe reload)
    const nextUrl = buildEmbedUrl(embedData.type, embedData.id, autoPlay);
    if (nextUrl !== embedData.url) {
      setEmbedData({ ...embedData, url: nextUrl });
      if (onEmbedChange) {
        onEmbedChange({ type: embedData.type, id: embedData.id, url: nextUrl });
      }
    }
  // intentionally ignore embedData dependencies that would loop
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, autoplayToken]);

  // autoplayToken is now incremented in the main useEffect above
  // This ensures the iframe key changes and forces a reload when urlOrId changes

  const iframeHeight =
    embedData?.type === 'track'
      ? compact
        ? 80
        : 152
      : compact
        ? 200
        : 380;

  const containerClassName = compact ? 'w-full' : 'w-full max-w-2xl mx-auto';

  return (
    <div className={containerClassName}>
      {/* Input Section - Only show if no urlOrId prop provided (standalone mode) */}
      {!urlOrId && (
        <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(null);
            }}
            placeholder="Paste Spotify URL (track, album, playlist, or artist)"
            className="flex-1 px-4 py-3 bg-gray-800/80 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            Load Player
          </button>
        </div>
        
        {error && (
          <p className="mt-2 text-red-400 text-sm">{error}</p>
        )}
        
        <p className="mt-2 text-gray-400 text-xs">
          Example: https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC
        </p>
      </form>
      )}

      {/* Embed Player */}
      {embedData ? (
        <div
          className={
            compact
              ? 'rounded-2xl border border-white/10 bg-white/10 p-2'
              : 'bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-800'
          }
        >
          <div className="w-full">
            <iframe
              key={`${embedData.id}-${autoplayToken}`}
              src={embedData.url}
              width="100%"
              height={iframeHeight}
              frameBorder="0"
              allowTransparency={true}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              style={{ borderRadius: '12px' }}
              title={`Spotify ${embedData.type} player`}
            ></iframe>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-400 text-center">{error}</p>
        </div>
      ) : urlOrId ? (
        <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
          <p className="text-yellow-400 text-center">Loading Spotify player...</p>
        </div>
      ) : null}
    </div>
  );
};

export default SpotifyEmbed;

