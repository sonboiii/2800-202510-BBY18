const express = require('express');
const { ObjectId } = require('mongodb');
const natural = require('natural');
const stemmer = natural.PorterStemmer;

function normalizeName(name = '') {
  return stemmer.stem(name.toLowerCase().trim());
}

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
      const favourites = await db.collection('favourites').find({ userId: user._id }).toArray();
      const favouriteMealIds = favourites.map(f => f.mealId);

      if (favouriteMealIds.length === 0) {
        return res.render('favourites', {
          meals: [],
          categories: [],
          areas: [],
          category: '',
          area: '',
          request: req
        });
      }
      const mealQueryIds = favouriteMealIds.map(id =>
        typeof id === 'string' && id.length === 24 ? new ObjectId(id) : id
      );

      const allFavourites = await db.collection('meals').find({
        _id: { $in: mealQueryIds }
      }).toArray();

      const pantryItems = await db.collection('pantryItems').find({ userId: user._id }).toArray();
      const pantryNames = pantryItems.map(item => normalizeName(item.name));
      const favouritesWithStatus = allFavourites.map(meal => ({
        ...meal,
        ingredientStatus: countMatchedIngredients(meal, pantryNames)
      }));

      const categories = [...new Set(allFavourites.map(m => m.category).filter(Boolean))].sort();
      const areas = [...new Set(allFavourites.map(m => m.area).filter(Boolean))].sort();
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

  return router;
};
