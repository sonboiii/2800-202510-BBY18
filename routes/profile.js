// routes/profile.js
const express = require('express');
const { ObjectId } = require('mongodb');

module.exports = function (db) {
  const router = express.Router();
  const users = db.collection('users');
  const favourites = db.collection('favourites');

  // Middleware to require login
  function requireLogin(req, res, next) {
    if (!req.session.user) return res.redirect('/login');
    next();
  }

  // GET /profile
  router.get('/', requireLogin, async (req, res) => {
    try {
      const favCount = await favourites.countDocuments({
        userId: req.session.user._id
      });

      res.render('profile', {
        user: req.session.user,
        favCount
      });
    } catch (err) {
      console.error('Failed to load profile:', err);
      res.status(500).send('Error loading profile');
    }
  });

  // POST /profile (update name/email)
  router.post('/', requireLogin, async (req, res) => {
    const { name, email } = req.body;

    try {
      await users.updateOne(
        { _id: new ObjectId(req.session.user._id) },
        { $set: { name, email } }
      );

      req.session.user.name = name;
      req.session.user.email = email;

      res.redirect('/profile');
    } catch (err) {
      console.error('Profile update failed:', err);
      res.status(500).send('Error updating profile');
    }
  });

  return router;
};
