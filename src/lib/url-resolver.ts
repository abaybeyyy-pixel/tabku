export async function resolveGoogleMapsReviewUrl(inputUrl: string): Promise<string> {
  try {
    // Basic validation
    if (!inputUrl.includes('google.com') && !inputUrl.includes('goo.gl')) {
      return inputUrl; // Not a Google Maps link, return as is
    }

    // Fetch the URL, it will automatically follow redirects
    const response = await fetch(inputUrl, { 
      redirect: 'follow', 
      headers: { 'User-Agent': 'Mozilla/5.0' } 
    });
    
    const finalUrl = response.url;

    // If it's already a review link or search.google.com, return it
    if (finalUrl.includes('/review') || finalUrl.includes('search.google.com/local/writereview')) {
      return finalUrl;
    }

    // If it's a google maps place link
    if (finalUrl.includes('google.com/maps/place/')) {
      const urlObj = new URL(finalUrl);
      if (!urlObj.pathname.endsWith('/review')) {
        urlObj.pathname = urlObj.pathname.endsWith('/') 
          ? `${urlObj.pathname}review` 
          : `${urlObj.pathname}/review`;
      }
      return urlObj.toString();
    }

    return finalUrl; // Fallback to whatever the final URL is
  } catch (error) {
    console.error('Error resolving Google Maps URL:', error);
    return inputUrl; // Return original if resolution fails
  }
}
