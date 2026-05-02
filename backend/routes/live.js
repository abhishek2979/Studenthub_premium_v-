// routes/live.js
const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { requirePremium }     = require('../middleware/premium');
const ctrl   = require('../controllers/liveController');

// Students can view live lectures
router.get('/', protect, ctrl.getAll);

// Join a lecture (student marks attendance)
router.post('/:id/join', protect, ctrl.joinLecture);

// Teacher: premium2 required for all write operations
router.post('/',
  protect, authorize('teacher'), requirePremium('premium2'),
  ctrl.create
);

router.put('/:id',
  protect, authorize('teacher'), requirePremium('premium2'),
  ctrl.update
);

router.patch('/:id/status',
  protect, authorize('teacher'), requirePremium('premium2'),
  ctrl.updateStatus
);

router.delete('/:id',
  protect, authorize('teacher'), requirePremium('premium2'),
  ctrl.remove
);

module.exports = router;
