// routes/ingredients.js
const express = require('express');

module.exports = function(db) {
    const router = express.Router();

    // Render the search & selection page
    router.get('/', (req, res) => {
        if (!req.session.user) return res.redirect('/login');
        res.render('ingredients', {
            title: 'Find Recipes by Ingredients',
            ingredientsInput: req.query.ingredients || '',
            recipes: []
        });
    });

    // Handle form submission / “Get Recipes”
    router.post('/', async (req, res) => {
        if (!req.session.user) return res.redirect('/login');

        // Parse comma-separated ingredients
        const raw = req.body.ingredients || '';
        const list = raw
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);

        // TODO: replace this stub with a real lookup (DB or external API)
        const recipes = list.map(ing =>
            ing[0].toUpperCase() + ing.slice(1) + ' Delight'
        );

        res.render('ingredients', {
            title: 'Find Recipes by Ingredients',
            ingredientsInput: raw,
            recipes
        });
    });

    return router;
};
