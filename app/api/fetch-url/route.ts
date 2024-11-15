import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const CFTDTI_URL = "https://www.canada.ca/en/department-national-defence/services/benefits-military/pay-pension-benefits/benefits/canadian-forces-temporary-duty-travel-instructions.html";

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(CFTDTI_URL);
    const text = await response.text();
    
    // Remove HTML tags and get clean text
    const cleanText = text.replace(/<[^>]*>/g, ' ')
                         .replace(/\s+/g, ' ')
                         .trim();

    return NextResponse.json({
      characterCount: cleanText.length,
      wordCount: cleanText.split(/\s+/).length
    });
  } catch (error: any) {
    console.error('Error fetching URL:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch URL content' },
      { status: 500 }
    );
  }
}

