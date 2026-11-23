import { app } from './app.js';
import { geminiService } from './services/gemini.js';

const port = process.env.PORT || 5001;

app.listen(port, () => {
  console.log(`🚀 DoraWi AI Server running at http://localhost:${port}`);
  console.log(`📡 Gemini API Key Status: ${geminiService.hasApiKey() ? 'Configured ✅' : 'Demo Mode (Pass x-gemini-api-key or configure .env) ⚠️'}`);
});
