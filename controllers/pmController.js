const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const socketUtils = require('../utils/socket');

const getDashboard = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const projects = await Project.findByUserId(userId);
    const assignedTasks = await Task.findByAssignedUser(userId);
    const recentTasks = await Task.findRecentTasks(userId);
    
    let totalProgress = 0;
    if (projects.length > 0) {
      for (const project of projects) {
        const progress = await Project.getProgress(project.id);
        totalProgress += progress.progress_percentage;
      }
      totalProgress = Math.round(totalProgress / projects.length);
    }
    
    res.render('pm/dashboard', {
      title: 'Project Manager Dashboard - ProMan',
      projects,
      assignedTasks,
      recentTasks,
      totalProgress,
      activeProjects: projects.filter(p => p.status === 'active').length,
      completedProjects: projects.filter(p => p.status === 'completed').length,
      message: req.flash('message')[0] || null
    });
  } catch (err) {
    console.error('PM dashboard error:', err);
    res.render('pm/dashboard', {
      title: 'Project Manager Dashboard - ProMan',
      error: 'Terjadi kesalahan saat memuat data',
      message: { type: 'error', text: 'Terjadi kesalahan saat memuat data' }
    });
  }
};

const getProjects = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const projects = await Project.findByUserId(userId);
    
    res.render('pm/projects', {
      title: 'Projects - ProMan',
      projects,
      message: req.flash('message')[0] || null
    });
  } catch (err) {
    console.error('Error listing projects:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan saat memuat data project' });
    res.redirect('/pm/dashboard');
  }
};

const getCreateProject = (req, res) => {
  res.render('pm/create-project', {
    title: 'Create New Project - ProMan',
    message: req.flash('message')[0] || null
  });
};

const postCreateProject = async (req, res) => {
  try {
    const { name, description, start_date, end_date } = req.body;
    const userId = req.session.user.id;
    
    if (!name || !description || !start_date) {
      req.flash('message', { type: 'error', text: 'Nama, deskripsi, dan tanggal mulai wajib diisi' });
      return res.redirect('/pm/projects/create');
    }
    
    const project = await Project.create({
      name,
      description,
      start_date,
      end_date,
      created_by: userId
    });
    
    await Project.addMember(project.id, userId, 'manager');
    req.flash('message', { type: 'success', text: 'Project berhasil dibuat' });
    res.redirect('/pm/projects');
  } catch (err) {
    console.error('Error creating project:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan saat membuat project' });
    res.redirect('/pm/projects/create');
  }
};

const getProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.session.user.id;
    const project = await Project.findById(projectId);
    
    if (!project) {
      req.flash('message', { type: 'error', text: 'Project tidak ditemukan' });
      return res.redirect('/pm/projects');
    }
    
    const members = await Project.findMembers(projectId);
    const isMember = members.some(member => member.id === userId);
    
    if (!isMember && project.created_by !== userId) {
      req.flash('message', { type: 'error', text: 'Anda tidak memiliki akses ke project ini' });
      return res.redirect('/pm/projects');
    }
    const tasks = await Task.findByProjectId(projectId);
    const progress = await Project.getProgress(projectId);
    const pendingTasks = tasks.filter(task => task.status === 'pending');
    const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
    const completedTasks = tasks.filter(task => task.status === 'completed');
    
    res.render('pm/project-details', {
      title: `${project.name} - ProMan`,
      project,
      members,
      tasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      progress,
      message: req.flash('message')[0] || null
    });
  } catch (err) {
    console.error('Error getting project details:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan saat memuat detail project' });
    res.redirect('/pm/projects');
  }
};

const getEditProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.session.user.id;
    const project = await Project.findById(projectId);
    
    if (!project) {
      req.flash('message', { type: 'error', text: 'Project tidak ditemukan' });
      return res.redirect('/pm/projects');
    }
    
    if (project.created_by !== userId) {
      const members = await Project.findMembers(projectId);
      const isManager = members.some(member => member.id === userId && member.project_role === 'manager');
      
      if (!isManager) {
        req.flash('message', { type: 'error', text: 'Anda tidak memiliki izin untuk mengedit project ini' });
        return res.redirect(`/pm/projects/${projectId}`);
      }
    }
    
    res.render('pm/edit-project', {
      title: `Edit ${project.name} - ProMan`,
      project,
      message: req.flash('message')[0] || null
    });
  } catch (err) {
    console.error('Error getting project for edit:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan' });
    res.redirect('/pm/projects');
  }
};

const postEditProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { name, description, start_date, end_date, status } = req.body;
    const userId = req.session.user.id;

    if (!name || !description || !start_date || !status) {
      req.flash('message', { type: 'error', text: 'Semua field wajib diisi kecuali tanggal selesai' });
      return res.redirect(`/pm/projects/edit/${projectId}`);
    }
    
    const project = await Project.findById(projectId);
    if (project.created_by !== userId) {
      const members = await Project.findMembers(projectId);
      const isManager = members.some(member => member.id === userId && member.project_role === 'manager');
      
      if (!isManager) {
        req.flash('message', { type: 'error', text: 'Anda tidak memiliki izin untuk mengedit project ini' });
        return res.redirect(`/pm/projects/${projectId}`);
      }
    }
    
    await Project.update(projectId, {
      name,
      description,
      start_date,
      end_date,
      status
    });
    
    socketUtils().emitProjectUpdate(projectId, {
      type: 'update',
      project: {
        id: projectId,
        name,
        description,
        start_date,
        end_date,
        status
      }
    });
    
    req.flash('message', { type: 'success', text: 'Project berhasil diperbarui' });
    res.redirect(`/pm/projects/${projectId}`);
  } catch (err) {
    console.error('Error updating project:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan saat memperbarui project' });
    res.redirect(`/pm/projects/edit/${req.params.id}`);
  }
};

const deleteProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.session.user.id;
    const project = await Project.findById(projectId);
    
    if (project.created_by !== userId) {
      req.flash('message', { type: 'error', text: 'Anda tidak memiliki izin untuk menghapus project ini' });
      return res.redirect(`/pm/projects/${projectId}`);
    }
    
    await Project.delete(projectId);
    
    req.flash('message', { type: 'success', text: 'Project berhasil dihapus' });
    res.redirect('/pm/projects');
  } catch (err) {
    console.error('Error deleting project:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan saat menghapus project' });
    res.redirect('/pm/projects');
  }
};

const getProjectMembers = async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.session.user.id;
    const project = await Project.findById(projectId);
    
    if (!project) {
      req.flash('message', { type: 'error', text: 'Project tidak ditemukan' });
      return res.redirect('/pm/projects');
    }
    
    if (project.created_by !== userId) {
      const members = await Project.findMembers(projectId);
      const isManager = members.some(member => member.id === userId && member.project_role === 'manager');
      
      if (!isManager) {
        req.flash('message', { type: 'error', text: 'Anda tidak memiliki izin untuk mengelola anggota project' });
        return res.redirect(`/pm/projects/${projectId}`);
      }
    }
    
    const members = await Project.findMembers(projectId);
    const availableUsers = await User.findAll();
    const memberIds = members.map(member => member.id);
    const nonMembers = availableUsers.filter(user => !memberIds.includes(user.id));
    
    res.render('pm/project-members', {
      title: `Anggota ${project.name} - ProMan`,
      project,
      members,
      nonMembers,
      message: req.flash('message')[0] || null,
      availableUsers: nonMembers
    });
  } catch (err) {
    console.error('Error getting project members:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan saat memuat data anggota' });
    res.redirect(`/pm/projects/${req.params.id}`);
  }
};

const addProjectMember = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { user_id, role } = req.body;
    const userId = req.session.user.id;
    const project = await Project.findById(projectId);

    if (project.created_by !== userId) {
      const members = await Project.findMembers(projectId);
      const isManager = members.some(member => member.id === userId && member.project_role === 'manager');
      if (!isManager) {
        req.flash('message', { type: 'error', text: 'Anda tidak memiliki izin untuk mengelola anggota project' });
        return res.redirect(`/pm/projects/${projectId}`);
      }
    }
    
    await Project.addMember(projectId, user_id, role);
    const addedUser = await User.findById(user_id);
    socketUtils().emitProjectInvitation(user_id, {
      projectId,
      projectName: project.name
    });
    
    req.flash('message', { type: 'success', text: 'Anggota berhasil ditambahkan' });
    res.redirect(`/pm/projects/${projectId}/members`);
  } catch (err) {
    console.error('Error adding project member:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan saat menambahkan anggota' });
    res.redirect(`/pm/projects/${req.params.id}/members`);
  }
};

