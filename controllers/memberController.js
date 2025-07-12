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
    const pendingTasks = assignedTasks.filter(task => task.status === 'pending').length;
    const inProgressTasks = assignedTasks.filter(task => task.status === 'in_progress').length;
    const completedTasks = assignedTasks.filter(task => task.status === 'completed').length;
    
    let completionRate = 0;
    if (assignedTasks.length > 0) {
      completionRate = Math.round((completedTasks / assignedTasks.length) * 100);
    }
    
    res.render('member/dashboard', {
      title: 'Team Member Dashboard - ProMan',
      projects,
      assignedTasks,
      recentTasks,
      projectCount: projects.length,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      totalTasks: assignedTasks.length,
      completionRate,
      message: req.flash('message')[0] || null
    });
  } catch (err) {
    console.error('Member dashboard error:', err);
    res.render('member/dashboard', {
      title: 'Team Member Dashboard - ProMan',
      error: 'Terjadi kesalahan saat memuat data',
      message: { type: 'error', text: 'Terjadi kesalahan saat memuat data' }
    });
  }
};

const getProjects = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const projects = await Project.findByUserId(userId);
    
    res.render('member/projects', {
      title: 'My Projects - ProMan',
      projects,
      message: req.flash('message')[0] || null
    });
  } catch (err) {
    console.error('Error listing projects:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan saat memuat data project' });
    res.redirect('/member/dashboard');
  }
};

const getProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.session.user.id;
    const project = await Project.findById(projectId);
    
    if (!project) {
      req.flash('message', { type: 'error', text: 'Project tidak ditemukan' });
      return res.redirect('/member/projects');
    }
    
    const members = await Project.findMembers(projectId);
    const isMember = members.some(member => member.id === userId);
    
    if (!isMember && project.created_by !== userId) {
      req.flash('message', { type: 'error', text: 'Anda tidak memiliki akses ke project ini' });
      return res.redirect('/member/projects');
    }
    
    const tasks = await Task.findByProjectId(projectId);
    const progress = await Project.getProgress(projectId);
    const myTasks = tasks.filter(task => task.assigned_to === userId);
    const pendingTasks = tasks.filter(task => task.status === 'pending');
    const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
    const completedTasks = tasks.filter(task => task.status === 'completed');
    
    res.render('member/project-details', {
      title: `${project.name} - ProMan`,
      project,
      members,
      tasks,
      myTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      progress,
      message: req.flash('message')[0] || null
    });
  } catch (err) {
    console.error('Error getting project details:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan saat memuat detail project' });
    res.redirect('/member/projects');
  }
};

const getTasks = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const tasks = await Task.findByAssignedUser(userId);
    const pendingTasks = tasks.filter(task => task.status === 'pending');
    const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
    const completedTasks = tasks.filter(task => task.status === 'completed');
    
    res.render('member/tasks', {
      title: 'My Tasks - ProMan',
      tasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      message: req.flash('message')[0] || null
    });
  } catch (err) {
    console.error('Error listing tasks:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan saat memuat data task' });
    res.redirect('/member/dashboard');
  }
};

const getTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.session.user.id;
    const task = await Task.findById(taskId);
    
    if (!task) {
      req.flash('message', { type: 'error', text: 'Task tidak ditemukan' });
      return res.redirect('/member/tasks');
    }
    
    if (task.assigned_to !== userId) {
      const members = await Project.findMembers(task.project_id);
      const isMember = members.some(member => member.id === userId);
      
      if (!isMember) {
        req.flash('message', { type: 'error', text: 'Anda tidak memiliki akses ke task ini' });
        return res.redirect('/member/tasks');
      }
    }
    
    const comments = await Task.getComments(taskId);
    
    res.render('member/task-details', {
      title: `${task.name} - ProMan`,
      task,
      comments,
      message: req.flash('message')[0] || null
    });
  } catch (err) {
    console.error('Error getting task details:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan saat memuat detail task' });
    res.redirect('/member/tasks');
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { status } = req.body;
    const userId = req.session.user.id;
    const task = await Task.findById(taskId);
    
    if (!task) {
      req.flash('message', { type: 'error', text: 'Task tidak ditemukan' });
      return res.redirect('/member/tasks');
    }
    
    if (task.assigned_to !== userId) {
      req.flash('message', { type: 'error', text: 'Anda tidak memiliki izin untuk mengubah status task ini' });
      return res.redirect(`/member/tasks/${taskId}`);
    }
    
    await Task.updateStatus(taskId, status);
    
    socketUtils().emitTaskUpdate(taskId, task.project_id, {
      type: 'status',
      taskId,
      status
    });
    
    req.flash('message', { type: 'success', text: 'Status task berhasil diperbarui' });
    res.redirect(`/member/tasks/${taskId}`);
  } catch (err) {
    console.error('Error updating task status:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan saat mengubah status task' });
    res.redirect(`/member/tasks/${req.params.id}`);
  }
};

