const express = require('express');
const { ObjectId } = require('mongodb');

module.exports = function (db) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    if (!req.session.user) {
      return res.redirect('/login');
    }

    try {
      const userId = req.session.user._id;
      const items = await db.collection('pantryItems').find({ userId }).toArray();
      res.render('pantry', { items });
    } catch (err) {
      res.status(500).send('Error loading pantry page.');
    }
  });

  // Render ingredient form
  router.get('/add', (req, res) => {
    if (!req.session.user) {
      return res.redirect('/login');
    }
    res.render('addPantry'); 
  });

  // Adds item to pantry
  router.post('/add', async (req, res) => {
    if (!req.session.user) {
      return res.redirect('/login');
    }

    try {
      const pantryItem = {
        ...req.body,
        userId: req.session.user._id,
        addedAt: new Date()
      };
      await db.collection('pantryItems').insertOne(pantryItem);
      res.redirect('/pantry');
    } catch (err) {
      res.status(500).send('Failed to add item.');
    }
  });

  // Updates item
  router.post('/update/:id', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  try {
    const itemId = req.params.id;
    const userId = req.session.user._id;
    const updatedData = {
      name: req.body.name,
      quantity: req.body.quantity,
      unit: req.body.unit,
      category: req.body.category,
      expirationDate: req.body.expirationDate
    };

    const result = await db.collection('pantryItems').updateOne(
      { _id: new ObjectId(itemId), userId },
      { $set: updatedData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send('Item not found or unauthorized.');
    }

    res.status(200).send('Update successful');
  } catch (err) {
    res.status(500).send('Failed to update item.');
  }
});

  // Delete items from pantry
  router.post('/delete/:id', async (req, res) => {
    if (!req.session.user) {
      return res.redirect('/login');
    }

    try {
      const itemId = req.params.id;
      const userId = req.session.user._id;

      const result = await db.collection('pantryItems').deleteOne({
        _id: new ObjectId(itemId),
        userId
      });

      if (result.deletedCount === 0) {
        return res.status(404).send('Item not found or unauthorized.');
      }

      res.redirect('/pantry');
    } catch (err) {
      res.status(500).send('Failed to delete item.');
    }
  });

  // Gets pantry items as JSON
  router.get('/json', async (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const userId = req.session.user._id;
      const items = await db.collection('pantryItems').find({ userId }).toArray();
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: 'Failed to load pantry items.' });
    }
  });

  return router;
};
