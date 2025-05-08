// Basic Server Set up
// Make sure you install required modules to test/run
require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const auth = require('./src/auth');


const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));



const mongoUri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}` +
  `@${process.env.MONGODB_HOST}/${process.env.MONGODB_DATABASE}?retryWrites=true&w=majority`;

app.use(session({
  secret: process.env.NODE_SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: mongoUri
  })
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user || undefined;
  next();
});
app.use(auth.router);

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

app.get('/home', requireLogin, (req, res) => {
  res.render('home', { user: req.session.user });
});


/* Routes Section */
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/about', (req, res) => {
  res.render('about');
});

app.get('/signup', (req, res) => {
  res.render('signup');
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log('Logout error:', err);
      return res.send('Error logging out');
    }
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

app.get('/home', auth.requireLogin, (req, res) => {
  res.render('home', { user: req.session.user });
});

/* END Route Section */


app.use(function (req, res) {
  res.status(404);
  res.render('404');
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
