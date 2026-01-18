import { Request, Response } from 'express';
import Station, { IStation } from '../models/station.model';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

/**
 * @route   POST /api/stations
 * @desc    Create a new custom station
 * @access  Private
 */
export const createStation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const { name, artists, color } = req.body;

    // Validation
    if (!name || !artists || !Array.isArray(artists) || artists.length < 2 || artists.length > 5) {
      res.status(400).json({
        success: false,
        message: 'Station name and 2-5 artists are required',
      });
      return;
    }

    if (!color) {
      res.status(400).json({
        success: false,
        message: 'Station color is required',
      });
      return;
    }

    // Validate artists structure
    for (const artist of artists) {
      if (!artist.id || !artist.name) {
        res.status(400).json({
          success: false,
          message: 'Each artist must have an id and name',
        });
        return;
      }
    }

    // Create new station
    const station = new Station({
      user: req.user.id,
      name,
      artists,
      color,
    });

    await station.save();

    res.status(201).json({
      success: true,
      message: 'Station created successfully',
      data: {
        station: {
          id: station._id.toString(),
          name: station.name,
          artists: station.artists,
          color: station.color,
          createdAt: station.createdAt,
        },
      },
    });
  } catch (error: any) {
    console.error('Create station error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create station',
    });
  }
};

/**
 * @route   GET /api/stations
 * @desc    Get all stations for the authenticated user
 * @access  Private
 */
export const getStations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const stations = await Station.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      data: {
        stations: stations.map((station) => ({
          id: station._id.toString(),
          name: station.name,
          artists: station.artists,
          color: station.color,
          createdAt: station.createdAt,
        })),
      },
    });
  } catch (error: any) {
    console.error('Get stations error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch stations',
    });
  }
};

/**
 * @route   GET /api/stations/:stationId
 * @desc    Get a specific station by ID
 * @access  Private
 */
export const getStationById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const { stationId } = req.params;

    const station = await Station.findOne({
      _id: stationId,
      user: req.user.id,
    }).select('-__v');

    if (!station) {
      res.status(404).json({
        success: false,
        message: 'Station not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        station: {
          id: station._id.toString(),
          name: station.name,
          artists: station.artists,
          color: station.color,
          createdAt: station.createdAt,
        },
      },
    });
  } catch (error: any) {
    console.error('Get station by ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch station',
    });
  }
};

/**
 * @route   DELETE /api/stations/:stationId
 * @desc    Delete a station
 * @access  Private
 */
export const deleteStation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const { stationId } = req.params;

    const station = await Station.findOneAndDelete({
      _id: stationId,
      user: req.user.id,
    });

    if (!station) {
      res.status(404).json({
        success: false,
        message: 'Station not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Station deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete station error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete station',
    });
  }
};

