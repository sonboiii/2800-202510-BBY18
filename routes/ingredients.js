// routes/ingredients.js
const express = require('express');
const OpenAI = require('openai').default;

const openai = new OpenAI({
    baseURL:  "https://openrouter.ai/api/v1",
    apiKey:   process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
        "HTTP-Referer": process.env.SITE_URL || "",
        "X-Title":      process.env.SITE_TITLE || ""
    },
});

module.exports = function(db) {
    const router = express.Router();

    // 1) Search & selection page
    router.get('/', (req, res) => {
        if (!req.session.user) return res.redirect('/login');
        res.render('ingredients', {
            title: 'Find Recipes by Ingredients',
            selectedIngredients: [],
            meals: []
        });
    });

    // 2) AJAX fuzzy-search
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

    // 3) “Get Meals” form submission
    router.post('/meals', async (req, res, next) => {
        if (!req.session.user) return res.redirect('/login');
        try {
            let ids = req.body['ingredients[]'] || req.body.ingredients || [];
            if (!Array.isArray(ids)) ids = [ids];

            const selectedDocs = await db.collection('ingredients')
                .find({ _id: { $in: ids } })
                .project({ _id: 1, name: 1 })
                .toArray();

            const meals = await db.collection('meals').aggregate([
                { $match: { 'ingredients.id': { $all: ids } } },
                { $project: {
                        name: 1, category: 1, area: 1,
                        instructions: 1, thumbnail: 1, ingredients: 1
                    }}
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

    // 4) JSON endpoint for AI summary — MUST come before the detail-route
    router.get('/meal/:id/summary', async (req, res, next) => {
        res.set('Cache-Control', 'no-store, max-age=0');
        res.set('Pragma', 'no-cache');
        if (!req.session.user)
            return res.status(401).json({ error: 'Unauthorized' });

        try {
            const meal = await db.collection('meals').findOne({ _id: req.params.id });
            if (!meal)
                return res.status(404).json({ error: 'Meal not found' });

            const dishPrompt = `
You are a friendly kitchen assistant.
Have more details and be as coherent as possible.
Write an appetizing description for following recipe:
Name: ${meal.name}
Category: ${meal.category}
Area: ${meal.area}
Ingredients:
${meal.ingredients.map(i => `- ${i.name}: ${i.measure}`).join('\n')}
      Use your own word. Remember to use .md format to add visual aid.`.trim();



            const stepsPrompt = `
You are a cooking guide.
Lookup the instruction and then
Summarize these cooking instructions:
Remember to use .md format to add visual aid.
${meal.instructions}
      `.trim();

            const descRes = await
                openai.chat.completions.create({
                    model:       "qwen/qwen3-8b:free",
                    messages: [
                        { role: "system", content: "You summarize recipes." },
                        { role: "user",   content: dishPrompt }
                    ],
                    temperature: 0.7,
                    max_tokens:  5000
                })

            const aiDescription = descRes.choices[0].message.content.trim();


            return res.json({ aiDescription} );
        } catch (err) {
            next(err);
        }
    });

    // 5) Full-detail page — now only matches /meal/:id exactly
    router.get('/meal/:id', async (req, res, next) => {
        if (!req.session.user) return res.redirect('/login');
        try {
            const meal = await db.collection('meals').findOne({ _id: req.params.id });
            if (!meal) return res.status(404).send('Meal not found');
            res.render('meal', { title: meal.name, meal });
        } catch (err) {
            next(err);
        }
    });

    return router;
};
