import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  Layers,
  ShoppingCart, 
  Users, 
  TrendingUp, 
  ArrowUpRight, 
  Eye, 
  PhoneCall
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import StatCard from '../components/StatCard';
import InvoiceModal from '../components/InvoiceModal';
import ColumnSelector from '../components/ColumnSelector';
import { reportService, salesService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { usePageLoading } from '../context/PageLoadingContext';

const PIE_COLORS = ['#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

// Custom Tooltips for Charts
const CustomAreaTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 border border-slate-700/80 p-3 rounded-xl shadow-xl backdrop-blur-md text-xs">
        <p className="font-semibold text-slate-400 mb-1.5">{label}</p>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-400 shadow-sm shadow-teal-400/50"></span>
          <span className="text-slate-300">Revenue:</span>
          <span className="font-mono font-bold text-teal-300">৳{Number(payload[0].value).toFixed(2)}</span>
        </div>
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload, totalActiveRevenue }) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    const color = item.payload.fill || item.color || PIE_COLORS[0];
    const percentage = totalActiveRevenue > 0
      ? ((Number(item.value) / totalActiveRevenue) * 100).toFixed(1)
      : (item.payload.percentage !== undefined ? item.payload.percentage.toFixed(1) : '0');
    return (
      <div className="bg-slate-900/95 border border-slate-700/80 p-3 rounded-xl shadow-xl backdrop-blur-md text-xs min-w-[180px]">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }}></span>
          <span className="font-semibold text-white truncate">{item.name || item.payload.denominationName}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-slate-300">
          <span>Revenue:</span>
          <span className="font-mono font-bold text-teal-300">
            ৳{Number(item.value).toFixed(2)}
            <span className="text-slate-400 font-normal text-[11px] ml-1">({percentage}%)</span>
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { setPageLoading } = usePageLoading();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingInvoiceId, setLoadingInvoiceId] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [hiddenDenoms, setHiddenDenoms] = useState({});
  const { isAdmin } = useAuth();

  // Top Distributors columns
  const topDistributorsColumns = [
    { key: 'sl', label: 'SL' },
    { key: 'distributor', label: 'Distributor' },
    { key: 'orders', label: 'Orders' },
    { key: 'cards', label: 'Cards Bought' },
    { key: 'spend', label: 'Total Spend' },
  ];

  const [visibleDistColumns, setVisibleDistColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('dash_dist_columns');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { sl: true, ...parsed };
      }
    } catch (e) {
      // ignore
    }
    return { sl: true, distributor: true, orders: true, cards: true, spend: true };
  });

  const toggleDistColumn = (key) => {
    setVisibleDistColumns((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem('dash_dist_columns', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  const resetDistColumns = () => {
    const defaults = { sl: true, distributor: true, orders: true, cards: true, spend: true };
    setVisibleDistColumns(defaults);
    try { localStorage.setItem('dash_dist_columns', JSON.stringify(defaults)); } catch (e) {}
  };

  // Recent Orders columns
  const recentOrdersColumns = [
    { key: 'sl', label: 'SL' },
    { key: 'orderNumber', label: 'Order #' },
    { key: 'distributor', label: 'Distributor' },
    { key: 'cards', label: 'Cards' },
    { key: 'amount', label: 'Amount' },
    { key: 'action', label: 'Action' },
  ];

  const [visibleOrderColumns, setVisibleOrderColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('dash_order_columns');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { sl: true, ...parsed };
      }
    } catch (e) {
      // ignore
    }
    return { sl: true, orderNumber: true, distributor: true, cards: true, amount: true, action: true };
  });

  const toggleOrderColumn = (key) => {
    setVisibleOrderColumns((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem('dash_order_columns', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  const resetOrderColumns = () => {
    const defaults = { sl: true, orderNumber: true, distributor: true, cards: true, amount: true, action: true };
    setVisibleOrderColumns(defaults);
    try { localStorage.setItem('dash_order_columns', JSON.stringify(defaults)); } catch (e) {}
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await reportService.getDashboardSummary();
      if (res.data && res.data.success) {
        setSummary(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard summary', err);
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleViewInvoice = async (orderId) => {
    try {
      setLoadingInvoiceId(orderId);
      const res = await salesService.getInvoice(orderId);
      if (res.data && res.data.success) {
        setSelectedInvoice(res.data.data);
      }
    } catch (err) {
      alert('Could not load invoice details.');
    } finally {
      setLoadingInvoiceId(null);
    }
  };

  // Only denominations with actual sales contribution (revenue > 0 or cardsSold > 0), sorted by percentage / revenue desc
  const contributingDenominations = (summary?.denominationShares || [])
    .filter((item) => Number(item.revenue || 0) > 0 || Number(item.cardsSold || 0) > 0)
    .sort((a, b) => Number(b.revenue || b.percentage || 0) - Number(a.revenue || a.percentage || 0));

  // Active items currently visible in the pie chart
  const activePieData = contributingDenominations.filter(
    (item) => !hiddenDenoms[item.denominationName]
  );

  const totalContributingRevenue = contributingDenominations.reduce(
    (acc, curr) => acc + Number(curr.revenue || 0),
    0
  );

  const totalActiveRevenue = activePieData.reduce(
    (acc, curr) => acc + Number(curr.revenue || 0),
    0
  );

  const toggleDenomination = (denomName) => {
    setHiddenDenoms((prev) => ({
      ...prev,
      [denomName]: !prev[denomName]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Distributors"
          value={summary ? summary.totalDistributors || 0 : '0'}
          subtext={summary?.lowStockAlertsCount > 0 ? `${summary.lowStockAlertsCount} low stock alerts` : 'All stocks healthy'}
          icon={Users}
          color={summary?.lowStockAlertsCount > 0 ? 'amber' : 'purple'}
        />
        <StatCard
          title="Available Cards"
          value={summary ? Number(summary.totalCardsInStock || 0).toLocaleString() : '0'}
          subtext={`Across ${summary?.totalBatches || 0} batches`}
          icon={Layers}
          color="blue"
        />
        <StatCard
          title="Sold Cards"
          value={summary ? Number(summary.totalCardsSold || 0).toLocaleString() : '0'}
          subtext="Allocated to distributors"
          icon={ShoppingCart}
          color="emerald"
        />
        <StatCard
          title="Total Revenue"
          value={`৳${summary ? Number(summary.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}`}
          subtext={`Retail Value: ৳${summary ? Number(summary.totalFaceValueSold || 0).toFixed(2) : '0.00'}`}
          icon={DollarSign}
          color="teal"
          trend={
            summary?.revenueGrowthPercentage !== undefined && summary?.revenueGrowthPercentage !== null
              ? `${summary.revenueGrowthPercentage >= 0 ? '+' : ''}${summary.revenueGrowthPercentage.toFixed(1)}% vs last month`
              : null
          }
          trendPositive={summary?.revenueGrowthPercentage >= 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-white text-base">Monthly Revenue Trend (Taka)</h3>
              <p className="text-xs text-slate-400">Wholesale performance in BDT (৳) over the last 6 months</p>
            </div>
            <span className="flex items-center gap-1 text-xs text-teal-400 font-bold bg-teal-500/10 px-2 py-1 rounded-lg border border-teal-500/20">
              <TrendingUp className="w-3.5 h-3.5" />
              Active
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary?.monthlyTrends || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="period" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} tickFormatter={(v) => `৳${v}`} />
                <Tooltip content={<CustomAreaTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#14b8a6" strokeWidth={3} fillOpacity={1} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">Sales by Denomination</h3>
              <p className="text-xs text-slate-400">Volume distribution by card value</p>
            </div>
            {contributingDenominations.length > 0 && Object.values(hiddenDenoms).some(Boolean) && (
              <button
                onClick={() => setHiddenDenoms({})}
                className="text-[11px] font-semibold text-teal-400 hover:text-teal-300 transition"
                title="Reset all hidden denominations"
              >
                Reset
              </button>
            )}
          </div>

          <div className="h-56 w-full relative flex items-center justify-center my-1">
            {activePieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activePieData}
                    dataKey="revenue"
                    nameKey="denominationName"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                  >
                    {activePieData.map((entry) => {
                      const origIndex = contributingDenominations.findIndex(
                        (d) => d.denominationName === entry.denominationName
                      );
                      const color = PIE_COLORS[(origIndex >= 0 ? origIndex : 0) % PIE_COLORS.length];
                      return <Cell key={`cell-${entry.denominationName}`} fill={color} />;
                    })}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip totalActiveRevenue={totalActiveRevenue} />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-500 text-xs py-8">
                {contributingDenominations.length > 0
                  ? 'All denominations hidden. Click names below to toggle.'
                  : 'No sales recorded for any denomination yet.'}
              </div>
            )}
          </div>

          {/* Interactive Contributing Denominations Legend */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-2 pt-3 border-t border-slate-800 text-[11px]">
            {contributingDenominations.map((item, idx) => {
              const isHidden = !!hiddenDenoms[item.denominationName];
              const color = PIE_COLORS[idx % PIE_COLORS.length];
              const amount = Number(item.revenue || 0);
              const percentage = totalContributingRevenue > 0
                ? ((amount / totalContributingRevenue) * 100).toFixed(1)
                : '0';

              return (
                <div key={item.denominationName || idx} className="relative group">
                  {/* Floating Hover Card Tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-40 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 transform scale-95 group-hover:scale-100 min-w-[170px] bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-2.5 shadow-2xl text-xs select-none">
                    <div className="flex items-center gap-1.5 mb-1.5 pb-1 border-b border-slate-800">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }}></span>
                      <span className="font-bold text-white truncate">{item.denominationName}</span>
                    </div>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Revenue:</span>
                        <span className="font-mono font-bold text-teal-300">
                          ৳{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Share:</span>
                        <span className="font-mono font-bold text-emerald-400">{percentage}%</span>
                      </div>
                      {item.cardsSold !== undefined && (
                        <div className="flex items-center justify-between text-slate-400 text-[10px] pt-0.5 border-t border-slate-800/60">
                          <span>Cards Sold:</span>
                          <span className="font-medium text-slate-300">{Number(item.cardsSold).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    {/* Tooltip Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-slate-700/80"></div>
                  </div>

                  {/* Interactive Button */}
                  <button
                    onClick={() => toggleDenomination(item.denominationName)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all text-xs border cursor-pointer select-none ${
                      isHidden
                        ? 'opacity-40 bg-slate-800/20 border-slate-800 line-through text-slate-500 hover:opacity-70'
                        : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-200 hover:text-white shadow-sm active:scale-95'
                    }`}
                    title={`${item.denominationName}: ৳${amount.toFixed(2)} (${percentage}%) - Click to toggle`}
                  >
                    <span
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform ${
                        isHidden ? 'bg-slate-600 scale-75' : 'scale-100 shadow-sm'
                      }`}
                      style={{ backgroundColor: isHidden ? undefined : color }}
                    />
                    <span className="truncate max-w-[140px] font-medium">{item.denominationName}</span>
                  </button>
                </div>
              );
            })}
            {contributingDenominations.length === 0 && (
              <p className="text-slate-500 text-center w-full py-1 text-xs">No active denomination sales</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-white text-base">Top Performing Distributors</h3>
              <p className="text-xs text-slate-400">Ranked by total recharge purchases (BDT)</p>
            </div>
            <div className="flex items-center gap-2">
              <ColumnSelector
                columns={topDistributorsColumns}
                visibleColumns={visibleDistColumns}
                onToggleColumn={toggleDistColumn}
                onResetColumns={resetDistColumns}
              />
              <button
                onClick={() => navigate('/distributors')}
                className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1"
              >
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800">
                <tr>
                  {visibleDistColumns.sl && <th className="pb-2.5 text-center w-12">SL</th>}
                  {visibleDistColumns.distributor && <th className="pb-2.5">Distributor</th>}
                  {visibleDistColumns.orders && <th className="pb-2.5 text-center">Orders</th>}
                  {visibleDistColumns.cards && <th className="pb-2.5 text-center">Cards Bought</th>}
                  {visibleDistColumns.spend && <th className="pb-2.5 text-right">Total Spend</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {summary?.topDistributors?.slice(0, 5).map((dist, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    {visibleDistColumns.sl && (
                      <td className="py-3 text-center font-mono text-slate-400 text-xs font-semibold">
                        {idx + 1}
                      </td>
                    )}
                    {visibleDistColumns.distributor && (
                      <td className="py-3 font-semibold text-white">
                        <span className="truncate max-w-[160px] inline-block">{dist.distributorName}</span>
                      </td>
                    )}
                    {visibleDistColumns.orders && <td className="py-3 text-center text-slate-400">{dist.ordersCount}</td>}
                    {visibleDistColumns.cards && <td className="py-3 text-center font-bold text-teal-400">{dist.cardsBought}</td>}
                    {visibleDistColumns.spend && (
                      <td className="py-3 text-right font-mono font-bold text-emerald-400">
                        ৳{Number(dist.totalSpend).toFixed(2)}
                      </td>
                    )}
                  </tr>
                ))}
                {(!summary?.topDistributors || summary.topDistributors.length === 0) && (
                  <tr>
                    <td colSpan={Object.values(visibleDistColumns).filter(Boolean).length || 1} className="py-6 text-center text-slate-500">No distributor transactions recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-white text-base">Recent Sales Orders</h3>
              <p className="text-xs text-slate-400">Latest card batch sales to distributors</p>
            </div>
            <div className="flex items-center gap-2">
              <ColumnSelector
                columns={recentOrdersColumns}
                visibleColumns={visibleOrderColumns}
                onToggleColumn={toggleOrderColumn}
                onResetColumns={resetOrderColumns}
              />
              <button
                onClick={() => navigate('/sales')}
                className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1"
              >
                All Orders <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800">
                <tr>
                  {visibleOrderColumns.sl && <th className="pb-2.5 text-center w-12">SL</th>}
                  {visibleOrderColumns.orderNumber && <th className="pb-2.5">Order #</th>}
                  {visibleOrderColumns.distributor && <th className="pb-2.5">Distributor</th>}
                  {visibleOrderColumns.cards && <th className="pb-2.5 text-center">Cards</th>}
                  {visibleOrderColumns.amount && <th className="pb-2.5 text-right">Amount</th>}
                  {visibleOrderColumns.action && <th className="pb-2.5 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {summary?.recentOrders?.map((order, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    {visibleOrderColumns.sl && (
                      <td className="py-3 text-center font-mono text-slate-400 text-xs font-semibold">
                        {idx + 1}
                      </td>
                    )}
                    {visibleOrderColumns.orderNumber && <td className="py-3 font-mono font-semibold text-teal-300">{order.orderNumber}</td>}
                    {visibleOrderColumns.distributor && <td className="py-3 text-slate-300 truncate max-w-[130px]">{order.distributorName}</td>}
                    {visibleOrderColumns.cards && <td className="py-3 text-center font-bold text-white">{order.totalCardsCount}</td>}
                    {visibleOrderColumns.amount && (
                      <td className="py-3 text-right font-mono font-bold text-emerald-400">
                        ৳{Number(order.finalAmount).toFixed(2)}
                      </td>
                    )}
                    {visibleOrderColumns.action && (
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleViewInvoice(order.id)}
                          disabled={loadingInvoiceId === order.id}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition disabled:opacity-50"
                          title="View Invoice & PINs"
                        >
                          <Eye className={`w-3.5 h-3.5 ${loadingInvoiceId === order.id ? 'animate-pulse text-teal-400' : ''}`} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {(!summary?.recentOrders || summary.recentOrders.length === 0) && (
                  <tr>
                    <td colSpan={Object.values(visibleOrderColumns).filter(Boolean).length || 1} className="py-6 text-center text-slate-500">No orders created yet. Click "New Distributor Sale" to begin.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}