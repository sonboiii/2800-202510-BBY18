const express = require('express');
const { ObjectId } = require('mongodb');
const natural = require('natural');
const stemmer = natural.PorterStemmer;

// Utility to normalize ingredient names using stemming and lowercase
function normalizeName(name = '') {
  return stemmer.stem(name.toLowerCase().trim());
}

// Counts how many ingredients in the meal match items in the user's pantry
function countMatchedIngredients(meal, pantryNames) {
  const normalizedIngredients = meal.ingredients.map(ing => normalizeName(ing.name)).filter(Boolean);
  const matchedCount = normalizedIngredients.filter(ing => pantryNames.includes(ing)).length;
  return {
    total: normalizedIngredients.length,
    matched: matchedCount
  };
}

module.exports = function (db) {
  const router = express.Router();

  router.get('/', async (req, res, next) => {
    try {
      const user = req.session.user;
      if (!user) return res.status(401).redirect('/login');

      const { category, area } = req.query;
      
      const favourites = await db.collection('favourites').find({ userId: user._id }).toArray(); //fetches the user's fav recipes
      const favouriteMealIds = favourites.map(f => f.mealId); // extracts the meal ID

      if (favouriteMealIds.length === 0) { // render empty view if no favourites
        return res.render('favourites', {
          meals: [],
          categories: [],
          areas: [],
          category: '',
          area: '',
          request: req
        });
      }

      // Convert string IDs to ObjectIds if needed
      const mealQueryIds = favouriteMealIds.map(id =>
        typeof id === 'string' && id.length === 24 ? new ObjectId(id) : id
      );

      // Fetch meal documents for user's favourites
      const allFavourites = await db.collection('meals').find({ 
        _id: { $in: mealQueryIds } // fetch favourite means from database by ID
      }).toArray();

      // Get normalized pantry item names for ingredient matching
      const pantryItems = await db.collection('pantryItems').find({ userId: user._id }).toArray();
      const pantryNames = pantryItems.map(item => normalizeName(item.name));
      
      const allFavouriteEntries = await db.collection('favourites').find().toArray();
      const countMap = {};
      allFavouriteEntries.forEach(entry => {
        const key = String(entry.mealId);
        countMap[key] = (countMap[key] || 0) + 1; // counts how many users favourited a meal
      });

      // Attach pantry match info and favourite count to each meal
      const favouritesWithStatus = allFavourites.map(meal => ({
        ...meal,
        ingredientStatus: countMatchedIngredients(meal, pantryNames),
        favouriteCount: countMap[String(meal._id)] || 0
      }));

      // Extract and sort unique categories and areas for filtering UI
      const categories = [...new Set(allFavourites.map(m => m.category).filter(Boolean))].sort();
      const areas = [...new Set(allFavourites.map(m => m.area).filter(Boolean))].sort();

      // Apply category/area filters if present
      let filteredMeals = favouritesWithStatus;
      if (category) filteredMeals = filteredMeals.filter(m => m.category === category);
      if (area) filteredMeals = filteredMeals.filter(m => m.area === area);

      res.render('favourites', {
        meals: filteredMeals, 
        categories,
        areas,
        category: category || '',
        area: area || '',
        request: req
      });

    } catch (err) {
      next(err);
    }
  });

  // Add a meal to favourites
router.post('/:id', async (req, res, next) => {
  try {
    const user = req.session.user;
    const mealId = req.params.id;

    if (!user) return res.status(401).redirect('/login');
    if (!mealId) return res.status(400).send("Meal ID required.");

    // Prevent duplicates
    const existing = await db.collection('favourites').findOne({
      userId: user._id,
      mealId
    });

    if (!existing) {
      await db.collection('favourites').insertOne({
        userId: user._id,
        mealId
      });
    }

    const redirectUrl = req.get('Referer') || '/available-recipes';
    res.redirect(redirectUrl);
  } catch (err) {
    next(err);
  }
});


  // Remove a meal from favourites
  router.post('/remove/:id', async (req, res, next) => {
    try {
      const user = req.session.user;
      const mealId = req.params.id;

      if (!user) return res.status(401).redirect('/login');
      if (!mealId) return res.status(400).send("Meal ID required.");

      // Remove favourite entry
      await db.collection('favourites').deleteOne({
        userId: user._id,
        mealId: mealId
      });

      const redirectUrl = req.get('Referer') || '/favourites';
      res.redirect(redirectUrl);

    } catch (err) {
      next(err);
    }
  });


  return router;
};
