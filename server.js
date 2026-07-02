require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const expressLayouts = require('express-ejs-layouts');


const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// View Engine
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');

// Sessions
app.use(session({
  store: new SQLiteStore({ dir: __dirname, db: 'sessions.sqlite' }),
  secret: 'taskwhite_super_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // 1 week
}));

// Setup global variables for views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.currentPath = req.path;
  next();
});

// Routes
const { router: authRoutes } = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const taskRoutes = require('./routes/taskRoutes');
const masterDataRoutes = require('./routes/masterDataRoutes');

app.use('/', authRoutes);
app.use('/', dashboardRoutes);
app.use('/', taskRoutes);
app.use('/', masterDataRoutes);

// Passport
const passport = require('passport');
require('./config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());

// Start Server
const PORT = process.env.PORT || 14000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