const removeProjectMember = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const memberId = req.params.userId;
    const userId = req.session.user.id;
    const project = await Project.findById(projectId);

    if (project.created_by !== userId) {
      const members = await Project.findMembers(projectId);
      const isManager = members.some(member => member.id === userId && member.project_role === 'manager');
      
      if (!isManager) {
        req.flash('message', { type: 'error', text: 'Anda tidak memiliki izin untuk mengelola anggota project' });
        return res.redirect(`/pm/projects/${projectId}`);
      }
    }
    
    if (project.created_by == memberId) {
      req.flash('message', { type: 'error', text: 'Pembuat project tidak dapat dihapus' });
      return res.redirect(`/pm/projects/${projectId}/members`);
    }
    
    await Project.removeMember(projectId, memberId);
    
    req.flash('message', { type: 'success', text: 'Anggota berhasil dihapus' });
    res.redirect(`/pm/projects/${projectId}/members`);
  } catch (err) {
    console.error('Error removing project member:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan saat menghapus anggota' });
    res.redirect(`/pm/projects/${req.params.projectId}/members`);
  }
};

const getCreateTask = async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await Project.findById(projectId);
    
    if (!project) {
      req.flash('message', { type: 'error', text: 'Project tidak ditemukan' });
      return res.redirect('/pm/projects');
    }
    
    const members = await Project.findMembers(projectId);
    
    res.render('pm/create-task', {
      title: `Create Task - ${project.name} - ProMan`,
      project,
      members,
      message: req.flash('message')[0] || null
    });
  } catch (err) {
    console.error('Error loading create task form:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan' });
    res.redirect(`/pm/projects/${req.params.id}`);
  }
};

const postCreateTask = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { name, description, status, priority, start_date, due_date, assigned_to } = req.body;
    const userId = req.session.user.id;

    if (!name || !description || !status || !priority) {
      req.flash('message', { type: 'error', text: 'Nama, deskripsi, status, dan prioritas wajib diisi' });
      return res.redirect(`/pm/projects/${projectId}/tasks/create`);
    }
    
    const task = await Task.create({
      project_id: projectId,
      name,
      description,
      status,
      priority,
      start_date,
      due_date,
      created_by: userId,
      assigned_to
    });
    
    socketUtils().emitTaskUpdate(task.id, projectId, {
      type: 'create',
      task
    });
    
    if (assigned_to) {
      socketUtils().emitTaskAssignment(assigned_to, {
        taskId: task.id,
        taskName: name,
        projectId,
        projectName: (await Project.findById(projectId)).name
      });
    }
    
    req.flash('message', { type: 'success', text: 'Task berhasil dibuat' });
    res.redirect(`/pm/projects/${projectId}`);
  } catch (err) {
    console.error('Error creating task:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan saat membuat task' });
    res.redirect(`/pm/projects/${req.params.id}/tasks/create`);
  }
};

const getTask = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const task = await Task.findById(taskId);
    
    if (!task) {
      req.flash('message', { type: 'error', text: 'Task tidak ditemukan' });
      return res.redirect(`/pm/projects/${req.params.id}`);
    }
    
    const comments = await Task.getComments(taskId);
    
    res.render('pm/task-details', {
      title: `${task.name} - ProMan`,
      task,
      comments,
      message: req.flash('message')[0] || null
    });
  } catch (err) {
    console.error('Error getting task details:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan saat memuat detail task' });
    res.redirect(`/pm/projects/${req.params.id}`);
  }
};

