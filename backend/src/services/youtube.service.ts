import axios from "axios";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "YOUR_YOUTUBE_API_KEY"; // Add this in .env
const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3";

// Cache for rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 100;

/**
 * Check YouTube API credentials
 */
const checkCredentials = (): void => {
  if (!YOUTUBE_API_KEY) {
    throw new Error(
      "YouTube API key is not configured. Please add YOUTUBE_API_KEY to your .env file."
    );
  }
};

/**
 * Map user mood to search query
 */
const getMoodBasedQuery = (mood: string): string => {
  const moodMap: Record<string, string> = {
    sad: "happy upbeat music",
    happy: "happy energetic music",
    excited: "energetic dance music",
    relaxed: "calm peaceful music",
    focused: "instrumental study music",
  };
  return moodMap[mood.toLowerCase()] || "chill music";
};

/**
 * Search for YouTube music videos
 */
export const searchVideos = async (
  query: string,
  limit: number = 20
): Promise<any[]> => {
  try {
    checkCredentials();

    // simple rate limiter
    const now = Date.now();
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
      await new Promise((r) =>
        setTimeout(r, MIN_REQUEST_INTERVAL - (now - lastRequestTime))
      );
    }
    lastRequestTime = Date.now();

    const response = await axios.get(`${YOUTUBE_API_URL}/search`, {
      params: {
        part: "snippet",
        q: query,
        type: "video",
        videoCategoryId: "10",
        maxResults: limit,
        key: YOUTUBE_API_KEY,
        order: "relevance",
      },
    });

    if (!response.data.items?.length) return [];

    // fetch details (duration, stats)
    const videoIds = response.data.items.map((i: any) => i.id.videoId).join(",");
    const detailsResponse = await axios.get(`${YOUTUBE_API_URL}/videos`, {
      params: {
        part: "contentDetails,statistics",
        id: videoIds,
        key: YOUTUBE_API_KEY,
      },
    });

    // helper: parse ISO duration to ms
    const parseDuration = (durationStr: string): number => {
      const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (!match) return 0;
      const hours = parseInt(match[1] || "0", 10);
      const minutes = parseInt(match[2] || "0", 10);
      const seconds = parseInt(match[3] || "0", 10);
      return (hours * 3600 + minutes * 60 + seconds) * 1000;
    };

    // combine both responses
    return response.data.items.map((item: any, i: number) => {
      const details = detailsResponse.data.items[i];
      const duration = parseDuration(details?.contentDetails?.duration || "");
      return {
        id: item.id.videoId,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        description: item.snippet.description,
        thumbnail:
          item.snippet.thumbnails.medium?.url ||
          item.snippet.thumbnails.default?.url,
        duration,
        viewCount: details?.statistics?.viewCount || "0",
        likeCount: details?.statistics?.likeCount || "0",
        videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        embedUrl: `https://www.youtube.com/embed/${item.id.videoId}`,
      };
    });
  } catch (error: any) {
    console.error("❌ YouTube API Error:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get music tracks by mood
 */
export const getTracksByMood = async (mood: string, limit = 20) => {
  const query = getMoodBasedQuery(mood);
  const videos = await searchVideos(query, limit);

  return videos.map((v) => {
    const titleParts = v.title.split(" - ");
    const artist = titleParts.length > 1 ? titleParts[0] : v.channelTitle;
    const songName = titleParts.length > 1 ? titleParts.slice(1).join(" - ") : v.title;

    return {
      id: v.id,
      name: songName,
      artists: artist,
      album: v.channelTitle,
      albumImage: v.thumbnail,
      previewUrl: v.embedUrl,
      externalUrl: v.videoUrl,
      duration: v.duration,
      popularity: parseInt(v.viewCount, 10) || 0,
      source: "youtube",
    };
  });
};

/**
 * Get recommendations (same as search for now)
 */
export const getRecommendationsByMood = async (mood: string, limit = 20) =>
  await getTracksByMood(mood, limit);
