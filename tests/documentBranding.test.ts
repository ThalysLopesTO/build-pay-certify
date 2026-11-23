import { describe, expect, test } from 'bun:test';
import {
  documentCompanyName,
  documentPaymentDetails,
  paymentDetailsHtml,
  withDocumentBranding,
} from '../src/utils/documentBranding';

const settings = {
  company_name: 'Seven Star Carpentry',
  company_address: '1 Main St',
  company_phone: '555-0100',
  company_email: 'info@example.com',
};

const p127 = {
  issuer_name: 'P127 Construction Group Corp',
  issuer_payment_details: 'BANKING & E-TRANSFER\nATB Financial - e-Transfer payment@example.com\nWCB Account Number - 11118499',
};

describe('invoice / quote branding', () => {
  test('older documents (no issuer name) keep the company name', () => {
    expect(withDocumentBranding(settings, {})).toBe(settings);
    expect(withDocumentBranding(settings, { issuer_name: null })).toBe(settings);
    expect(withDocumentBranding(settings, { issuer_name: '   ' })).toBe(settings);
    expect(documentCompanyName({}, settings.company_name)).toBe('Seven Star Carpentry');
    expect(paymentDetailsHtml({})).toBe('');
  });

  test('new documents swap only the business name', () => {
    const branded = withDocumentBranding(settings, p127);
    expect(branded.company_name).toBe('P127 Construction Group Corp');
    expect(branded.company_address).toBe('1 Main St');
    expect(branded.company_phone).toBe('555-0100');
    expect(branded.company_email).toBe('info@example.com');
    expect(settings.company_name).toBe('Seven Star Carpentry'); // original untouched
  });

  test('payment details keep their lines and are made safe for HTML', () => {
    expect(documentPaymentDetails(p127)).toContain('WCB Account Number - 11118499');
    const html = paymentDetailsHtml(p127);
    expect(html).toContain('BANKING &amp; E-TRANSFER<br>ATB Financial');
    expect(paymentDetailsHtml({ issuer_payment_details: '<script>x</script>' })).toBe('&lt;script&gt;x&lt;/script&gt;');
  });
});
