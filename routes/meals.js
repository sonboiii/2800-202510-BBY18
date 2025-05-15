const express = require('express');

module.exports = function(db) {
    const router = express.Router();

    // GET /meals/areas — return unique areas
    router.get('/areas', async (req, res, next) => {
        if (!req.session.user) return res.status(401).json([]);
        try {
            const areas = await db.collection('meals').distinct('area');
            res.json(areas); // sends array like ["Italian", "Japanese", ...]
        } catch (err) {
            next(err);
        }
    });

    return router;
};
