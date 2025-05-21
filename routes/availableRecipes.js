const express = require('express');
const router = express.Router();
const natural = require('natural');
const stemmer = natural.PorterStemmer;
const axios = require('axios');
const { ObjectId } = require('mongodb');

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
  router.get('/', async (req, res) => {
    if (!req.session.user) {
      console.warn("No user session found");
      return res.redirect('/login');
    }

    try {
      const userId = req.session.user._id;
      const { category, area } = req.query;

      const pantryItems = await db.collection('pantryItems').find({ userId }).toArray();
      const pantryNames = pantryItems.map(i => normalizeName(i.name));

      const allMeals = await db.collection('meals').find({}).toArray();

      const baseMatchedMeals = allMeals.filter(meal => {
        const normalizedIngredients = meal.ingredients.map(ing => normalizeName(ing.name)).filter(Boolean);
        return normalizedIngredients.every(ing => pantryNames.includes(ing));
      });

      let matchedMeals = baseMatchedMeals;

      if (matchedMeals.length === 0) {
        console.log("No matched meals found in DB. Falling back to MealDB API.");
        const { data } = await axios.get('https://www.themealdb.com/api/json/v1/1/search.php?f=c');
        const apiMeals = data.meals || [];

        matchedMeals = apiMeals.map(m => ({
          _id: m.idMeal,
          name: m.strMeal,
          thumbnail: m.strMealThumb,
          category: m.strCategory,
          area: m.strArea,
          instructions: m.strInstructions,
          ingredients: Array.from({ length: 20 }, (_, i) => {
            const name = m[`strIngredient${i + 1}`];
            const measure = m[`strMeasure${i + 1}`];
            return name?.trim() ? { name, measure } : null;
          }).filter(Boolean)
        }));

        matchedMeals = matchedMeals.filter(meal => {
          const normalizedIngredients = meal.ingredients.map(ing => normalizeName(ing.name)).filter(Boolean);
          return normalizedIngredients.every(ing => pantryNames.includes(ing));
        });
      }

      if (category) {
        matchedMeals = matchedMeals.filter(m => m.category === category);
      }
      if (area) {
        matchedMeals = matchedMeals.filter(m => m.area === area);
      }

      const mealsWithStatus = matchedMeals.map(meal => ({
        ...meal,
        ingredientStatus: countMatchedIngredients(meal, pantryNames)
      }));

      const categories = [...new Set(baseMatchedMeals.map(m => m.category).filter(Boolean))].sort();
      const areas = [...new Set(baseMatchedMeals.map(m => m.area).filter(Boolean))].sort();

      const favourites = await db.collection('favourites').find({ userId }).toArray();
      const favouriteMealIds = favourites.map(f => String(f.mealId));

      res.render('availableRecipes', {
        meals: mealsWithStatus,
        favouriteMealIds,
        user: req.session.user,
        categories,
        areas,
        category: category || '',
        area: area || '',
        request: req
      });

    } catch (err) {
      console.error("Error generating available recipes:", err);
      res.status(500).send("Failed to load available recipes.");
    }
  });

  router.get('/recipe/:id', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    const id = req.params.id;

    try {
      let meal = await db.collection('meals').findOne({ _id: id });

      if (!meal) {
        const { data } = await axios.get(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
        const m = data.meals?.[0];
        if (!m) return res.status(404).send('Recipe not found');

        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
          const name = m[`strIngredient${i}`];
          const measure = m[`strMeasure${i}`];
          if (name && name.trim()) {
            ingredients.push({ name, measure });
          }
        }

        meal = {
          _id: m.idMeal,
          name: m.strMeal,
          category: m.strCategory,
          area: m.strArea,
          thumbnail: m.strMealThumb,
          instructions: m.strInstructions,
          ingredients
        };
      }

      const userId = req.session.user._id;
      const pantryItems = await db.collection('pantryItems').find({ userId }).toArray();
      const pantryNames = pantryItems.map(i => normalizeName(i.name));

      res.render('seemore', {
        meal,
        pantryNames
      });

    } catch (err) {
      console.error('Error loading recipe detail:', err);
      res.status(500).send('Failed to load recipe.');
    }
  });

  router.post('/ingredient-list', async (req, res) => {
    const included = req.body.include || [];
    const total = parseInt(req.body.total, 10);
    const selectedIngredients = [];

    for (let i = 0; i < total; i++) {
      if (included.includes(i.toString())) {
        const name = req.body[`name_${i}`];
        const measure = req.body[`measure_${i}`];
        selectedIngredients.push({ name, measure });
      }
    }

    req.session.shoppingList = selectedIngredients;
    return res.redirect('/stores');
  });

  return router;
};
