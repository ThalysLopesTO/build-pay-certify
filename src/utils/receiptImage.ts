// Prepares a bill/receipt photo from a phone before it is uploaded.
//
// Phone photos are often HEIC (iPhone), have no MIME type at all, or are
// 10–30 MB. Those used to be rejected or made uploads slow enough to look
// broken. Here every decodable image is shrunk to a sensible size and saved
// as JPEG, which every browser and the receipt reader can open.

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'heic', 'heif', 'webp', 'gif'];
const MAX_DIMENSION = 2000;
const JPEG_QUALITY = 0.85;
// Small JPEG/PNG files are uploaded untouched.
const KEEP_AS_IS_BYTES = 1.5 * 1024 * 1024;

const extensionOf = (name: string) => {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot + 1).toLowerCase();
};

export const isPdfFile = (file: File) =>
  file.type === 'application/pdf' || extensionOf(file.name) === 'pdf';

export const isImageFile = (file: File) =>
  file.type.startsWith('image/') || IMAGE_EXTENSIONS.includes(extensionOf(file.name));

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read this image'));
    };
    img.src = url;
  });

// Returns a JPEG version of the photo, or the original file when it is a PDF,
// already small, or a format this browser cannot decode (it is still stored).
export const prepareReceiptImage = async (file: File): Promise<File> => {
  if (!isImageFile(file)) return file;

  const isPlainFormat = file.type === 'image/jpeg' || file.type === 'image/png';
  if (isPlainFormat && file.size <= KEEP_AS_IS_BYTES) return file;

  let canvas: HTMLCanvasElement | null = null;
  try {
    // Browsers apply the photo's rotation (EXIF) when drawing an <img>.
    const img = await loadImage(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight));
    canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));

    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas!.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
    );
    if (!blob) return file;

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'receipt';
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
  } catch (error) {
    console.warn('Could not shrink receipt photo, uploading the original:', error);
    return file;
  } finally {
    // Release the canvas memory right away; phones are tight on memory
    // right after the camera closes.
    if (canvas) {
      canvas.width = 1;
      canvas.height = 1;
    }
  }
};

// Storage path for an attachment, with an extension that matches its content.
export const attachmentPathFor = (companyId: string | undefined, file: File) => {
  const ext = extensionOf(file.name) || (file.type === 'application/pdf' ? 'pdf' : 'jpg');
  return `${companyId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
};
