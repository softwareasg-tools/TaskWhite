const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.generateTaskTypes = async (req, res) => {
  try {
    const { industry } = req.body;
    if (!industry) {
      return res.status(400).json({ error: 'Industry name is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ error: 'GEMINI_API_KEY is not configured in the server environment. Please add it to your .env file and restart the server.' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are an expert operations manager. Provide a list of 5 to 8 standard, high-level task types or workflows that a typical company in the "${industry}" industry would need to manage in their task management software.
    
    Return ONLY a valid, raw JSON array of strings. Do not include markdown blocks or any other text.
    Example output format:
    ["Draft Contracts", "Client Consultation", "Review Documents", "Court Filing"]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Parse the JSON array, removing any potential markdown code blocks if the AI ignored the instructions
    const jsonString = text.replace(/^```json/m, '').replace(/^```/m, '').replace(/```$/m, '').trim();
    const tasks = JSON.parse(jsonString);

    if (!Array.isArray(tasks)) {
      throw new Error('AI did not return an array');
    }

    res.json({ tasks });
  } catch (err) {
    console.error('AI Generation Error:', err);
    res.status(500).json({ error: 'Failed to generate tasks using AI. ' + (err.message || '') });
  }
};
