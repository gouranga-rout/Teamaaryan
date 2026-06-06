import express from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import ProfilePhoto from '../models/ProfilePhoto.js';
import { protect } from '../middleware/auth.js';
import { notifyAdmin, notifyUser } from '../utils/notificationHelper.js';

const router = express.Router();

// Supabase client
const getSupabase = () => createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Multer — memory storage (no disk, direct to Supabase)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, JPEG, PNG files allowed'), false);
    }
  }
});

// POST /api/profile/upload-photo
router.post('/upload-photo', protect, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const user = req.user;
    const bucket = process.env.SUPABASE_PROFILES_BUCKET;

    // Get current version number
    const lastPhoto = await ProfilePhoto.findOne({ user_id: user._id }).sort({ version: -1 });
    const newVersion = lastPhoto ? lastPhoto.version + 1 : 1;

    // Generate unique filename
    const ext = req.file.mimetype === 'image/png' ? 'png' : 'jpg';
    const filename = `${user.username}_v${newVersion}_${Date.now()}.${ext}`;
    const filePath = `${user.username}/${filename}`;

    // Upload to Supabase
    const supabase = getSupabase();
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return res.status(500).json({ message: 'Upload failed' });
    }

    // Get public URL
    const { data: urlData } = getSupabase().storage.from(bucket).getPublicUrl(filePath);
    const publicUrl = urlData.publicUrl;

    // Set all previous photos as not current
    await ProfilePhoto.updateMany({ user_id: user._id }, { is_current: false });

    // Save new photo to DB
    const fileSizeKB = (req.file.size / 1024).toFixed(1);
    const fileSizeMB = req.file.size > 1024 * 1024
      ? `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`
      : `${fileSizeKB} KB`;

    const photo = await ProfilePhoto.create({
      user_id: user._id,
      username: user.username,
      url: publicUrl,
      version: newVersion,
      is_current: true,
      file_size: fileSizeMB,
    });

    res.json({ message: 'Profile photo updated!', url: publicUrl, version: newVersion });

    // Notifications
    await notifyUser(user.username, 'photo_upload', '📷 Profile Photo Updated!', `Your profile photo has been updated successfully.`);
    if (user.role !== 'admin') {
      await notifyAdmin('photo_upload', '📷 Profile Photo Uploaded', `${user.full_name} (@${user.username}) uploaded a new profile photo.`);
    }
  } catch (err) {
    console.error(err);
    if (err.message.includes('Only JPG')) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/profile/photo - get current photo
router.get('/photo', protect, async (req, res) => {
  try {
    const photo = await ProfilePhoto.findOne({ user_id: req.user._id, is_current: true });
    res.json({ url: photo?.url || null });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/profile/photos/all - get all versions (admin use)
router.get('/photos/all', protect, async (req, res) => {
  try {
    const photos = await ProfilePhoto.find({ user_id: req.user._id }).sort({ version: -1 });
    res.json(photos);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
