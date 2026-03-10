const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'student-management/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
  },
});


const documentStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'student-management/documents',
    resource_type: 'raw',
  },
});


const notePdfStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'student-management/notes',
    resource_type: 'raw',
  },
});


const assignmentPdfStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'student-management/assignments',
    resource_type: 'raw',
  },
});


const submissionPdfStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'student-management/submissions',
    resource_type: 'raw',
  },
});

const uploadProfile       = multer({ storage: profileStorage,       limits: { fileSize: 5  * 1024 * 1024 } });
const uploadDocument      = multer({ storage: documentStorage,      limits: { fileSize: 10 * 1024 * 1024 } });
const uploadNotePdf       = multer({ storage: notePdfStorage,       limits: { fileSize: 20 * 1024 * 1024 } });
const uploadAssignmentPdf = multer({ storage: assignmentPdfStorage, limits: { fileSize: 20 * 1024 * 1024 } });
const uploadSubmissionPdf = multer({ storage: submissionPdfStorage, limits: { fileSize: 20 * 1024 * 1024 } });

module.exports = {
  cloudinary,
  uploadProfile,
  uploadDocument,
  uploadNotePdf,
  uploadAssignmentPdf,
  uploadSubmissionPdf,
};
