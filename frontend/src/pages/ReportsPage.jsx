import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  DollarSign, 
  Percent, 
  ShoppingCart, 
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import { reportService } from '../services/api';
import { usePageLoading } from '../context/PageLoadingContext';

export default function ReportsPage() {
  const { setPageLoading } = usePageLoading();
  const [report, setReport] = useState(null);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await reportService.getFinancialReport({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      if (res.data?.success) {
        setReport(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load financial report', err);
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleExportCsv = () => {
    if (!report || !report.orders) return;
    const headers = ['Order Number', 'Distributor', 'Total Cards', 'Gross Value', 'Discount Amt', 'Net Revenue', 'Payment Method', 'Date'];
    const rows = report.orders.map((o) => [
      o.orderNumber,
      `"${o.distributorName}"`,
      o.totalCardsCount,
      o.totalFaceValue,
      o.discountAmount,
      o.finalAmount,
      o.paymentMethod,
      o.createdAt,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `IPTSP_Revenue_Report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="space-y-6">
      <Header
        title="Revenue Reports & Analytics"
        subtitle="Comprehensive financial breakdown of card wholesale sales, volume discounts, and distributor revenue"
        onRefresh={fetchReport}
      />

      {/* Date Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Calendar className="w-4 h-4 text-teal-400" />
            <span>Date Filter:</span>
          </div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
          />
          <span className="text-slate-500 text-xs">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
          />
          <button
            onClick={fetchReport}
            className="px-4 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-sm transition"
          >
            Apply Range
          </button>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          Export Report (CSV)
        </button>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Retail Value"
          value={`৳${report ? Number(report.grossSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}`}
          subtext="Total face value distributed"
          icon={DollarSign}
          color="blue"
        />
        <StatCard
          title="Volume Discounts"
          value={`৳${report ? Number(report.totalDiscounts || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}`}
          subtext="Wholesale discounts given"
          icon={Percent}
          color="amber"
        />
        <StatCard
          title="Net Collected Revenue"
          value={`৳${report ? Number(report.netRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}`}
          subtext="Actual revenue recognized"
          icon={TrendingUp}
          color="teal"
        />
        <StatCard
          title="Cards Distributed"
          value={report ? Number(report.totalCardsDistributed || 0).toLocaleString() : '0'}
          subtext={`Across ${report?.totalOrders || 0} purchase orders`}
          icon={ShoppingCart}
          color="emerald"
        />
      </div>

      {/* Breakdown by Distributor */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
        <h3 className="text-base font-bold text-white mb-1">Partner Revenue Contribution</h3>
        <p className="text-xs text-slate-400 mb-4">Breakdown of purchases and active wallet balances per distributor</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Distributor Partner</th>
                <th className="p-3 text-center">Orders Placed</th>
                <th className="p-3 text-center">Cards Bought</th>
                <th className="p-3 text-right">Total Net Spend</th>
                <th className="p-3 text-right">Current Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {report?.distributorBreakdown?.map((d, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="p-3 font-semibold text-white">{d.distributorName}</td>
                  <td className="p-3 text-center text-slate-300">{d.ordersCount}</td>
                  <td className="p-3 text-center font-bold text-teal-400">{d.cardsBought}</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-400">৳{Number(d.totalSpend).toFixed(2)}</td>
                  <td className="p-3 text-right font-mono text-slate-300">৳{Number(d.currentBalance).toFixed(2)}</td>
                </tr>
              ))}
              {(!report?.distributorBreakdown || report.distributorBreakdown.length === 0) && (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-slate-500">No partner activity recorded in this period.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}