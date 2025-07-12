const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const memberController = require('../controllers/memberController');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(__dirname, '../public/images/avatars'));
  },
  filename: function(req, file, cb) {
    cb(null, 'avatar-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: function(req, file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Images Only!');
    }
  }
});

// Dashboard
router.get('/dashboard', memberController.getDashboard);

// Projects
router.get('/projects', memberController.getProjects);
router.get('/projects/:id', memberController.getProject);

// Tasks
router.get('/tasks', memberController.getTasks);
router.get('/tasks/:id', memberController.getTask);
router.post('/tasks/:id/status', memberController.updateTaskStatus);
router.post('/tasks/:id/progress', memberController.updateTaskProgress);
router.post('/tasks/:id/comment', memberController.addTaskComment);

// Profile
router.get('/profile', memberController.getProfile);
router.post('/profile', upload.single('avatar'), memberController.updateProfile);
router.get('/change-password', memberController.getChangePassword);
router.post('/change-password', memberController.postChangePassword);

module.exports = router; 