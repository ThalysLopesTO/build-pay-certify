// Per-document branding for invoices and quotes.
//
// A company can set a different business name (and a payment details block)
// for its invoices and quotes in company_settings.document_company_name /
// document_payment_details. The database copies those onto each NEW invoice
// or quote when it is created (issuer_name / issuer_payment_details), so
// documents created before the change keep the regular company name.
// Everything else (address, phone, email, logo, HST) stays the company's own.

export interface DocumentBrandingFields {
  issuer_name?: string | null;
  issuer_payment_details?: string | null;
}

const clean = (value?: string | null) => {
  const v = value?.trim();
  return v ? v : null;
};

/** The business name to print on this invoice/quote. */
export const documentCompanyName = (
  doc: DocumentBrandingFields | null | undefined,
  fallback: string | null | undefined,
): string => clean(doc?.issuer_name) ?? fallback ?? '';

/** Extra payment / business details to print on this invoice/quote, if any. */
export const documentPaymentDetails = (doc: DocumentBrandingFields | null | undefined): string | null =>
  clean(doc?.issuer_payment_details);

/**
 * Company settings as they should appear on this document: same settings,
 * with the business name swapped when the document was issued under another
 * name. Returns the settings unchanged for regular documents.
 */
export const withDocumentBranding = <S extends { company_name?: string | null }>(
  settings: S,
  doc: DocumentBrandingFields | null | undefined,
): S => {
  const name = clean(doc?.issuer_name);
  if (!settings || !name) return settings;
  return { ...settings, company_name: name };
};

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The payment details as safe HTML (line breaks kept), or '' when there are none. */
export const paymentDetailsHtml = (doc: DocumentBrandingFields | null | undefined): string => {
  const details = documentPaymentDetails(doc);
  return details ? escapeHtml(details).replace(/\r?\n/g, '<br>') : '';
};
