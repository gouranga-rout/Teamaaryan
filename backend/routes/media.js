/*import express from 'express';
import Media from '../models/Media.js';

const router = express.Router();

// GET /api/media - returns banner + proofs for the main page
router.get('/', async (req, res) => {
  try {
    const banner = await Media.findOne({ type: 'banner' }).sort({ createdAt: -1 });
    const proofs = await Media.find({ type: 'proof' }).sort({ createdAt: 1 });
    res.json({ banner, proofs });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

export default router;
*/

import express from 'express';
import Media from '../models/Media.js';
import TripDetails from '../models/TripDetails.js';

const router = express.Router();

// GET /api/media - returns banner + proofs + trip details
router.get('/', async (req, res) => {
  try {
    const banner = await Media.findOne({ type: 'banner' }).sort({ createdAt: -1 });
    const proofs = await Media.find({ type: 'proof' }).sort({ createdAt: 1 });
    const trip = await TripDetails.findOne().sort({ createdAt: -1 });
    res.json({ banner, proofs, trip });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

export default router;
