// Script to extract image URLs from Google Image Search
// Run this in the browser console after navigating to a Google Image Search page

function extractImageUrls() {
  const results = [];
  
  // Method 1: Get from g-img elements
  document.querySelectorAll('g-img').forEach(el => {
    const img = el.querySelector('img');
    const link = el.querySelector('a') || el.closest('a');
    if (img && img.src) {
      results.push({
        thumbnail: img.src,
        alt: img.alt || '',
        page: link ? link.href : ''
      });
    }
  });
  
  // Method 2: Try to find full URLs in the page's data
  const scripts = document.querySelectorAll('script');
  for (const script of scripts) {
    const text = script.textContent;
    if (text.includes('"ou":"') || text.includes('"ou":')) {
      // This might contain full URLs
      const matches = [...text.matchAll(/"ou":"([^"]+)"/g)];
      matches.forEach(m => {
        if (m[1] && !m[1].includes('gstatic')) {
          results.push({ full: m[1], alt: '' });
        }
      });
    }
  }
  
  return results;
}

extractImageUrls().slice(0, 10)
