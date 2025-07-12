const User = require('../models/User');

const getLogin = (req, res) => {
  res.render('auth/login', {
    title: 'Login - ProMan',
    message: req.flash('message')[0] || null
  });
};

const postLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      req.flash('message', { type: 'error', text: 'Username dan password diperlukan' });
      return res.redirect('/auth/login');
    }
    
    const user = await User.authenticate(username, password);
    
    if (!user) {
      req.flash('message', { type: 'error', text: 'Username atau password tidak valid' });
      return res.redirect('/auth/login');
    }
    
    req.session.user = user;
    
    switch (user.role) {
      case 'admin':
        res.redirect('/admin/dashboard');
        break;
      case 'project_manager':
        res.redirect('/pm/dashboard');
        break;
      case 'team_member':
        res.redirect('/member/dashboard');
        break;
      default:
        res.redirect('/');
    }
  } catch (err) {
    console.error('Login error:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan saat login' });
    res.redirect('/auth/login');
  }
};

const getRegister = (req, res) => {
  res.render('auth/register', {
    title: 'Register - ProMan',
    message: req.flash('message')[0] || null
  });
};

const postRegister = async (req, res) => {
  try {
    const { username, password, fullname, email } = req.body;
    
    if (!username || !password || !fullname || !email) {
      req.flash('message', { type: 'error', text: 'Semua field wajib diisi' });
      return res.redirect('/auth/register');
    }
    
    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      req.flash('message', { type: 'error', text: 'Username sudah digunakan' });
      return res.redirect('/auth/register');
    }
    
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      req.flash('message', { type: 'error', text: 'Email sudah digunakan' });
      return res.redirect('/auth/register');
    }
    
    await User.create({
      username,
      password,
      fullname,
      email,
      role: 'team_member'
    });
    
    req.flash('message', { 
      type: 'success', 
      text: 'Registrasi berhasil. Silakan login dengan akun baru Anda.' 
    });
    res.redirect('/auth/login');
  } catch (err) {
    console.error('Registration error:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan saat registrasi' });
    res.redirect('/auth/register');
  }
};

const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.redirect('/');
    }
    res.redirect('/auth/login');
  });
};

const getForgotPassword = (req, res) => {
  res.render('auth/forgot-password', {
    title: 'Lupa Password - ProMan',
    message: req.flash('message')[0] || null
  });
};

const postForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      req.flash('message', { type: 'error', text: 'Email diperlukan' });
      return res.redirect('/auth/forgot-password');
    }
    
    const user = await User.findByEmail(email);
    if (!user) {
      req.flash('message', { type: 'error', text: 'Email tidak ditemukan' });
      return res.redirect('/auth/forgot-password');
    }
    
    req.flash('message', { 
      type: 'success', 
      text: 'Instruksi reset password telah dikirim ke email Anda' 
    });
    res.redirect('/auth/login');
  } catch (err) {
    console.error('Forgot password error:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan' });
    res.redirect('/auth/forgot-password');
  }
};

module.exports = {
  getLogin,
  postLogin,
  getRegister,
  postRegister,
  logout,
  getForgotPassword,
  postForgotPassword
};
