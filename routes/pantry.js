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
  if (!req.session.user) return res.redirect('/login');

  try {
    const { _id, ...raw } = req.body;
    const userId = (req.session.user._id);

    const normalizedName = raw.name.trim().toLowerCase(); // case sensitivity matching
    const normalizedExpiration = raw.expirationDate?.trim() || null;

    const cleaned = {
      ...raw,
      name: raw.name.trim(),
      expirationDate: normalizedExpiration
    };

    const duplicate = await db.collection('pantryItems').findOne({
      userId,
      name: { $regex: `^${normalizedName}$`, $options: 'i' },
      quantity: cleaned.quantity,
      unit: cleaned.unit,
      expirationDate: normalizedExpiration
    });

    if (duplicate && !req.body.forceInsert) {
      return res.status(409).json({ duplicate: true, message: 'Similar item already exists' });
    }

    const pantryItem = {
      ...cleaned,
      userId,
      addedAt: new Date()
    };

    await db.collection('pantryItems').insertOne(pantryItem);
    res.redirect('/pantry');
  } catch (err) {
    console.error('Error in /add:', err);
    res.status(500).send('Failed to add item.');
  }
});

  // Updates item
  router.post('/update/:id', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    try {
      const itemId = new ObjectId(req.params.id);
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
    const itemId = new ObjectId(req.params.id);
    const userId = req.session.user._id;

    const result = await db.collection('pantryItems').deleteOne({
      _id: itemId,
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

// Clears the current pantry
  router.post('/clear', async (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const userId = (req.session.user._id);
    const result = await db.collection('pantryItems').deleteMany({ userId });

    res.json({
      message: 'Pantry cleared',
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error("Error clearing pantry:", err);
    next(err);
  }
});

// Undoes the clear
router.post('/restore', async (req, res, next) => {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });

  const items = req.body.items;
  if (!Array.isArray(items)) {
    console.error("Invalid data structure:", req.body);
    return res.status(400).json({ error: 'Invalid data' });
  }

  try {
    const restored = items.map(({ _id, userId, addedAt, forceInsert, ...rest }) => ({
      ...rest,
      userId: req.session.user._id,
      addedAt: new Date()
    }));

    await db.collection('pantryItems').insertMany(restored);
    res.json({ message: 'Restored pantry items' });
  } catch (err) {
    console.error("Restore error:", err);
    next(err);
  }
});


  // Gets pantry items as JSON
router.get('/json', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });

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
