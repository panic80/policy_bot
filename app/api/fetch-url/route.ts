import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const sourceResponse = await fetch(
      "https://www.canada.ca/en/department-national-defence/services/benefits-military/pay-pension-benefits/benefits/canadian-forces-temporary-duty-travel-instructions.html"
    );
    const sourceText = await sourceResponse.text();
    const content = sourceText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    return NextResponse.json({
      characterCount: content.length,
      wordCount: content.split(/\s+/).length
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch URL stats' },
      { status: 500 }
    );
  }
}

