const express = require('express');

module.exports = function(db) {
    const router = express.Router();

    // Render the search & selection page
    router.get('/', (req, res) => {
        if (!req.session.user) return res.redirect('/login');
        res.render('ingredients', {
            title: 'Find Recipes by Ingredients',
            selectedIngredients: [],
            meals: []
        });
    });

    // AJAX endpoint: fuzzy-search ingredients by name
    router.get('/search', async (req, res, next) => {
        if (!req.session.user) return res.status(401).json([]);
        try {
            const q = req.query.q || '';
            const suggestions = await db.collection('ingredients')
                .find({ name: { $regex: q, $options: 'i' } })
                .limit(10)
                .project({ _id: 1, name: 1 })
                .toArray();
            res.json(suggestions);
        } catch (err) {
            next(err);
        }
    });

    // Handle “Get Meals” form submission
    router.post('/meals', async (req, res, next) => {
        if (!req.session.user) return res.redirect('/login');
        try {
            let ingredientIds = req.body['ingredients[]'] || req.body.ingredients || [];
            if (!Array.isArray(ingredientIds)) ingredientIds = [ingredientIds];

            // fetch the names of the selected ingredients
            const selectedDocs = await db.collection('ingredients')
                .find({ _id: { $in: ingredientIds } })
                .project({ _id: 1, name: 1 })
                .toArray();

            // find all meals that contain *all* the selected ingredient IDs
            const meals = await db.collection('meals').aggregate([
                { $match: { 'ingredients.id': { $all: ingredientIds } } },
                {
                    $project: {
                        name: 1,
                        category: 1,
                        area: 1,
                        instructions: 1,
                        thumbnail: 1,
                        ingredients: 1
                    }
                }
            ]).toArray();

            res.render('ingredients', {
                title: 'Find Recipes by Ingredients',
                selectedIngredients: selectedDocs,
                meals
            });
        } catch (err) {
            next(err);
        }
    });

    // Meal detail page (Read More)
    router.get('/meal/:id', async (req, res, next) => {
        if (!req.session.user) return res.redirect('/login');
        try {
            const mealId = req.params.id;
            const meal = await db.collection('meals').findOne({ _id: mealId });
            if (!meal) return res.status(404).send('Meal not found');
            res.render('meal', {
                title: meal.name,
                meal
            });
        } catch (err) {
            next(err);
        }
    });

    return router;
};
