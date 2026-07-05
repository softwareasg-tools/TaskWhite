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
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days
}));

function formatAppDate(dateVal) {
  if (!dateVal) return '-';
  let dateObj;
  if (typeof dateVal === 'string') {
    const parts = dateVal.split('-');
    if (parts.length !== 3) return dateVal;
    dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
  } else if (dateVal instanceof Date) {
    dateObj = dateVal;
  } else if (dateVal.toDate && typeof dateVal.toDate === 'function') {
    dateObj = dateVal.toDate();
  } else {
    return dateVal;
  }
  
  if (isNaN(dateObj.getTime())) return '-';
  
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const dayName = days[dateObj.getDay()];
  const dayStr = String(dateObj.getDate()).padStart(2, '0');
  const monthName = months[dateObj.getMonth()];
  const yearStr = dateObj.getFullYear();
  
  return `${dayName}, ${dayStr}-${monthName}-${yearStr}`;
}

// Setup global variables for views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.currentPath = req.path;
  res.locals.formatAppDate = formatAppDate;
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
