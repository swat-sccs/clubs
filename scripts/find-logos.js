// Script to search Google Images and extract full-size image URLs
// Run in browser console on a Google Image Search page

function extractImageUrls() {
  const results = [];
  
  // Method 1: Get full URLs from the page's embedded data
  const scripts = document.querySelectorAll('script');
  for (const script of scripts) {
    const text = script.textContent;
    if (text.includes('AF_initDataCallback')) {
      // Extract JSON data from the callback
      const matches = text.match(/AF_initDataCallback\(\{[^}]*data:\s*(\[.*?\])[^}]*\}\);/g);
      if (matches) {
        for (const match of matches) {
          try {
            const dataMatch = match.match(/data:\s*(\[.*?\])/);
            if (dataMatch) {
              const data = JSON.parse(dataMatch[1]);
              // Extract image URLs
              const urls = [];
              function extractUrls(obj) {
                if (typeof obj === 'object' && obj !== null) {
                  for (const key in obj) {
                    if (key === 'ou' || key === 'mu' || key === 'ou') {
                      if (typeof obj[key] === 'string' && obj[key].startsWith('http')) {
                        urls.push(obj[key]);
                      }
                    } else if (typeof obj[key] === 'object') {
                      extractUrls(obj[key]);
                    }
                  }
                }
              }
              extractUrls(data);
              results.push(...urls);
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
  }
  
  // Method 2: Get from g-img elements (thumbnails)
  document.querySelectorAll('g-img img').forEach(img => {
    if (img.src && img.src.includes('gstatic')) {
      results.push({
        thumbnail: img.src,
        alt: img.alt || '',
        width: img.width,
        height: img.height
      });
    }
  });
  
  return {
    fullUrls: [...new Set(results.filter(r => typeof r === 'string'))],
    thumbnails: results.filter(r => typeof r === 'object').slice(0, 10)
  };
}

extractImageUrls();
