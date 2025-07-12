const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const adminController = require('../controllers/adminController');
const landingController = require('../controllers/landingController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(__dirname, '../public/images/'));
  },
  filename: function(req, file, cb) {
    cb(null, 'landing-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function(req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|svg/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Images Only!');
    }
  }
});

// Admin Dashboard
router.get('/dashboard', adminController.getDashboard);

// User Management
router.get('/users', adminController.getUsers);
router.get('/users/add', adminController.getAddUser);
router.post('/users/add', adminController.postAddUser);
router.get('/users/edit/:id', adminController.getEditUser);
router.post('/users/edit/:id', adminController.postEditUser);
router.get('/users/reset-password/:id', adminController.getResetPassword);
router.post('/users/reset-password/:id', adminController.postResetPassword);
router.get('/users/delete/:id', adminController.deleteUser);

// Project Management
router.get('/projects', adminController.getProjects);
router.get('/projects/:id', adminController.getProjectDetails);

// Landing Page Management
router.get('/landing', landingController.getAdminLandingContent);
router.get('/landing/add', landingController.getAddContent);
router.post('/landing/add', upload.single('image'), landingController.createContent);
router.get('/landing/edit/:id', landingController.getEditContent);
router.post('/landing/edit/:id', upload.single('image'), landingController.updateContent);
router.get('/landing/delete/:id', landingController.deleteContent);
router.post('/landing/order', landingController.updateContentOrder);

module.exports = router; 