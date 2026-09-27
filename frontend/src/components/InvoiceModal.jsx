import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Download,
  Loader2,
  PhoneCall, 
  ShieldCheck, 
  Calendar, 
  User, 
  CreditCard, 
  Hash
} from 'lucide-react';
import { salesService } from '../services/api';

export default function InvoiceModal({ invoice, invoiceData, onClose }) {
  const data = invoice || invoiceData;
  if (!data || !data.order) return null;

  const { order, companyName, companyAddress, companyPhone, companyEmail } = data;
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const originalTitle = document.title;
    if (order?.orderNumber) {
      document.title = `Invoice-${order.orderNumber}`;
    }
    return () => {
      document.title = originalTitle;
    };
  }, [order?.orderNumber]);

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      const res = await salesService.getInvoicePdf(order.id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${order.orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(url), 2000);
    } catch (err) {
      console.error('Failed to download invoice PDF', err);
      alert('Failed to download invoice PDF: ' + (err.response?.data?.message || err.message));
    } finally {
      setDownloading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4 sm:p-6">
      <div 
        className="fixed -inset-10 bg-slate-950/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-slate-900/85 backdrop-blur-xl border border-slate-700/70 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl my-8 z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <h3 className="font-semibold text-white">Sales Voucher & Official Invoice</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
              title="Download official PDF invoice"
            >
              {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="invoice-printable-area p-8 bg-transparent text-slate-100 print:bg-white print:text-black print:p-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start pb-6 border-b border-slate-800 print:border-slate-300 gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-teal-500 text-slate-950">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-white">{companyName || 'Orbitalk'}</h1>
              </div>
              <p className="text-xs text-slate-400 mt-2">{companyAddress || 'Impetus Center, 242/B Tejgaon-Gulshan Link Road, Tejgaon I/A, Dhaka-1208, Bangladesh'}</p>
              <p className="text-xs text-slate-400">Tel: {companyPhone || '+880-2-9880000'} | Email: {companyEmail || 'billing@orbitalk.bd'}</p>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-block px-2.5 py-1 rounded bg-teal-500/10 text-teal-400 print:bg-slate-100 print:text-slate-800 text-xs font-bold uppercase tracking-wider mb-2 border border-teal-500/20">
                OFFICIAL INVOICE & SERIAL VOUCHER
              </span>
              <h2 className="text-lg font-mono font-bold text-white print:text-black">{order.orderNumber}</h2>
              <p className="text-xs text-slate-400 print:text-slate-600 mt-1">
                Date: {new Date(order.createdAt).toLocaleString()}
              </p>
              <p className="text-xs text-slate-400 print:text-slate-600">
                Payment: <strong className="text-teal-400 print:text-black">{order.paymentMethod}</strong>
              </p>
            </div>
          </div>

          {/* Info Blocks */}
          <div className="grid grid-cols-2 gap-6 my-6 p-4 rounded-xl bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-300 text-xs">
            <div>
              <p className="text-slate-400 print:text-slate-600 font-semibold uppercase tracking-wider text-[10px]">Distributor Partner</p>
              <h4 className="text-sm font-bold text-white print:text-black mt-1">{order.distributorName}</h4>
              <p className="text-slate-400 print:text-slate-600 mt-0.5">Email: {order.distributorEmail || 'N/A'}</p>
              <p className="text-slate-400 print:text-slate-600">Phone: {order.distributorPhone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-400 print:text-slate-600 font-semibold uppercase tracking-wider text-[10px]">Order & Dispatch Status</p>
              <p className="text-slate-300 print:text-black mt-1 font-medium">Status: <span className="text-emerald-400 print:text-emerald-700 font-bold">{order.orderStatus}</span></p>
              <p className="text-slate-300 print:text-black">Payment: <span className="text-emerald-400 print:text-emerald-700 font-bold">{order.paymentStatus}</span></p>
              <p className="text-slate-400 print:text-slate-600">Currency: <strong className="text-teal-400 print:text-black">BDT (৳)</strong></p>
            </div>
          </div>

          {/* Serialized Items Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 print:border-slate-300">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 print:bg-slate-100 text-slate-400 print:text-slate-700 font-semibold border-b border-slate-800 print:border-slate-300">
                <tr>
                  <th className="p-3 text-center w-12">SL</th>
                  <th className="p-3">Card Denomination</th>
                  <th className="p-3">Serialized Range (From ~ To)</th>
                  <th className="p-3 text-right">Face Value</th>
                  <th className="p-3 text-right">Quantity</th>
                  <th className="p-3 text-right">Discount</th>
                  <th className="p-3 text-right">Total Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                {order.items?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 print:hover:bg-transparent">
                    <td className="p-3 text-center font-mono text-slate-400 print:text-slate-600 text-xs font-semibold">{idx + 1}</td>
                    <td className="p-3 font-medium text-white print:text-black">
                      {item.denominationName}
                      {item.batchNumber && (
                        <span className="block text-[10px] text-slate-400 print:text-slate-500 font-mono mt-0.5">Batch: {item.batchNumber}</span>
                      )}
                    </td>
                    <td className="p-3 font-mono">
                      <span className="inline-block px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 print:text-slate-900 print:bg-slate-100 print:border print:border-slate-300 font-semibold text-[11px]">
                        {item.serialRange || (item.startSerialNumber ? `${item.startSerialNumber} ~ ${item.endSerialNumber}` : 'N/A')}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-slate-300 print:text-slate-800">৳{Number(item.unitFaceValue).toFixed(2)}</td>
                    <td className="p-3 text-right font-bold text-teal-400 print:text-black">{item.quantity} cards</td>
                    <td className="p-3 text-right text-slate-400 print:text-slate-600">{Number(item.itemDiscountPercent).toFixed(1)}%</td>
                    <td className="p-3 text-right font-mono font-bold text-white print:text-black">৳{Number(item.subtotalFinal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mt-6">
            <div className="w-80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400 print:text-slate-600">
                <span>Total Cards Distributed:</span>
                <span className="font-bold text-white print:text-black">{order.totalCardsCount} units</span>
              </div>
              <div className="flex justify-between text-slate-400 print:text-slate-600">
                <span>Retail Value:</span>
                <span className="font-mono text-white print:text-black">৳{Number(order.totalFaceValue).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-400 print:text-emerald-700">
                <span>Volume Discount ({order.discountPercentage}%):</span>
                <span className="font-mono">-৳{Number(order.discountAmount).toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-700 print:border-slate-300 pt-2 flex justify-between text-sm font-bold text-white print:text-black">
                <span>Final Amount Paid:</span>
                <span className="text-teal-400 print:text-black font-mono text-base font-bold">৳{Number(order.finalAmount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Verification & Legal Footer */}
          <div className="mt-8 pt-4 border-t border-slate-800/80 print:border-slate-300 text-[11px] text-slate-500 print:text-slate-600 text-center space-y-1">
            <p className="font-semibold text-slate-400 print:text-slate-800">
              Serialized Product Notice: All cards in the specified serial ranges have been activated and allocated to {order.distributorName}.
            </p>
            <p>Cryptographically hashed PINs are valid for subscriber talk-time recharge on the IPTSP platform. Currency: Bangladeshi Taka (৳ / BDT).</p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
