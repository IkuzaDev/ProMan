const express = require('express');
const router = express.Router();
const pmController = require('../controllers/pmController');

// Dashboard
router.get('/dashboard', pmController.getDashboard);

// Project management
router.get('/projects', pmController.getProjects);
router.get('/projects/create', pmController.getCreateProject);
router.post('/projects/create', pmController.postCreateProject);
router.get('/projects/:id', pmController.getProject);
router.get('/projects/edit/:id', pmController.getEditProject);
router.post('/projects/edit/:id', pmController.postEditProject);
router.get('/projects/delete/:id', pmController.deleteProject);

// Project members
router.get('/projects/:id/members', pmController.getProjectMembers);
router.post('/projects/:id/members', pmController.addProjectMember);
router.get('/projects/:projectId/members/remove/:userId', pmController.removeProjectMember);

// Task management
router.get('/projects/:id/tasks/create', pmController.getCreateTask);
router.post('/projects/:id/tasks/create', pmController.postCreateTask);
router.get('/projects/:id/tasks/:taskId', pmController.getTask);
router.get('/projects/:id/tasks/:taskId/edit', pmController.getEditTask);
router.post('/projects/:id/tasks/:taskId/edit', pmController.postEditTask);
router.get('/projects/:id/tasks/:taskId/delete', pmController.deleteTask);
router.post('/projects/:id/tasks/:taskId/comment', pmController.addTaskComment);

// AJAX routes for task updates
router.post('/tasks/:taskId/status', pmController.updateTaskStatus);
router.post('/tasks/:taskId/progress', pmController.updateTaskProgress);

module.exports = router; 