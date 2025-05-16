const express = require('express');
const router = express.Router();

module.exports = function (db) {
    const favouritesCollection = db.collection('favourites');

    // Add favourite recipes by id
    router.post('/:mealId', async (req, res) => {
        if (!req.session.user) {
            return res.status(401).send('Unauthorized');
        }

        const userId = req.session.user._id;
        const mealId = req.params.mealId;

        try {
            // check for existing favourites
            const exists = await favouritesCollection.findOne({
                userId,
                mealId,
            });

            if (!exists) {
                await favouritesCollection.insertOne({
                    userId,
                    mealId,
                    createdAt: new Date()
                });
            }

            res.redirect(req.get('referer') || '/');

        } catch (err) {
            console.error('Error adding to favourites:', err);
            res.status(500).send('Internal Server Error');
        }
    });

    router.get('/', async (req, res) => {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        const userId = req.session.user._id;

        try {
            const favs = await favouritesCollection.find({
                userId: (userId)
            }).toArray();

            const mealIds = favs.map(f => f.mealId);
            const meals = await db.collection('meals')
                .find({ _id: { $in: mealIds } })
                .toArray();


            res.render('favourites', { meals });
        } catch (err) {
            console.error('Error loading favourites:', err);
            res.status(500).send('Error loading favourites');
        }
    });

    router.post('/remove/:mealId', async (req, res) => {
        if (!req.session.user) {
            return res.status(401).send('Unauthorized');
        }

        const userId = req.session.user._id;
        const mealId = req.params.mealId;

        try {
            await db.collection('favourites').deleteOne({ userId, mealId });
            res.redirect(req.get('referer') || '/');
        } catch (err) {
            console.error('Error removing from favourites:', err);
            res.status(500).send('Internal Server Error');
        }
    });



    return router;
};
