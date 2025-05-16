const express = require('express');
const OpenAI = require('openai').default;

const openai = new OpenAI({
  baseURL:  "https://openrouter.ai/api/v1",
  apiKey:   process.env.OPENAI_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.SITE_URL || "",
    "X-Title":      process.env.SITE_TITLE || ""
  },
});

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
                max_tokens: 400
            });
            
            const raw = aiResponse.choices?.[0]?.message?.content?.trim();
            const description = raw && raw.length > 0 ? raw : "No Description Found.";

            console.log(description);
            res.json({ area, description });

        } catch (err) {
            console.error('AI request failed:', err);
            res.status(500).json({ error: 'AI description generation failed.' });
        }
    });

    return router;
};
