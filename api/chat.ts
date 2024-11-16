import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userInput } = req.body;

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'OpenRouter API key not configured' });
    }

    // Fetch CFTDTI content
    const sourceResponse = await fetch(
      "https://www.canada.ca/en/department-national-defence/services/benefits-military/pay-pension-benefits/benefits/canadian-forces-temporary-duty-travel-instructions.html"
    );
    const sourceText = await sourceResponse.text();
    const sourceContent = sourceText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    // Make request to OpenRouter
    const chatResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.VERCEL_URL || 'http://localhost:3000',
        'X-Title': 'CFTDTI Assistant'
      },
      body: JSON.stringify({
        model: "google/gemini-flash-1.5-8b",
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant specializing in Canadian Forces Temporary Duty Travel Instructions (CFTDTI). 
            Use the following source content to answer questions accurately: ${sourceContent}`
          },
          {
            role: "user",
            content: userInput
          }
        ]
      })
    });

    const data = await chatResponse.json();

    return res.status(200).json({
      message: data.choices[0].message.content,
      characterCount: sourceContent.length
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

