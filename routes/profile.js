// routes/profile.js
const express = require('express');
const { ObjectId } = require('mongodb');

module.exports = function (db) {
  const router = express.Router();
  const users = db.collection('users');
  const favourites = db.collection('favourites');

  function requireLogin(req, res, next) {
    if (!req.session.user) return res.redirect('/login');
    next();
  }

  // Utility: parse basic quantity and units
  function parseQuantity(str) {
    const match = str?.trim().match(/^([0-9.\/]+)\s*(.*)$/);
    if (!match) return { qty: 0, unit: str || '' };
    const raw = match[1];
    const unit = match[2] || '';
    let qty = 0;

    try {
      if (raw.includes('/')) {
        const [num, den] = raw.split('/');
        qty = parseFloat(num) / parseFloat(den);
      } else {
        qty = parseFloat(raw);
      }
    } catch {
      qty = 0;
    }

    return { qty, unit };
  }

  function formatQuantity(qty, unit) {
    return `${Math.round(qty * 100) / 100} ${unit}`.trim();
  }

  // GET /profile
  router.get('/', requireLogin, async (req, res) => {
    try {
      const favCount = await favourites.countDocuments({
        userId: req.session.user._id
      });

      const groceryList = req.session.groceryList || [];

      res.render('profile', {
        user: req.session.user,
        favCount,
        groceryList
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

  // POST /profile/grocery-list
  router.post('/grocery-list', requireLogin, (req, res) => {
    try {
      const parsedItems = JSON.parse(req.body.items);
      if (!Array.isArray(parsedItems)) {
        return res.status(400).send("Invalid grocery list format.");
      }

      const existing = req.session.groceryList || [];
      const merged = [...existing];

      parsedItems.forEach(newItem => {
        const existingItem = merged.find(item => item.name.toLowerCase() === newItem.name.toLowerCase());

        if (existingItem) {
          const { qty: q1, unit: u1 } = parseQuantity(existingItem.measure || '');
          const { qty: q2, unit: u2 } = parseQuantity(newItem.measure || '');

          if (u1 === u2 && !isNaN(q1) && !isNaN(q2)) {
            const combinedQty = q1 + q2;
            existingItem.measure = formatQuantity(combinedQty, u1);
          } else {
            existingItem.measure = `${existingItem.measure || ''} + ${newItem.measure}`;
          }
        } else {
          merged.push(newItem);
        }
      });

      req.session.groceryList = merged;
      res.redirect('/profile');
    } catch (err) {
      console.error("Error saving grocery list:", err);
      res.status(500).send("Failed to save grocery list.");
    }
  });

  return router;
};