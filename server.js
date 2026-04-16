const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
const GEMINI_KEY = process.env.GEMINI_API_KEY;
app.get('/', (req, res) => res.json({ status: 'SlideAI online', engine: 'Gemini' }));
app.post('/generate', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt required' });
  if (!GEMINI_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY not set' });
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Retorne APENAS JSON válido sem markdown.\n\n' + prompt }] }],
        generationConfig: { temperature: 0.5, maxOutputTokens: 8192, responseMimeType: 'application/json' }
      }),
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: JSON.stringify(data) });
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const match = clean.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : clean);
    res.json({ result: parsed });
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: e.message });
  }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`SlideAI porta ${PORT}`));
