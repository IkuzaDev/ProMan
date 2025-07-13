require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const http = require('http');
const socketIo = require('socket.io');
const {rateLimit} = require('express-rate-limit');

// Routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const pmRoutes = require('./routes/project-manager');
const memberRoutes = require('./routes/team-member');
const landingRoutes = require('./routes/landing');

// Middleware
const { checkAuth } = require('./middleware/auth');

const app = express();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, //15 minutes
  max: 100,
  message: "Slow down Dude!"
});
const server = http.createServer(app);
const io = socketIo(server);

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(limiter);
app.use(session({
  store: new SQLiteStore({
    db: 'sessions.sqlite',
    dir: './db'
  }),
  secret: process.env.SESSION_SECRET || 'proman-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));
app.use(flash());

// Pass user to all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.path = req.path;
  res.locals.message = req.flash('message')[0] || null;
  next();
});

// Socket.io
require('./utils/socket')(io);

// Routes
app.use('/', landingRoutes);
app.use('/auth', authRoutes);
app.use('/admin', checkAuth('admin'), adminRoutes);
app.use('/pm', checkAuth('project_manager'), pmRoutes);
app.use('/member', checkAuth('team_member'), memberRoutes);

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: app.get('env') === 'development' ? err : {}
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io }; 
