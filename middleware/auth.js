const checkAuth = (allowedRole) => {
  return (req, res, next) => {
    if (!req.session.user) {
      req.flash('message', { type: 'error', text: 'Anda perlu login untuk mengakses halaman ini' });
      return res.redirect('/auth/login');
    }
    if (!allowedRole) {
      return next();
    }

    if (Array.isArray(allowedRole)) {
      if (allowedRole.includes(req.session.user.role)) {
        return next();
      }
    } else if (req.session.user.role === allowedRole) {
      return next();
    }
    req.flash('message', { 
      type: 'error', 
      text: 'Anda tidak memiliki izin untuk mengakses halaman ini' 
    });

    let redirectPath = '/';
    switch (req.session.user.role) {
      case 'admin':
        redirectPath = '/admin/dashboard';
        break;
      case 'project_manager':
        redirectPath = '/pm/dashboard';
        break;
      case 'team_member':
        redirectPath = '/member/dashboard';
        break;
      default:
        redirectPath = '/';
    }
    
    return res.redirect(redirectPath);
  };
};

const redirectIfAuth = (req, res, next) => {
  if (req.session.user) {
    switch (req.session.user.role) {
      case 'admin':
        return res.redirect('/admin/dashboard');
      case 'project_manager':
        return res.redirect('/pm/dashboard');
      case 'team_member':
        return res.redirect('/member/dashboard');
      default:
        return res.redirect('/');
    }
  }
  next();
};

module.exports = { checkAuth, redirectIfAuth }; 