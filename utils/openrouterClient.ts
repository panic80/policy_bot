import axios from 'axios';

const openrouterClient = axios.create({
  baseURL: 'https://openrouter.ai/api/v1',
  headers: {
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'HTTP-Referer': process.env.YOUR_SITE_URL, // Required for OpenRouter
    'Content-Type': 'application/json',
  },
});

export default openrouterClient;

