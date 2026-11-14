import { describe, expect, test } from 'bun:test';
import { attachmentPathFor, isImageFile, isPdfFile, prepareReceiptImage } from '../src/utils/receiptImage';

const file = (name: string, type: string, size = 10) =>
  new File([new Uint8Array(size)], name, { type });

describe('Bill photo detection', () => {
  test('accepts iPhone HEIC photos, even without a MIME type', () => {
    expect(isImageFile(file('IMG_0001.HEIC', ''))).toBe(true);
    expect(isImageFile(file('photo.heif', 'image/heif'))).toBe(true);
  });

  test('accepts normal photos and recognises PDFs', () => {
    expect(isImageFile(file('bill.jpg', 'image/jpeg'))).toBe(true);
    expect(isPdfFile(file('bill.pdf', 'application/pdf'))).toBe(true);
    expect(isImageFile(file('bill.pdf', 'application/pdf'))).toBe(false);
  });

  test('rejects other files', () => {
    expect(isImageFile(file('notes.txt', 'text/plain'))).toBe(false);
    expect(isPdfFile(file('notes.txt', 'text/plain'))).toBe(false);
  });
});

describe('Bill photo preparation', () => {
  test('leaves small JPEGs and PDFs untouched', async () => {
    const jpeg = file('bill.jpg', 'image/jpeg');
    const pdf = file('bill.pdf', 'application/pdf');
    expect(await prepareReceiptImage(jpeg)).toBe(jpeg);
    expect(await prepareReceiptImage(pdf)).toBe(pdf);
  });
});

describe('Attachment storage path', () => {
  test('keeps the company folder and the file extension', () => {
    expect(attachmentPathFor('company-1', file('bill.jpg', 'image/jpeg'))).toMatch(/^company-1\/\d+-\w+\.jpg$/);
  });

  test('falls back to a sensible extension when the name has none', () => {
    expect(attachmentPathFor('c', file('image', 'image/jpeg'))).toMatch(/\.jpg$/);
    expect(attachmentPathFor('c', file('scan', 'application/pdf'))).toMatch(/\.pdf$/);
  });
});
