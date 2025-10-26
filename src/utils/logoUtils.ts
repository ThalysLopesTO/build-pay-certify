/**
 * Utility to fetch and convert logo images to base64 for PDF generation.
 * This solves CORS issues with html2canvas when rendering external images.
 */
export const fetchLogoAsBase64 = async (logoUrl: string): Promise<string> => {
  try {
    const response = await fetch(logoUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error fetching logo:', error);
    return ''; // Return empty string if fetch fails
  }
};
