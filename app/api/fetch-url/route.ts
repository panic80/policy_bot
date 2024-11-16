import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { URLS } from '@/constants/urls';
import { fallbackContent } from '@/data/fallback-content';

async function fetchContent(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from ${url}: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove unnecessary elements
    $('script').remove();
    $('style').remove();
    $('nav').remove();
    $('header').remove();
    $('footer').remove();

    // Get main content
    const content = $('main').text();
    return content.replace(/\s+/g, ' ').trim();
  } catch (error) {
    console.error(`Error fetching from ${url}:`, error);
    return null;
  }
}

export async function GET() {
  try {
    // Try main URL first
    let content = await fetchContent(URLS.CFTDTI_MAIN);

    // If main URL fails, try backup
    if (!content) {
      console.log('Main URL failed, trying backup...');
      content = await fetchContent(URLS.CFTDTI_BACKUP);
    }

    // If both fail, use fallback
    if (!content) {
      console.log('Using fallback content');
      return NextResponse.json({
        characterCount: fallbackContent.text.length,
        wordCount: fallbackContent.text.split(/\s+/).length,
        content: fallbackContent.text,
        source: 'fallback'
      });
    }

    const characterCount = content.length;
    const wordCount = content.split(/\s+/).length;

    console.log(`Fetched content - Characters: ${characterCount}, Words: ${wordCount}`);

    return NextResponse.json({
      characterCount,
      wordCount,
      content,
      source: 'live'
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });

  } catch (error) {
    console.error('Error in fetch-url route:', error);
    return NextResponse.json({
      characterCount: fallbackContent.text.length,
      wordCount: fallbackContent.text.split(/\s+/).length,
      content: fallbackContent.text,
      source: 'fallback',
      error: error instanceof Error ? error.message : 'Failed to fetch URL'
    });
  }
}

