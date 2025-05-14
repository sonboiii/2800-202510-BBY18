const express = require('express');
const router = express.Router();
//src: https://naturalnode.github.io/natural/ for stemming pluralized words for matching (not perfect solution, but will do)
const natural = require('natural');
const stemmer = natural.PorterStemmer;


function normalizeName(name = '') {
    return stemmer.stem(name.toLowerCase().trim());
}

module.exports = function (db) {
    router.get('/', async (req, res) => {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        try {
            const userId = req.session.user._id;
            const pantryItems = await db.collection('pantryItems')
                .find({ userId })
                .toArray();

            const pantryNames = pantryItems.map(i => normalizeName(i.name));

            // load all recipes from the meals collection 
            const allMeals = await db.collection('meals').find({}).toArray();
            const matchedMeals = allMeals.filter(meal => {
                const normalizedIngredients = meal.ingredients
                    .map(ing => normalizeName(ing.name))
                    .filter(Boolean);
                //return recipes that match user's pantry
                return normalizedIngredients.every(ing => pantryNames.includes(ing));
            });


            res.render('availableRecipes', {
                meals: matchedMeals,
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
            const meal = await db.collection('meals').findOne({ _id: id });
            if (!meal) return res.status(404).send('Recipe not found');

            res.render('recipeDetail', { meal });
        } catch (err) {
            console.error('Error loading recipe detail:', err);
            res.status(500).send('Failed to load recipe.');
        }
    });


    return router;
};
