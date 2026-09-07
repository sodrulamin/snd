import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  Eye, 
  Download, 
  AlertCircle,
  Hash,
  Layers,
  CheckCircle2,
  Calendar,
  DollarSign,
  ShoppingCart,
  Sparkles,
  Search,
  X,
  RotateCcw,
  Filter
} from 'lucide-react';
import StatCard from '../components/StatCard';
import InvoiceModal from '../components/InvoiceModal';
import { salesService, distributorService, inventoryService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { usePageLoading } from '../context/PageLoadingContext';

export default function SalesPage() {
  const { setPageLoading } = usePageLoading();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [denominations, setDenominations] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDistributorId, setFilterDistributorId] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
  const [filterOrderStatus, setFilterOrderStatus] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [selectedDistributorId, setSelectedDistributorId] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('BALANCE_CREDIT');
  const [customDiscount, setCustomDiscount] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderItems, setOrderItems] = useState([
    { denominationId: '', startSerialNumber: '', endSerialNumber: '', availableStockInfo: null }
  ]);

  // Serial range calculator helper for selling
  const calculateItemRange = (start, end) => {
    if (!start || !end) return null;
    const s = start.trim();
    const e = end.trim();
    const regex = /^(.*?)(\d+)$/;
    const m1 = s.match(regex);
    const m2 = e.match(regex);

    if (!m1 || !m2) {
      return { valid: false, error: 'Serials must end with numbers (e.g. 100001 or SN-100-0001)' };
    }
    if (m1[1] !== m2[1]) {
      return { valid: false, error: `Prefix mismatch: "${m1[1]}" vs "${m2[1]}"` };
    }
    const n1 = parseInt(m1[2], 10);
    const n2 = parseInt(m2[2], 10);
    if (n2 < n1) {
      return { valid: false, error: 'End serial cannot be smaller than Start serial' };
    }
    const count = n2 - n1 + 1;
    if (count > 10000) {
      return { valid: false, error: 'Max 10,000 cards per item' };
    }
    return { valid: true, count, prefix: m1[1] };
  };

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isAdmin } = useAuth();

  // Helper to fetch and pre-fill the first available serial range for a denomination
  const prefillSerialRangeForItem = async (idx, denomId, currentItems = null) => {
    if (!denomId) return;
    try {
      const res = await inventoryService.getAvailableSerialRange(denomId);
      const data = res.data?.data;
      setOrderItems(prev => {
        const items = currentItems ? [...currentItems] : [...prev];
        if (items[idx]) {
          items[idx] = {
            ...items[idx],
            denominationId: denomId,
            startSerialNumber: data?.available ? (data.startSerialNumber || '') : '',
            endSerialNumber: data?.available ? (data.endSerialNumber || '') : '',
            availableStockInfo: data || null
          };
        }
        return items;
      });
    } catch (err) {
      console.error('Failed to fetch available range for denomination:', denomId, err);
    }
  };

  const fetchOrders = async (page = 0, currentFilters = null) => {
    try {
      setLoading(true);
      const activeFilters = currentFilters !== null ? currentFilters : {
        search: searchQuery || undefined,
        distributorId: filterDistributorId || undefined,
        paymentMethod: filterPaymentMethod || undefined,
        status: filterOrderStatus || undefined,
        startDate: filterStartDate ? filterStartDate + 'T00:00:00' : undefined,
        endDate: filterEndDate ? filterEndDate + 'T23:59:59' : undefined,
      };

      const res = await salesService.getOrders({
        page,
        size: 15,
        ...activeFilters,
      });

      if (res.data?.success) {
        setOrders(res.data.data.content);
        setTotalPages(res.data.data.totalPages);
        setCurrentPage(page);
      }
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  const loadData = async (page = 0) => {
    try {
      setLoading(true);
      const [ordersRes, distsRes, denomsRes] = await Promise.all([
        salesService.getOrders({ page, size: 15 }),
        distributorService.getAll(),
        inventoryService.getActiveDenominations(),
      ]);

      if (ordersRes.data?.success) {
        setOrders(ordersRes.data.data.content);
        setTotalPages(ordersRes.data.data.totalPages);
        setCurrentPage(page);
      }
      if (distsRes.data?.success) setDistributors(distsRes.data.data);
      if (denomsRes.data?.success) {
        const denomsList = denomsRes.data.data;
        setDenominations(denomsList);
        if (denomsList.length > 0 && (!orderItems[0].denominationId || !orderItems[0].startSerialNumber)) {
          const firstDenomId = denomsList[0].id;
          prefillSerialRangeForItem(0, firstDenomId, [
            { denominationId: firstDenomId, startSerialNumber: '', endSerialNumber: '', availableStockInfo: null }
          ]);
        }
      }
    } catch (err) {
      console.error('Failed to load sales data', err);
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  const handleApplyFilters = (e) => {
    if (e) e.preventDefault();
    fetchOrders(0);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterDistributorId('');
    setFilterPaymentMethod('');
    setFilterOrderStatus('');
    setFilterStartDate('');
    setFilterEndDate('');
    fetchOrders(0, {});
  };

  useEffect(() => {
    loadData(0);
    if (searchParams.get('action') === 'new') {
      setShowOrderModal(true);
    }
  }, []);

  const activeDistributor = distributors.find((d) => String(d.id) === String(selectedDistributorId));

  const handleAddItemRow = () => {
    if (denominations.length === 0) return;
    const defaultDenomId = denominations[0].id;
    const newIdx = orderItems.length;
    const newItems = [...orderItems, { denominationId: defaultDenomId, startSerialNumber: '', endSerialNumber: '', availableStockInfo: null }];
    setOrderItems(newItems);
    prefillSerialRangeForItem(newIdx, defaultDenomId, newItems);
  };

  const handleRemoveItemRow = (idx) => {
    if (orderItems.length === 1) return;
    setOrderItems(orderItems.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, val) => {
    const updated = [...orderItems];
    updated[idx][field] = val;
    
    // When product/denomination changes, automatically pre-fill available serial range
    if (field === 'denominationId') {
      setOrderItems(updated);
      prefillSerialRangeForItem(idx, val, updated);
      return;
    }
    setOrderItems(updated);
  };

  const currentDiscountRate = customDiscount !== '' 
    ? parseFloat(customDiscount) || 0 
    : (activeDistributor?.discountRate || 0);

  const calculatedGross = orderItems.reduce((acc, item) => {
    const denom = denominations.find((d) => String(d.id) === String(item.denominationId));
    const range = calculateItemRange(item.startSerialNumber, item.endSerialNumber);
    const qty = range && range.valid ? range.count : 0;
    return acc + (denom ? (denom.retailPrice || denom.faceValue) * qty : 0);
  }, 0);

  const calculatedDiscount = (calculatedGross * currentDiscountRate) / 100;
  const calculatedNet = calculatedGross - calculatedDiscount;

  const handleOpenOrderModal = () => {
    setShowOrderModal(true);
    if (denominations.length > 0) {
      const firstDenomId = denominations[0].id;
      setOrderItems([
        { denominationId: firstDenomId, startSerialNumber: '', endSerialNumber: '', availableStockInfo: null }
      ]);
      prefillSerialRangeForItem(0, firstDenomId);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!selectedDistributorId) {
      setFormError('Please select a distributor partner');
      return;
    }

    if (orderItems.length === 0) {
      setFormError('Please configure at least one card product item');
      return;
    }

    for (let i = 0; i < orderItems.length; i++) {
      const item = orderItems[i];
      if (!item.denominationId) {
        setFormError(`Item #${i + 1}: Please select a card product.`);
        return;
      }
      if (!item.startSerialNumber || !item.endSerialNumber) {
        setFormError(`Item #${i + 1}: Please specify both Start and End Serial Numbers.`);
        return;
      }
      const range = calculateItemRange(item.startSerialNumber, item.endSerialNumber);
      if (!range || !range.valid) {
        setFormError(`Item #${i + 1}: ${range?.error || 'Invalid serial range format'}`);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const payload = {
        distributorId: Number(selectedDistributorId),
        paymentMethod: selectedPaymentMethod,
        customDiscountPercentage: customDiscount !== '' ? parseFloat(customDiscount) : null,
        notes: orderNotes,
        items: orderItems.map((i) => ({
          denominationId: Number(i.denominationId),
          startSerialNumber: i.startSerialNumber.trim(),
          endSerialNumber: i.endSerialNumber.trim(),
        })),
      };

      const res = await salesService.createOrder(payload);
      if (res.data?.success) {
        setShowOrderModal(false);
        setSelectedDistributorId('');
        setCustomDiscount('');
        setOrderNotes('');
        const first = denominations[0];
        setOrderItems([{ denominationId: first?.id || '', startSerialNumber: '', endSerialNumber: '', availableStockInfo: null }]);
        loadData(0);
        handleViewInvoice(res.data.data.id);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to complete sales order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewInvoice = async (orderId) => {
    try {
      const res = await salesService.getInvoice(orderId);
      if (res.data?.success) {
        setSelectedInvoice(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load invoice', err);
    }
  };

  const totalOrdersCount = orders.length;
  const totalCardsSold = orders.reduce((acc, o) => acc + (o.totalCardsCount || 0), 0);
  const totalGrossValue = orders.reduce((acc, o) => acc + Number(o.totalFaceValue || 0), 0);
  const totalNetRevenue = orders.reduce((acc, o) => acc + Number(o.finalAmount || 0), 0);
  const totalDiscounts = orders.reduce((acc, o) => acc + Number(o.discountAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Sales Summary KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Net Sales"
          value={`৳${totalNetRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtext={`Gross Face Value: ৳${totalGrossValue.toFixed(2)}`}
          icon={DollarSign}
          color="teal"
        />
        <StatCard
          title="Cards Dispatched"
          value={totalCardsSold.toLocaleString()}
          subtext="Total units delivered"
          icon={ShoppingCart}
          color="emerald"
        />
        <StatCard
          title="Total Orders"
          value={totalOrdersCount.toString()}
          subtext="Wholesale order invoices"
          icon={CheckCircle2}
          color="blue"
        />
        <StatCard
          title="Distributor Discounts"
          value={`৳${totalDiscounts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtext="Promotional deductions"
          icon={Layers}
          color="violet"
        />
      </div>

      {/* Sales Orders Table Section */}
      <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">Wholesale Orders & Invoices</h2>
            <p className="text-xs text-slate-400 mt-0.5">Manage, search, and filter distributor wholesale card bulk purchases</p>
          </div>

          {isAdmin && (
            <button
              onClick={handleOpenOrderModal}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 text-xs font-bold hover:from-teal-300 hover:to-emerald-300 transition shadow-lg shadow-teal-500/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New Sales Order
            </button>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
          <form onSubmit={handleApplyFilters} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3">
            {/* Search Keyword */}
            <div className="lg:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search order #, distributor, serials, notes..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-8 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Distributor Filter */}
            <div className="lg:col-span-3">
              <select
                value={filterDistributorId}
                onChange={(e) => setFilterDistributorId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 transition"
              >
                <option value="">All Distributors</option>
                {distributors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fullName} (@{d.username})
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method Filter */}
            <div className="lg:col-span-2">
              <select
                value={filterPaymentMethod}
                onChange={(e) => setFilterPaymentMethod(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 transition"
              >
                <option value="">All Payments</option>
                <option value="BALANCE_CREDIT">Balance / Credit</option>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
            </div>

            {/* Filter Buttons */}
            <div className="lg:col-span-2 flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 transition"
              >
                <Search className="w-3.5 h-3.5" />
                Filter
              </button>
              {(searchQuery || filterDistributorId || filterPaymentMethod || filterStartDate || filterEndDate) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs border border-slate-700 transition"
                  title="Reset all filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>

          {/* Date Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/60 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-teal-400" />
              <span>Date Filter:</span>
            </div>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-teal-500"
            />
            <span>to</span>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-teal-500"
            />
            {(filterStartDate || filterEndDate) && (
              <button
                type="button"
                onClick={() => { 
                  setFilterStartDate(''); 
                  setFilterEndDate(''); 
                  fetchOrders(0, {
                    search: searchQuery || undefined,
                    distributorId: filterDistributorId || undefined,
                    paymentMethod: filterPaymentMethod || undefined,
                    status: filterOrderStatus || undefined,
                    startDate: undefined,
                    endDate: undefined,
                  }); 
                }}
                className="text-xs text-teal-400 hover:underline"
              >
                Clear Dates
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl">
            <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-300">No Sales Orders Found</p>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search keywords or active filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Order #</th>
                  <th className="px-4 py-3">Distributor</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Units</th>
                  <th className="px-4 py-3">Gross</th>
                  <th className="px-4 py-3">Discount</th>
                  <th className="px-4 py-3">Net Total</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3 font-mono font-bold text-teal-400">{o.orderNumber}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{o.distributorName}</div>
                      <div className="text-[10px] text-slate-500">{o.distributorPhone || o.distributorEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">{o.totalCardsCount?.toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono text-slate-300">৳{Number(o.totalFaceValue || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 font-mono text-emerald-400">
                      {Number(o.discountAmount || 0) > 0 ? `-৳${Number(o.discountAmount).toFixed(2)}` : '৳0.00'}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-teal-300">৳{Number(o.finalAmount || 0).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        o.paymentMethod === 'BALANCE_CREDIT'
                          ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {o.paymentMethod?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleViewInvoice(o.id)}
                        className="px-3 py-1.5 rounded-lg bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 border border-teal-500/30 text-xs font-semibold flex items-center gap-1.5 ml-auto transition"
                      >
                        <Eye className="w-3.5 h-3.5" /> Invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-between items-center pt-4 border-t border-slate-800 text-xs text-slate-400">
            <span>Page {currentPage + 1} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 0}
                onClick={() => fetchOrders(currentPage - 1)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-semibold transition"
              >
                Previous
              </button>
              <button
                disabled={currentPage + 1 >= totalPages}
                onClick={() => fetchOrders(currentPage + 1)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-semibold transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Sales Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">Create Wholesale Distributor Order</h3>
                <p className="text-xs text-slate-400 mt-0.5">Select partner, product, and verify serial range allocation</p>
              </div>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateOrder} className="space-y-4">
              {/* Partner & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                    Distributor Partner <span className="text-teal-400">*</span>
                  </label>
                  <select
                    required
                    value={selectedDistributorId}
                    onChange={(e) => setSelectedDistributorId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="">-- Choose Distributor --</option>
                    {distributors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.companyName || d.fullName} (Disc: {d.discountRate || 0}%, Bal: ৳{Number(d.balance || 0).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">Payment Method</label>
                  <select
                    value={selectedPaymentMethod}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="BALANCE_CREDIT">Distributor Credit Wallet</option>
                    <option value="BANK_TRANSFER">Bank Wire / Transfer</option>
                    <option value="CASH">Cash Settlement</option>
                  </select>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-teal-400" />
                    Card Products & Serial Allocation
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Card Product
                  </button>
                </div>

                {orderItems.map((item, idx) => {
                  const selectedDenomObj = denominations.find(d => String(d.id) === String(item.denominationId));
                  const range = calculateItemRange(item.startSerialNumber, item.endSerialNumber);
                  const stockInfo = item.availableStockInfo;

                  return (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 relative group">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wide">
                          Item #{idx + 1}
                        </span>
                        {orderItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            className="text-slate-500 hover:text-red-400 p-1 rounded-lg transition"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Product Selector */}
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">
                          Select Card Product <span className="text-teal-400">*</span>
                        </label>
                        <select
                          value={item.denominationId}
                          onChange={(e) => handleItemChange(idx, 'denominationId', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                        >
                          {denominations.map((d) => (
                            <option key={d.id} value={d.id}>
                              [{d.code || 'IPTSP'}] {d.name} (৳{Number(d.retailPrice || d.faceValue).toFixed(0)}) — In-Stock: {d.availableStock}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Serial Range Section */}
                      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span className="text-[11px] font-semibold text-slate-300 uppercase flex items-center gap-1">
                            <Hash className="w-3.5 h-3.5 text-teal-400" />
                            Serial Number Range
                          </span>
                          {stockInfo?.available ? (
                            <span className="text-[10px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20 font-mono flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              Auto-filled Available Stock: {stockInfo.startSerialNumber} ~ {stockInfo.endSerialNumber} ({stockInfo.availableCount} cards)
                            </span>
                          ) : stockInfo && !stockInfo.available ? (
                            <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-medium">
                              ⚠️ No in-stock cards available for this product
                            </span>
                          ) : null}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-medium text-slate-400 mb-1">
                              Start Serial Number <span className="text-teal-400">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. SN-100-0001"
                              value={item.startSerialNumber}
                              onChange={(e) => handleItemChange(idx, 'startSerialNumber', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-teal-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-medium text-slate-400 mb-1">
                              End Serial Number <span className="text-teal-400">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. SN-100-0050"
                              value={item.endSerialNumber}
                              onChange={(e) => handleItemChange(idx, 'endSerialNumber', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-teal-500"
                            />
                          </div>
                        </div>

                        {/* Range validation & live calculation */}
                        {range && (
                          <div className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                            range.valid
                              ? 'bg-teal-500/10 border-teal-500/30 text-teal-300'
                              : 'bg-red-500/10 border-red-500/30 text-red-400'
                          }`}>
                            {range.valid ? (
                              <>
                                <div className="flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                                  <span>
                                    Allocating: <strong>{range.count.toLocaleString()} cards</strong>
                                  </span>
                                </div>
                                {selectedDenomObj && (
                                  <span className="font-mono text-white font-bold">
                                    Subtotal: ৳{(range.count * Number(selectedDenomObj.retailPrice || selectedDenomObj.faceValue || 0)).toFixed(2)}
                                  </span>
                                )}
                              </>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                                <span>{range.error}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Discount & Custom Notes */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                    Custom Discount % <span className="text-slate-500">(Optional override)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder={`Default: ${activeDistributor?.discountRate || 0}%`}
                    value={customDiscount}
                    onChange={(e) => setCustomDiscount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">Order Remarks / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Monthly allocation batch"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Calculated Summary Box */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Gross Face Value:</span>
                  <span className="font-mono text-white">৳{calculatedGross.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Discount Applied ({currentDiscountRate}%):</span>
                  <span className="font-mono">-৳{calculatedDiscount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-white pt-1 border-t border-slate-800">
                  <span>Payable Amount:</span>
                  <span className="font-mono text-teal-400 text-base">৳{calculatedNet.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 text-xs font-bold hover:from-teal-300 hover:to-emerald-300 transition shadow-lg shadow-teal-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Allocating Serials...' : 'Confirm & Dispatch Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}
