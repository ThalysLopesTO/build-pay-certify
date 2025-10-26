/**
 * Utility to fetch and convert logo images to base64 for PDF generation.
 * This solves CORS issues with html2canvas when rendering external images.
 */
export const fetchLogoAsBase64 = async (logoUrl: string): Promise<string> => {
  try {
    console.log('🖼️ Fetching logo:', logoUrl);
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(logoUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`Logo fetch failed with status ${response.status}`);
      return '';
    }
    
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log('✅ Logo converted to base64 successfully');
        resolve(reader.result as string);
      };
      reader.onerror = (error) => {
        console.error('Error reading logo blob:', error);
        reject(error);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('⏱️ Logo fetch timeout - continuing without logo');
    } else {
      console.error('❌ Error fetching logo:', error);
    }
    return ''; // Return empty string if fetch fails
  }
};
