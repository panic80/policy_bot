export function preprocessContent(content: string, maxLength: number = 15000) {
  // Remove extra whitespace
  let processed = content.replace(/\s+/g, ' ').trim();
  
  // Remove common HTML artifacts if any remain
  processed = processed.replace(/&nbsp;/g, ' ')
                      .replace(/&amp;/g, '&')
                      .replace(/&lt;/g, '<')
                      .replace(/&gt;/g, '>');

  // If content is too long, take beginning and end portions
  if (processed.length > maxLength) {
    const halfLength = Math.floor(maxLength / 2);
    processed = processed.slice(0, halfLength) + 
                " ... [content truncated for length] ... " + 
                processed.slice(-halfLength);
  }

  return processed;
}

