const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface StationArtist {
  id: string;
  name: string;
  image?: string;
}

export interface Station {
  id: string;
  name: string;
  artists: StationArtist[];
  color: string;
  createdAt: string;
}

interface BaseApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  [key: string]: unknown;
}

const ensureAuthToken = (): string => {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No authentication token found. Please log in again.');
  }

  return token;
};

/**
 * Create a new custom station
 */
export const createStation = async (
  name: string,
  artists: StationArtist[],
  color: string
): Promise<Station> => {
  const token = ensureAuthToken();

  const response = await fetch(`${API_BASE_URL}/stations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, artists, color }),
  });

  const result: BaseApiResponse<{ station: Station }> = await response.json();

  if (!response.ok) {
    const errorMessage = result?.message || `Failed to create station (Status: ${response.status})`;
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    throw error;
  }

  return result.data.station;
};

/**
 * Get all stations for the authenticated user
 */
export const getStations = async (): Promise<Station[]> => {
  const token = ensureAuthToken();

  const response = await fetch(`${API_BASE_URL}/stations`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const result: BaseApiResponse<{ stations: Station[] }> = await response.json();

  if (!response.ok) {
    const errorMessage = result?.message || `Failed to fetch stations (Status: ${response.status})`;
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    throw error;
  }

  return result.data.stations || [];
};

/**
 * Get a specific station by ID
 */
export const getStationById = async (stationId: string): Promise<Station> => {
  const token = ensureAuthToken();

  const response = await fetch(`${API_BASE_URL}/stations/${stationId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const result: BaseApiResponse<{ station: Station }> = await response.json();

  if (!response.ok) {
    const errorMessage = result?.message || `Failed to fetch station (Status: ${response.status})`;
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    throw error;
  }

  return result.data.station;
};

/**
 * Delete a station
 */
export const deleteStation = async (stationId: string): Promise<void> => {
  const token = ensureAuthToken();

  const response = await fetch(`${API_BASE_URL}/stations/${stationId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const result = await response.json();
    const errorMessage = result?.message || `Failed to delete station (Status: ${response.status})`;
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    throw error;
  }
};

