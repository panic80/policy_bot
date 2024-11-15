import type { NextApiRequest, NextApiResponse } from 'next';

const CFTDTI_URL = "https://www.canada.ca/en/department-national-defence/services/benefits-military/pay-pension-benefits/benefits/canadian-forces-temporary-duty-travel-instructions.html";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const response = await fetch(CFTDTI_URL);
    const text = await response.text();
    
    // Remove HTML tags and get clean text
    const cleanText = text.replace(/<[^>]*>/g, ' ')
                         .replace(/\s+/g, ' ')
                         .trim();

    return res.status(200).json({
      characterCount: cleanText.length,
      wordCount: cleanText.split(/\s+/).length
    });
  } catch (error: any) {
    console.error('Error fetching URL:', error);
    return res.status(500).json({
      message: error.message || 'Failed to fetch URL content'
    });
  }
}