const updateTaskProgress = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { progress } = req.body;
    const userId = req.session.user.id;
    const task = await Task.findById(taskId);
    
    if (!task) {
      req.flash('message', { type: 'error', text: 'Task tidak ditemukan' });
      return res.redirect('/member/tasks');
    }

    if (task.assigned_to !== userId) {
      req.flash('message', { type: 'error', text: 'Anda tidak memiliki izin untuk mengubah progress task ini' });
      return res.redirect(`/member/tasks/${taskId}`);
    }
    
    const progressValue = parseInt(progress);
    if (isNaN(progressValue) || progressValue < 0 || progressValue > 100) {
      req.flash('message', { type: 'error', text: 'Nilai progress tidak valid' });
      return res.redirect(`/member/tasks/${taskId}`);
    }
    
    await Task.updateProgress(taskId, progressValue);
    socketUtils().emitTaskUpdate(taskId, task.project_id, {
      type: 'progress',
      taskId,
      progress: progressValue
    });
    
    if (progressValue === 100 && task.status !== 'completed') {
      await Task.updateStatus(taskId, 'completed');
      socketUtils().emitTaskUpdate(taskId, task.project_id, {
        type: 'status',
        taskId,
        status: 'completed'
      });
    }
    
    req.flash('message', { type: 'success', text: 'Progress task berhasil diperbarui' });
    res.redirect(`/member/tasks/${taskId}`);
  } catch (err) {
    console.error('Error updating task progress:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan saat mengubah progress task' });
    res.redirect(`/member/tasks/${req.params.id}`);
  }
};

const addTaskComment = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { content } = req.body;
    const userId = req.session.user.id;
    
    if (!content) {
      req.flash('message', { type: 'error', text: 'Konten komentar tidak boleh kosong' });
      return res.redirect(`/member/tasks/${taskId}`);
    }
    
    const comment = await Task.addComment(taskId, userId, content);
    const user = await User.findById(userId);
    const task = await Task.findById(taskId);
    
    socketUtils().emitNewComment(taskId, task.project_id, {
      ...comment,
      fullname: user.fullname,
      avatar: user.avatar
    });
    
    req.flash('message', { type: 'success', text: 'Komentar berhasil ditambahkan' });
    res.redirect(`/member/tasks/${taskId}`);
  } catch (err) {
    console.error('Error adding comment:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan saat menambahkan komentar' });
    res.redirect(`/member/tasks/${req.params.id}`);
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const user = await User.findById(userId);
    
    res.render('member/profile', {
      title: 'My Profile - ProMan',
      user,
      message: req.flash('message')[0] || null
    });
  } catch (err) {
    console.error('Error getting user profile:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan saat memuat profil' });
    res.redirect('/member/dashboard');
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { fullname, email } = req.body;
    if (!fullname || !email) {
      req.flash('message', { type: 'error', text: 'Nama dan email tidak boleh kosong' });
      return res.redirect('/member/profile');
    }
    
    const existingEmail = await User.findByEmail(email);
    if (existingEmail && existingEmail.id != userId) {
      req.flash('message', { type: 'error', text: 'Email sudah digunakan' });
      return res.redirect('/member/profile');
    }
    
    let avatarPath = null;
    if (req.file) {
      avatarPath = `/images/avatars/${req.file.filename}`;
    }
    
    const updatedUser = await User.update(userId, {
      fullname,
      email,
      avatar: avatarPath || req.body.current_avatar
    });
    
    req.session.user = {
      ...req.session.user,
      fullname,
      email,
      avatar: avatarPath || req.body.current_avatar
    };
    
    req.flash('message', { type: 'success', text: 'Profil berhasil diperbarui' });
    res.redirect('/member/profile');
  } catch (err) {
    console.error('Error updating profile:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan saat memperbarui profil' });
    res.redirect('/member/profile');
  }
};

const getChangePassword = (req, res) => {
  res.render('member/change-password', {
    title: 'Change Password - ProMan',
    message: req.flash('message')[0] || null
  });
};

const postChangePassword = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { current_password, new_password, confirm_password } = req.body;
    if (!current_password || !new_password || !confirm_password) {
      req.flash('message', { type: 'error', text: 'Semua field wajib diisi' });
      return res.redirect('/member/change-password');
    }
    
    if (new_password !== confirm_password) {
      req.flash('message', { type: 'error', text: 'Password baru dan konfirmasi password tidak cocok' });
      return res.redirect('/member/change-password');
    }
    
    const user = await User.findById(userId);
    const isMatch = await bcrypt.compare(current_password, user.password);
    
    if (!isMatch) {
      req.flash('message', { type: 'error', text: 'Password saat ini tidak valid' });
      return res.redirect('/member/change-password');
    }
    
    await User.updatePassword(userId, new_password);
    
    req.flash('message', { type: 'success', text: 'Password berhasil diubah' });
    res.redirect('/member/profile');
  } catch (err) {
    console.error('Error changing password:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan saat mengubah password' });
    res.redirect('/member/change-password');
  }
};

module.exports = {
  getDashboard,
  getProjects,
  getProject,
  getTasks,
  getTask,
  updateTaskStatus,
  updateTaskProgress,
  addTaskComment,
  getProfile,
  updateProfile,
  getChangePassword,
  postChangePassword
}; 