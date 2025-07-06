import React from "react";
import { useParams } from "react-router-dom";
import { useInvoiceById, useCompanySettings } from "@/lib/hooks";
import { formatCurrency, formatDate } from "@/lib/utils";

const InvoicePreview = () => {
  const { invoiceId } = useParams();
  const { invoice, loading: invoiceLoading } = useInvoiceById(invoiceId);
  const { company, loading: companyLoading } = useCompanySettings();

  if (invoiceLoading || companyLoading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen py-20 print:bg-white">
      <div className="container mx-auto px-4">
        <div className="relative bg-white rounded-3xl p-12">
          {/* Print Button */}
          <div className="absolute top-5 right-5 print:hidden">
            <button
              onClick={() => window.print()}
              className="bg-white py-2 px-7 rounded-md flex items-center shadow"
            >
              🖨️ Print
            </button>
          </div>

          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Invoice</h2>
            <img
              src={company?.logoUrl || "/logo-dark.png"}
              alt="Company Logo"
              className="h-10"
            />
          </div>

          <hr className="my-2" />

          <div className="flex justify-between text-sm py-4">
            <span>
              <strong>Date:</strong> {formatDate(invoice?.date)}
            </span>
            <span>
              <strong>Invoice No:</strong> {invoice?.number}
            </span>
          </div>

          <hr className="my-2" />

          <div className="flex justify-between mt-4 text-sm">
            <div>
              <h4 className="font-bold">Invoice To:</h4>
              <p>{invoice?.clientName}</p>
              <p>{invoice?.clientAddress}</p>
              <p>{invoice?.clientEmail}</p>
            </div>
            <div className="text-right">
              <h4 className="font-bold">Pay To:</h4>
              <p>{company?.name}</p>
              <p>{company?.address}</p>
              <p>{company?.email}</p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto mt-10">
            <table className="w-full text-sm border-collapse whitespace-pre">
              <thead>
                <tr className="bg-red-600 text-white text-center">
                  <th className="p-4 border-white">Date</th>
                  <th className="p-4 border-s-2 border-white">Description</th>
                  <th className="p-4 border-s-2 border-white">Price</th>
                  <th className="p-4 border-s-2 border-white">Qty</th>
                  <th className="p-4 border-s-2 border-white">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice?.items?.map((item: any, index: number) => (
                  <tr key={index} className={index % 2 ? "bg-gray-100 text-center" : "text-center"}>
                    <td className="p-5">{formatDate(item.date)}</td>
                    <td className="p-5 border-s-2 border-white">{item.description}</td>
                    <td className="p-5 border-s-2 border-white">{formatCurrency(item.unitPrice)}</td>
                    <td className="p-5 border-s-2 border-white">{item.quantity}</td>
                    <td className="p-5 border-s-2 border-white">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={5} className="text-end p-4 border-t text-base">
                    <strong className="pr-12">Sub Total:</strong>
                    {formatCurrency(invoice?.subtotal)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={5} className="text-end p-4 border-t text-base">
                    <strong className="pr-12">Tax:</strong>
                    {formatCurrency(invoice?.tax)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={5} className="text-end p-4 border-t text-base">
                    <strong className="pr-12">Total:</strong>
                    {formatCurrency(invoice?.total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Info + Footer */}
          <div className="flex justify-between mt-20 text-sm">
            <div>
              <h4 className="font-bold">Payment Info:</h4>
              <p>Account No: {company?.bankAccountNumber}</p>
              <p>Bank: {company?.bankName}</p>
              <p>Account Holder: {company?.bankAccountName}</p>
            </div>
            <div className="text-right">
              <p className="uppercase font-medium tracking-widest">
                {company?.website}
              </p>
              <p className="uppercase font-medium tracking-widest">
                {company?.email}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;
