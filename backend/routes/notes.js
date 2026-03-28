const express  = require('express');
const router   = express.Router();
const { protect }    = require('../middleware/auth');
const { uploadNotePdf } = require('../config/cloudinary');
const { getNotes, createNote, updateNote, deleteNote } = require('../controllers/noteController');

router.get('/',        protect, getNotes);
router.post('/',       protect, uploadNotePdf.single('pdf'), createNote);
router.put('/:id',     protect, uploadNotePdf.single('pdf'), updateNote);
router.delete('/:id',  protect, deleteNote);

module.exports = router;
