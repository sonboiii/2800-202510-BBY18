// routes/authRoutes.js
const express = require('express');

module.exports = function (db) {
  const router = express.Router();

  router.get('/login', (req, res) => {
    res.render('login', { title: 'Login' });
  });

  router.get('/signup', (req, res) => {
    res.render('signup', { title: 'Sign Up' });
  });

  router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.log('Logout error:', err);
        return res.send('Error logging out');
      }
      res.clearCookie('connect.sid');
      res.redirect('/');
    });
  });

  return router;
};
