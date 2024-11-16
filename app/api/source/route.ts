// app/api/source/route.ts
import { NextResponse } from 'next/server';
import { URLS } from '@/constants/urls';
import { fallbackContent } from '@/data/fallback-content';
import * as cheerio from 'cheerio';

export async function GET() {
  try {
    // Use let instead of const since we might reassign it
    let response = await fetch(URLS.CFTDTI_MAIN);
    
    if (!response.ok) {
      // Try backup URL
      const backupResponse = await fetch(URLS.CFTDTI_BACKUP);
      
      if (!backupResponse.ok) {
        // Use fallback content
        return NextResponse.json({
          content: fallbackContent.text,
          characterCount: fallbackContent.text.length,
          wordCount: fallbackContent.text.split(/\s+/).length,
          source: 'fallback'
        });
      }
      
      response = backupResponse;
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Clean up the HTML
    $('script').remove();
    $('style').remove();
    $('nav').remove();
    $('header').remove();
    $('footer').remove();
    
    const textContent = $('main').text()
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();

    return NextResponse.json({
      content: textContent,
      characterCount: textContent.length,
      wordCount: textContent.split(/\s+/).length,
      source: 'live'
    });
  } catch (error) {
    console.error('Error fetching source:', error);
    
    // Return fallback content with error indication
    return NextResponse.json({
      content: fallbackContent.text,
      characterCount: fallbackContent.text.length,
      wordCount: fallbackContent.text.split(/\s+/).length,
      source: 'fallback',
      error: 'Failed to fetch source content'
    });
  }
}

