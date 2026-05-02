// routes/videos.js
const router  = require('express').Router();
const multer  = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');
const { protect, authorize } = require('../middleware/auth');
const { requirePremium }     = require('../middleware/premium');
const ctrl   = require('../controllers/videoController');


const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    if (file.fieldname === 'video') {
      return {
        folder:         'studenthub/videos',
        resource_type:  'video',
        transformation: [{ quality: 'auto' }],
      };
    }
    // attachment - use raw for PDFs so they open correctly in browser
    return {
      folder:        'studenthub/video-attachments',
      resource_type: file.mimetype === 'application/pdf' ? 'raw' : 'image',
    };
  },
});

const upload = multer({
  storage: videoStorage,
  limits:  { fileSize: 500 * 1024 * 1024 },  // 500 MB per file
});

const uploadFields = upload.fields([
  { name: 'video',      maxCount: 1 },
  { name: 'attachment', maxCount: 1 },
]);


// Students can list published videos (no premium check for students)
router.get('/', protect, ctrl.getAll);

// Teacher: premium1 minimum
router.post('/',
  protect, authorize('teacher'), requirePremium('premium1'),
  uploadFields,
  ctrl.create
);

router.put('/:id',
  protect, authorize('teacher'), requirePremium('premium1'),
  ctrl.update
);

router.delete('/:id',
  protect, authorize('teacher'), requirePremium('premium1'),
  ctrl.remove
);

// Student: increment view
router.patch('/:id/view', protect, ctrl.incrementView);

module.exports = router;