const getEditTask = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const task = await Task.findById(taskId);
    
    if (!task) {
      req.flash('message', { type: 'error', text: 'Task tidak ditemukan' });
      return res.redirect(`/pm/projects/${req.params.id}`);
    }
    
    const members = await Project.findMembers(task.project_id);
    
    res.render('pm/edit-task', {
      title: `Edit ${task.name} - ProMan`,
      task,
      members,
      message: req.flash('message')[0] || null
    });
  } catch (err) {
    console.error('Error getting task for edit:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan' });
    res.redirect(`/pm/projects/${req.params.id}`);
  }
};

const postEditTask = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const { name, description, status, priority, start_date, due_date, assigned_to } = req.body;
    
    if (!name || !description || !status || !priority) {
      req.flash('message', { type: 'error', text: 'Nama, deskripsi, status, dan prioritas wajib diisi' });
      return res.redirect(`/pm/projects/${req.params.id}/tasks/${taskId}/edit`);
    }
    
    const originalTask = await Task.findById(taskId);
    const assigneeChanged = originalTask.assigned_to != assigned_to;
    
    const task = await Task.update(taskId, {
      name,
      description,
      status,
      priority,
      start_date,
      due_date,
      assigned_to
    });
    
    socketUtils().emitTaskUpdate(taskId, req.params.id, {
      type: 'update',
      task: {
        id: taskId,
        name,
        description,
        status,
        priority,
        start_date,
        due_date,
        assigned_to
      }
    });
    
    if (assigneeChanged && assigned_to) {
      socketUtils().emitTaskAssignment(assigned_to, {
        taskId,
        taskName: name,
        projectId: req.params.id,
        projectName: originalTask.project_name
      });
    }
    
    req.flash('message', { type: 'success', text: 'Task berhasil diperbarui' });
    res.redirect(`/pm/projects/${req.params.id}/tasks/${taskId}`);
  } catch (err) {
    console.error('Error updating task:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan saat memperbarui task' });
    res.redirect(`/pm/projects/${req.params.id}/tasks/${req.params.taskId}/edit`);
  }
};

const deleteTask = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    await Task.delete(taskId);
    socketUtils().emitTaskUpdate(taskId, req.params.id, {
      type: 'delete',
      taskId
    });
    
    req.flash('message', { type: 'success', text: 'Task berhasil dihapus' });
    res.redirect(`/pm/projects/${req.params.id}`);
  } catch (err) {
    console.error('Error deleting task:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan saat menghapus task' });
    res.redirect(`/pm/projects/${req.params.id}`);
  }
};

const addTaskComment = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const { content } = req.body;
    const userId = req.session.user.id;
    
    if (!content) {
      req.flash('message', { type: 'error', text: 'Konten komentar tidak boleh kosong' });
      return res.redirect(`/pm/projects/${req.params.id}/tasks/${taskId}`);
    }
    
    const comment = await Task.addComment(taskId, userId, content);
    const user = await User.findById(userId);
    socketUtils().emitNewComment(taskId, req.params.id, {
      ...comment,
      fullname: user.fullname,
      avatar: user.avatar
    });
    
    req.flash('message', { type: 'success', text: 'Komentar berhasil ditambahkan' });
    res.redirect(`/pm/projects/${req.params.id}/tasks/${taskId}`);
  } catch (err) {
    console.error('Error adding comment:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan saat menambahkan komentar' });
    res.redirect(`/pm/projects/${req.params.id}/tasks/${req.params.taskId}`);
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const { status } = req.body;
    
    await Task.updateStatus(taskId, status);
    const task = await Task.findById(taskId);
    socketUtils().emitTaskUpdate(taskId, task.project_id, {
      type: 'status',
      taskId,
      status
    });
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating task status:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

const updateTaskProgress = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const { progress } = req.body;
    
    await Task.updateProgress(taskId, progress);
    const task = await Task.findById(taskId);
    socketUtils().emitTaskUpdate(taskId, task.project_id, {
      type: 'progress',
      taskId,
      progress
    });
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating task progress:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

module.exports = {
  getDashboard,
  getProjects,
  getCreateProject,
  postCreateProject,
  getProject,
  getEditProject,
  postEditProject,
  deleteProject,
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
  getCreateTask,
  postCreateTask,
  getTask,
  getEditTask,
  postEditTask,
  deleteTask,
  addTaskComment,
  updateTaskStatus,
  updateTaskProgress
}; 