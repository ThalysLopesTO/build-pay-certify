import React from "react";
import { useParams, Navigate } from "react-router-dom";
import { useInvoiceById } from "../hooks/useInvoiceById";
import { useCompanySettings } from "../hooks/useCompanySettings";
import { useAuth } from "../contexts/SupabaseAuthContext";
import { formatCurrency, formatDate } from "../utils/formatters";
const InvoicePreview = () => {
  const {
    invoiceId
  } = useParams();
  const {
    user
  } = useAuth();
  const {
    invoice,
    loading: invoiceLoading
  } = useInvoiceById(invoiceId);
  const {
    settings: company,
    isLoading: companyLoading
  } = useCompanySettings();

  // Restrict access to admin only
  if (!user || !['admin', 'super_admin'].includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  if (invoiceLoading || companyLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice...</p>
        </div>
      </div>;
  }
  if (!invoice || !company) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-red-600">
          <h2 className="text-xl font-semibold mb-2">Invoice Not Found</h2>
          <p>The requested invoice could not be loaded.</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gray-50 py-8 print:bg-white print:py-0">
      <div className="max-w-4xl mx-auto bg-white shadow-xl print:shadow-none print:max-w-none">
        {/* Print Button */}
        <div className="p-4 bg-gray-100 border-b print:hidden">
          <div className="flex justify-between items-center">
            <h1 className="text-lg font-semibold text-gray-800">Invoice Preview</h1>
            <button onClick={() => window.print()} className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition duration-200 shadow-sm">
              Print Invoice
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="p-8 print:p-6">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start mb-8">
            {/* Company Info */}
            <div className="flex items-start space-x-4 mb-6 lg:mb-0">
              {company.company_logo_url ? (
                <img 
                  src={company.company_logo_url} 
                  alt="Company Logo" 
                  className="h-20 w-20 object-contain" 
                />
              ) : (
                <div className="h-20 w-20 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400 text-xs">Logo</span>
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  {company.company_name || 'Company Name'}
                </h1>
                <div className="text-sm text-gray-600 space-y-1">
                  {company.company_address && <p>{company.company_address}</p>}
                  {company.company_phone && <p>Phone: {company.company_phone}</p>}
                  {company.company_email && <p>Email: {company.company_email}</p>}
                  {company.hst_number && <p>HST: {company.hst_number}</p>}
                </div>
              </div>
            </div>

            {/* Invoice Info */}
            <div className="text-right">
              <h2 className="text-4xl font-bold text-gray-800 mb-4">INVOICE</h2>
              <div className="text-sm space-y-2">
                <div className="flex justify-between min-w-[200px]">
                  <span className="font-medium text-gray-600">Invoice #:</span>
                  <span className="font-semibold text-gray-800">{invoice.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Date:</span>
                  <span className="text-gray-800">{formatDate(new Date().toISOString())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Due Date:</span>
                  <span className="text-gray-800">{formatDate(invoice.due_date)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bill To Section */}
          <div className="mb-8">
            <div className="w-full max-w-sm">
              <h3 className="text-base font-semibold text-gray-800 mb-3">
                Bill To:
              </h3>
              <div className="bg-gray-50 p-4 text-sm text-gray-700 space-y-1">
                <p className="font-semibold text-gray-800">
                  {invoice.client_company || 'Client Name'}
                </p>
                {invoice.client_address && (
                  <p>{invoice.client_address}</p>
                )}
                {invoice.client_phone && (
                  <p>Phone: {invoice.client_phone}</p>
                )}
                <p>{invoice.client_email}</p>
              </div>
            </div>
          </div>

          {/* Invoice Items Table */}
          <div className="mb-8">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-800">Quantity</th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-800">Description</th>
                    <th className="border border-gray-200 px-4 py-3 text-right text-sm font-semibold text-gray-800">Unit Price</th>
                    <th className="border border-gray-200 px-4 py-3 text-right text-sm font-semibold text-gray-800">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, idx) => <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="border border-gray-200 px-4 py-3 text-sm text-center">
                        {item.quantity}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm">
                        {item.description}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm text-right">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm text-right font-semibold">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>)}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="flex justify-end mb-8">
            <div className="w-full max-w-md">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-600">Subtotal:</span>
                    <span className="text-gray-800">{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-600">Tax (13%):</span>
                    <span className="text-gray-800">{formatCurrency(invoice.taxAmount)}</span>
                  </div>
                  <div className="border-t border-gray-300 pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-bold text-gray-800">Total Amount Due:</span>
                      <span className="text-lg font-bold text-gray-800">
                        {formatCurrency(invoice.total_amount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          {invoice.notes && <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
                Notes:
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <p className="text-sm text-gray-700">{invoice.notes}</p>
              </div>
            </div>}

          {/* Footer */}
          <div className="border-t border-gray-200 pt-6 text-center">
            <p className="text-lg font-semibold text-gray-800 mb-2">Thank you for your business!</p>
            <p className="text-sm text-gray-600 mb-1">
              For questions about this invoice, please contact us at:
            </p>
            <p className="text-sm text-gray-600">
              {company.company_email || 'info@company.com'} | {company.company_phone || '(555) 123-4567'}
            </p>
          </div>
        </div>
      </div>
    </div>;
};
export default InvoicePreview;