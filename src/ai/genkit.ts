import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// In production, process.env.GEMINI_API_KEY will be populated by the value
// from .env.production during the build process.
export const ai = genkit({
  plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY})],
  model: 'googleai/gemini-2.5-flash',
});
