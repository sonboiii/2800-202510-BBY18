const express = require('express');

module.exports = function (db) {
    const router = express.Router();

    // GET /meals/areas — return unique areas
    router.get('/', async (req, res, next) => {
        if (!req.session.user) return res.status(401).json([]);

        try {
            const areas = await db.collection('meals').distinct('area');
            res.json(areas); // sends array like ["Italian", "Japanese", ...]
        } catch (err) {
            next(err);
        }
    });

    router.get('/:area', async (req, res, next) => {
        if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });

        const areaName = req.params.area;

        try {
            const userId = req.session.user._id;
            const meals = await db.collection('meals').find({ area: areaName }).toArray();
            const favourites = await db.collection('favourites').find({ userId }).toArray();
            const favouriteMealIds = favourites.map(f => String(f.mealId));
            res.render('availableRecipes', {
            meals,
            favouriteMealIds, 
            user: req.session.user 
        });
        } catch (err) {
            next(err);
        }
    });

    return router;
};
