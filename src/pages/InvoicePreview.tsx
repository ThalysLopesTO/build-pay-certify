import React from "react";
import { useParams } from "react-router-dom";
import { useInvoiceById } from "../hooks/useInvoiceById";
import { useCompanySettings } from "../hooks/useCompanySettings";
import { formatCurrency, formatDate } from "../utils/formatters";

const InvoicePreview = () => {
  const { invoiceId } = useParams();
  const { invoice, loading: invoiceLoading } = useInvoiceById(invoiceId);
  const { company, loading: companyLoading } = useCompanySettings();

  if (invoiceLoading || companyLoading) {
    return <div className="p-6 text-center text-gray-600">Loading...</div>;
  }

  if (!invoice || !company) {
    return <div className="p-6 text-center text-red-500">Invoice or Company Info not found</div>;
  }

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto shadow-md print:p-0 print:shadow-none">
      <header className="flex justify-between items-center border-b pb-4 mb-6">
        <div>
          <img src={company.logoUrl} alt="Company Logo" className="h-12 mb-2" />
          <h1 className="text-xl font-bold">{company.name}</h1>
          <p className="text-sm text-gray-600">{company.address}</p>
          <p className="text-sm text-gray-600">{company.email}</p>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-semibold">INVOICE</h2>
          <p className="text-sm text-gray-600">#{invoice.id}</p>
          <p className="text-sm text-gray-600">Due: {formatDate(invoice.dueDate)}</p>
        </div>
      </header>

      <section className="mb-6">
        <h3 className="text-lg font-semibold">Bill To:</h3>
        <p className="text-sm text-gray-700">{invoice.clientCompany}</p>
        <p className="text-sm text-gray-600">{invoice.clientEmail}</p>
      </section>

      <table className="w-full text-left border-t border-b text-sm mb-6">
        <thead>
          <tr className="bg-gray-50">
            <th className="py-2 px-4">Description</th>
            <th className="py-2 px-4">Quantity</th>
            <th className="py-2 px-4">Unit Price</th>
            <th className="py-2 px-4 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, idx) => (
            <tr key={idx} className="border-t">
              <td className="py-2 px-4">{item.description}</td>
              <td className="py-2 px-4">{item.quantity}</td>
              <td className="py-2 px-4">{formatCurrency(item.unitPrice)}</td>
              <td className="py-2 px-4 text-right">{formatCurrency(item.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end text-sm">
        <div className="w-1/3">
          <div className="flex justify-between py-1">
            <span>Subtotal:</span>
            <span>{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Tax ({invoice.taxRate}%):</span>
            <span>{formatCurrency(invoice.taxAmount)}</span>
          </div>
          <div className="flex justify-between py-2 font-bold border-t mt-2">
            <span>Total:</span>
            <span>{formatCurrency(invoice.total)}</span>
          </div>
        </div>
      </div>

      <footer className="mt-12 text-xs text-center text-gray-400 print:hidden">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Print Invoice
        </button>
      </footer>
    </div>
  );
};

export default InvoicePreview;
