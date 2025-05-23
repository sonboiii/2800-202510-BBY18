const express = require('express');
const OpenAI = require('openai').default;
const router = express.Router();
const natural = require('natural');
const stemmer = natural.PorterStemmer;
const { ObjectId } = require('mongodb');

// Helper function to normalize ingredient names
function normalizeName(name = '') {
    return stemmer.stem(name.toLowerCase().trim());
}

// Count how many ingredients from a meal are present in the user's pantry
function countMatchedIngredients(meal, pantryNames) {
    const normalizedIngredients = meal.ingredients.map(ing => normalizeName(ing.name)).filter(Boolean);
    const matchedCount = normalizedIngredients.filter(ing => pantryNames.includes(ing)).length;

    return {
        total: normalizedIngredients.length,
        matched: matchedCount
    };
}

// Set up the OpenAI client for generating area descriptions
const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENAI_API_KEY_TWO,
    defaultHeaders: {
        "HTTP-Referer": process.env.SITE_URL || "",
        "X-Title": process.env.SITE_TITLE || ""
    },
});

module.exports = function (db) {

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

    // GET /meals/:area — Return meals from a specific area with pantry and favourite info
    router.get('/:area', async (req, res, next) => {
        if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });

        const areaName = req.params.area;

        try {
            const userId = req.session.user._id;

            // Get all meals from the specified area
            const meals = await db.collection('meals').find({ area: areaName }).toArray();

            // Get user's favourite meals
            const favourites = await db.collection('favourites').find({ userId }).toArray();
            const favouriteMealIds = favourites.map(f => String(f.mealId));
            
            // Get user's pantry items and normalize them
            const pantryItems = await db.collection('pantryItems').find({ userId }).toArray();
            const pantryNames = pantryItems.map(item => normalizeName(item.name));

            // Count how many users have favourited each meal
            const counts = await db.collection('favourites').aggregate([
                { $match: { mealId: { $in: meals.map(m => String(m._id)) } } },
                { $group: { _id: "$mealId", count: { $sum: 1 } } }
            ]).toArray();
            const countMap = Object.fromEntries(counts.map(c => [c._id, c.count]));

            const mealsWithStatus = meals.map(meal => ({
                ...meal,
                ingredientStatus: countMatchedIngredients(meal, pantryNames),
                favouriteCount: countMap[String(meal._id)] || 0,
            }));

            res.render('availableRecipes', {
                meals: mealsWithStatus,
                favouriteMealIds,
                area: areaName, 
                user: req.session.user,
                request: req
            });
        } catch (err) {
            next(err);
        }
    });

    // GET /meals/:area/description — Generate a short description for a cuisine using AI
    router.get('/:area/description', async (req, res) => {
        if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });

        const area = req.params.area;

        try {
            const prompt = `Describe ${area} cuisine in one appetizing sentence, no more than 20 words. Avoid specific dish names.`;

            const aiResponse = await openai.chat.completions.create({
                model: "qwen/qwen3-8b:free",
                messages: [
                    { role: "system", content: "You are a helpful assistant. Provide only the requested cuisine description, no explanations or reasoning." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 800
            });
            
            // Extract and sanitize the AI's response
            const raw = aiResponse.choices?.[0]?.message?.content?.trim();
            const description = raw && raw.length > 0 ? raw : "No Description Found.";

            res.json({ area, description });

        } catch (err) {
            console.error('AI request failed:', err);
            res.status(500).json({ error: 'AI description generation failed.' });
        }
    });

    return router;
};
