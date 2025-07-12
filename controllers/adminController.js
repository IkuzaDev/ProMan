const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const socketUtils = require('../utils/socket');

const getDashboard = async (req, res) => {
  try {
    const users = await User.findAll();
    const projects = await Project.findAll();
    
    const adminCount = users.filter(user => user.role === 'admin').length;
    const pmCount = users.filter(user => user.role === 'project_manager').length;
    const memberCount = users.filter(user => user.role === 'team_member').length;
    
    const activeProjects = projects.filter(project => project.status === 'active').length;
    const completedProjects = projects.filter(project => project.status === 'completed').length;
    
    let totalProgress = 0;
    if (projects.length > 0) {
      for (const project of projects) {
        const progress = await Project.getProgress(project.id);
        totalProgress += progress.progress_percentage;
      }
      totalProgress = Math.round(totalProgress / projects.length);
    }
    
    res.render('admin/dashboard', {
      title: 'Admin Dashboard - ProMan',
      userCount: users.length,
      projectCount: projects.length,
      adminCount,
      pmCount,
      memberCount,
      activeProjects,
      completedProjects,
      totalProgress,
      message: req.flash('message')[0] || null
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.render('admin/dashboard', {
      title: 'Admin Dashboard - ProMan',
      error: 'Terjadi kesalahan saat memuat data',
      message: { type: 'error', text: 'Terjadi kesalahan saat memuat data' }
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    
    res.render('admin/users', {
      title: 'Manajemen User - ProMan',
      users,
      message: req.flash('message')[0] || null
    });
  } catch (err) {
    console.error('Error listing users:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan saat memuat data user' });
    res.redirect('/admin/dashboard');
  }
};

const getAddUser = (req, res) => {
  res.render('admin/add-user', {
    title: 'Tambah User - ProMan',
    message: req.flash('message')[0] || null
  });
};

const postAddUser = async (req, res) => {
  try {
    const { username, password, fullname, email, role } = req.body;
    
    if (!username || !password || !fullname || !email || !role) {
      req.flash('message', { type: 'error', text: 'Semua field wajib diisi' });
      return res.redirect('/admin/users/add');
    }
    
    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      req.flash('message', { type: 'error', text: 'Username sudah digunakan' });
      return res.redirect('/admin/users/add');
    }
    
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      req.flash('message', { type: 'error', text: 'Email sudah digunakan' });
      return res.redirect('/admin/users/add');
    }
    
    await User.create({
      username,
      password,
      fullname,
      email,
      role
    });
    
    req.flash('message', { type: 'success', text: 'User berhasil ditambahkan' });
    res.redirect('/admin/users');
  } catch (err) {
    console.error('Error adding user:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan saat menambahkan user' });
    res.redirect('/admin/users/add');
  }
};

const getEditUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    
    if (!user) {
      req.flash('message', { type: 'error', text: 'User tidak ditemukan' });
      return res.redirect('/admin/users');
    }
    
    res.render('admin/edit-user', {
      title: 'Edit User - ProMan',
      user,
      message: req.flash('message')[0] || null
    });
  } catch (err) {
    console.error('Error getting user for edit:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan saat memuat data user' });
    res.redirect('/admin/users');
  }
};

const postEditUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { fullname, email, role } = req.body;
    
    if (!fullname || !email || !role) {
      req.flash('message', { type: 'error', text: 'Semua field wajib diisi' });
      return res.redirect(`/admin/users/edit/${userId}`);
    }
    
    const existingEmail = await User.findByEmail(email);
    if (existingEmail && existingEmail.id != userId) {
      req.flash('message', { type: 'error', text: 'Email sudah digunakan' });
      return res.redirect(`/admin/users/edit/${userId}`);
    }
    
    await User.update(userId, {
      fullname,
      email,
      role
    });
    
    req.flash('message', { type: 'success', text: 'User berhasil diupdate' });
    res.redirect('/admin/users');
  } catch (err) {
    console.error('Error updating user:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan saat mengupdate user' });
    res.redirect(`/admin/users/edit/${req.params.id}`);
  }
};

const getResetPassword = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    
    if (!user) {
      req.flash('message', { type: 'error', text: 'User tidak ditemukan' });
      return res.redirect('/admin/users');
    }
    
    res.render('admin/reset-password', {
      title: 'Reset Password - ProMan',
      user,
      message: req.flash('message')[0] || null
    });
  } catch (err) {
    console.error('Error getting user for password reset:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan' });
    res.redirect('/admin/users');
  }
};

const postResetPassword = async (req, res) => {
  try {
    const userId = req.params.id;
    const { password, confirm_password } = req.body;
    
    if (!password || !confirm_password) {
      req.flash('message', { type: 'error', text: 'Password dan konfirmasi password diperlukan' });
      return res.redirect(`/admin/users/reset-password/${userId}`);
    }
    
    if (password !== confirm_password) {
      req.flash('message', { type: 'error', text: 'Password dan konfirmasi password tidak cocok' });
      return res.redirect(`/admin/users/reset-password/${userId}`);
    }
    
    await User.updatePassword(userId, password);
    
    req.flash('message', { type: 'success', text: 'Password berhasil direset' });
    res.redirect('/admin/users');
  } catch (err) {
    console.error('Error resetting password:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan saat reset password' });
    res.redirect(`/admin/users/reset-password/${req.params.id}`);
  }
};

const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    if (userId == req.session.user.id) {
      req.flash('message', { type: 'error', text: 'Anda tidak dapat menghapus akun Anda sendiri' });
      return res.redirect('/admin/users');
    }
    
    await User.delete(userId);
    
    req.flash('message', { type: 'success', text: 'User berhasil dihapus' });
    res.redirect('/admin/users');
  } catch (err) {
    console.error('Error deleting user:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan saat menghapus user' });
    res.redirect('/admin/users');
  }
};

const getProjects = async (req, res) => {
  try {
    const projects = await Project.findAll();
    
    res.render('admin/projects', {
      title: 'Manajemen Project - ProMan',
      projects,
      message: req.flash('message')[0] || null
    });
  } catch (err) {
    console.error('Error listing projects:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan saat memuat data project' });
    res.redirect('/admin/dashboard');
  }
};

const getProjectDetails = async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await Project.findById(projectId);
    
    if (!project) {
      req.flash('message', { type: 'error', text: 'Project tidak ditemukan' });
      return res.redirect('/admin/projects');
    }
    
    const members = await Project.findMembers(projectId);
    const tasks = await Task.findByProjectId(projectId);
    const progress = await Project.getProgress(projectId);
    
    res.render('admin/project-details', {
      title: `${project.name} - ProMan`,
      project,
      members,
      tasks,
      progress,
      message: req.flash('message')[0] || null
    });
  } catch (err) {
    console.error('Error getting project details:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan saat memuat detail project' });
    res.redirect('/admin/projects');
  }
};

module.exports = {
  getDashboard,
  getUsers,
  getAddUser,
  postAddUser,
  getEditUser,
  postEditUser,
  getResetPassword,
  postResetPassword,
  deleteUser,
  getProjects,
  getProjectDetails
};
