import { Router } from 'express';
import { createStation, getStations, getStationById, deleteStation } from '../controllers/station.controller';
import { authenticate } from '../middleware';

const router = Router();

/**
 * @route   POST /api/stations
 * @desc    Create a new custom station
 * @access  Private
 */
router.post('/', authenticate, createStation);

/**
 * @route   GET /api/stations
 * @desc    Get all stations for the authenticated user
 * @access  Private
 */
router.get('/', authenticate, getStations);

/**
 * @route   GET /api/stations/:stationId
 * @desc    Get a specific station by ID
 * @access  Private
 */
router.get('/:stationId', authenticate, getStationById);

/**
 * @route   DELETE /api/stations/:stationId
 * @desc    Delete a station
 * @access  Private
 */
router.delete('/:stationId', authenticate, deleteStation);

export default router;

