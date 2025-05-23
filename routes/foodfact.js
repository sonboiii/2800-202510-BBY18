const express = require('express');
const { OpenAI } = require('openai');

module.exports = function () {
  const router = express.Router();

  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY_TWO,
    defaultHeaders: {
      "HTTP-Referer": process.env.SITE_URL || "",
      "X-Title": process.env.SITE_TITLE || ""
    }
  });
  
  // src: https://platform.openai.com/docs/api-reference/chat/create
  router.get('/', async (req, res) => {
    try {
      // Make a chat completion request to Claude 3 Haiku model
      const completion = await openai.chat.completions.create({
        model: "anthropic/claude-3-haiku",
        messages: [{ role: "user", content: "Without writing 'Here's a random fun, food fact for you', give me a random, fun food fact!" }]
      });

      // Extract and return the content from the model's response
      const fact = completion.choices[0].message.content.trim();
      res.json({ fact });
    } catch (err) {
      console.error('Food fact error:', err);
      res.status(500).json({ error: 'Could not fetch a food fact.' });
    }
  });

  return router;
};
