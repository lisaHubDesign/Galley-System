import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser limit increased to support large figures/data transfers
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Initialize Gemini AI Client
  let ai: GoogleGenAI | null = null;
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
    console.log('Gemini client initialized successfully.');
  } else {
    console.warn('WARNING: GEMINI_API_KEY is not defined in the environment. AI proofreading features will fail.');
  }

  // API: Healthcheck
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // API: Gemini Proxy for Academic Proofing
  app.post('/api/gemini', async (req, res) => {
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API client is not configured. Please supply a GEMINI_API_KEY in the Secrets panel.'
      });
    }

    const { action, text, context } = req.body;

    if (!action || !text) {
      return res.status(400).json({ error: 'Parameters "action" and "text" are required.' });
    }

    try {
      let prompt = '';

      switch (action) {
        case 'format-references':
          prompt = `You are an expert academic copyeditor. Your task is to take the following raw or messy bibliographic references and format them exactly according to the IEEE standard citation rules.
Each reference should be on its own line, numbered in order (e.g., [1] Author, "Title", Journal, Year). Ensure all author names, journal names, years, and issues are formatted cleanly, correcting any obvious punctuation errors or gaps. Do not add any conversational text or preambles, return only the formatted list of references.

Input references:
${text}`;
          break;

        case 'academic-tone':
          prompt = `You are a professional academic reviewer for the Atlantis Press "Advances in Computer Science Research" (ACSR) series. 
Analyze the following text block and rewrite it to elevate its academic tone, scholarly rigor, and flow. Use precise computer science terminology where appropriate, eliminate slang or passive structures, and maintain the original meaning precisely. Do not introduce any conversational comments. Return ONLY the rewritten text.

Input text:
${text}`;
          break;

        case 'generate-abstract':
          prompt = `You are a senior computer science researcher. Based on the following article details (Title: "${context?.title || 'Unknown'}", Authors: "${context?.authors || 'Unknown'}", and Section Headings/Draft content: ${JSON.stringify(context?.sections || [])}), write a high-impact, professional Academic Abstract (typically 150-250 words) and a list of 4-6 semicolon-separated keywords.
Return the output in this strict JSON format:
{
  "abstract": "The generated abstract text...",
  "keywords": "keyword1; keyword2; keyword3; keyword4"
}
Ensure the JSON is raw, valid, and contains no markdown code block fences. Only return the JSON.`;
          break;

        default:
          return res.status(400).json({ error: `Invalid action "${action}"` });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const responseText = response.text || '';
      res.json({ result: responseText });
    } catch (err: any) {
      console.error('Gemini call error:', err);
      res.status(500).json({ error: err.message || 'Error occurred while contacting Gemini API.' });
    }
  });

  // Serve static assets or mount Vite in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware mounted in development mode.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving production static files from dist/.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup failed:', err);
});
