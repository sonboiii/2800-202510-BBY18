const express = require('express');
const router = express.Router();
const natural = require('natural');
const stemmer = natural.PorterStemmer;
const axios = require('axios');

function normalizeName(name = '') {
    return stemmer.stem(name.toLowerCase().trim());
}

module.exports = function (db) {
    router.get('/', async (req, res) => {

        if (!req.session.user) {
            console.warn("No user session found");
            return res.redirect('/login');
        }

        try {
            const userId = req.session.user._id;
            const pantryItems = await db.collection('pantryItems')
                .find({ userId })
                .toArray();

            const pantryNames = pantryItems.map(i => normalizeName(i.name));

            const allMeals = await db.collection('meals').find({}).toArray();

            let matchedMeals = allMeals.filter(meal => {
                const normalizedIngredients = meal.ingredients
                    .map(ing => normalizeName(ing.name))
                    .filter(Boolean);
                return normalizedIngredients.every(ing => pantryNames.includes(ing));
            });

            // Fallback: if no matches, use public MealDB API
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
            }
            const favourites = await db.collection('favourites')
            .find({ userId })
            .toArray();

        const favouriteMealIds = favourites.map(f => String(f.mealId));


            res.render('availableRecipes', {
                meals: matchedMeals,
                favouriteMealIds,
                user: req.session.user
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
            // Check local MongoDB meals collection first
            let meal = await db.collection('meals').findOne({ _id: id });

            // If not found, try fetching from TheMealDB API
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

            res.render('seemore', { meal });
        } catch (err) {
            console.error('Error loading recipe detail:', err);
            res.status(500).send('Failed to load recipe.');
        }
    });

    return router;
};