import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useLocation } from 'react-router-dom';
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
  Filter,
  ChevronDown,
  ChevronUp,
  Columns3,
  Check
} from 'lucide-react';
import StatCard from '../components/StatCard';
import InvoiceModal from '../components/InvoiceModal';
import ColumnSelector from '../components/ColumnSelector';
import SearchableDistributorSelect from '../components/SearchableDistributorSelect';
import SearchableProductSelect from '../components/SearchableProductSelect';
import { salesService, distributorService, inventoryService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { usePageLoading } from '../context/PageLoadingContext';

export default function SalesPage() {
  const { setPageLoading } = usePageLoading();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);
  const [orders, setOrders] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [denominations, setDenominations] = useState([]);
  const [batches, setBatches] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDistributorId, setFilterDistributorId] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
  const [filterOrderStatus, setFilterOrderStatus] = useState('');
  const [filterStartDate, setFilterStartDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [filterEndDate, setFilterEndDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });

  const [showFilters, setShowFilters] = useState(false);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const columnSelectorRef = useRef(null);

  const columnDefinitions = [
    { key: 'orderNumber', label: 'Order #' },
    { key: 'distributor', label: 'Distributor' },
    { key: 'date', label: 'Date' },
    { key: 'units', label: 'Units' },
    { key: 'gross', label: 'Gross' },
    { key: 'discount', label: 'Discount' },
    { key: 'netTotal', label: 'Net Total' },
    { key: 'payment', label: 'Payment' },
    { key: 'actions', label: 'Actions' },
  ];

  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('sales_visible_columns');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return {
      orderNumber: true,
      distributor: true,
      date: true,
      units: true,
      gross: true,
      discount: true,
      netTotal: true,
      payment: true,
      actions: true,
    };
  });

  const toggleColumn = (key) => {
    setVisibleColumns((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('sales_visible_columns', JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      return updated;
    });
  };

  const resetColumns = () => {
    const defaultCols = {
      orderNumber: true,
      distributor: true,
      date: true,
      units: true,
      gross: true,
      discount: true,
      netTotal: true,
      payment: true,
      actions: true,
    };
    setVisibleColumns(defaultCols);
    try {
      localStorage.setItem('sales_visible_columns', JSON.stringify(defaultCols));
    } catch (e) {
      // ignore
    }
  };

  // Close column selector dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (columnSelectorRef.current && !columnSelectorRef.current.contains(event.target)) {
        setShowColumnSelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
  const calculateItemRange = (start, end, denomId) => {
    if (!start || !end) return null;
    const s = String(start).trim();
    const e = String(end).trim();
    if (!s || !e) return null;

    const regex = /^(.*?)(\d+)$/;
    const m1 = s.match(regex);
    const m2 = e.match(regex);

    if (!m1 || !m2) {
      return { valid: false, error: 'Serials must end with numeric digits (e.g. 100001 or SN-100-0001)' };
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
      return { valid: false, error: 'Maximum 10,000 cards per order line' };
    }

    // Check if the requested range is within available stock batches for this product
    if (denomId && batches && batches.length > 0) {
      const denomBatches = batches.filter(b => String(b.denominationId) === String(denomId));
      if (denomBatches.length > 0) {
        const matchingBatch = denomBatches.find(b => {
          if (!b.startSerialNumber || !b.endSerialNumber) return false;
          const bM1 = b.startSerialNumber.trim().match(regex);
          const bM2 = b.endSerialNumber.trim().match(regex);
          if (!bM1 || !bM2 || bM1[1] !== bM2[1]) return false;
          if (bM1[1] !== m1[1]) return false;
          const bN1 = parseInt(bM1[2], 10);
          const bN2 = parseInt(bM2[2], 10);
          return n1 >= bN1 && n2 <= bN2;
        });

        if (!matchingBatch) {
          const availableRanges = denomBatches
            .filter(b => b.startSerialNumber && b.endSerialNumber)
            .map(b => `${b.startSerialNumber} ~ ${b.endSerialNumber}`)
            .join(', ');
          return {
            valid: false,
            error: availableRanges
              ? `Serial range is outside available inventory stock (${availableRanges})`
              : 'Serial range is outside available inventory stock for this product'
          };
        }
      }
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
      const [ordersRes, distsRes, denomsRes, batchesRes] = await Promise.all([
        salesService.getOrders({
          page,
          size: 15,
          startDate: filterStartDate ? filterStartDate + 'T00:00:00' : undefined,
          endDate: filterEndDate ? filterEndDate + 'T23:59:59' : undefined,
        }),
        distributorService.getAll(),
        inventoryService.getActiveDenominations(),
        inventoryService.getAllBatches(),
      ]);

      if (ordersRes.data?.success) {
        setOrders(ordersRes.data.data.content);
        setTotalPages(ordersRes.data.data.totalPages);
        setCurrentPage(page);
      }
      if (distsRes.data?.success) {
        const distsList = distsRes.data.data;
        setDistributors(distsList);
        const activeDist = distsList.find(d => d.status === 'ACTIVE') || distsList[0];
        if (activeDist) {
          setSelectedDistributorId(prev => prev || String(activeDist.id));
        }
      }
      if (batchesRes.data?.success) setBatches(batchesRes.data.data);
      if (denomsRes.data?.success) {
        const denomsList = denomsRes.data.data;
        setDenominations(denomsList);
        const inStockDenoms = denomsList.filter(d => (d.availableStock || 0) > 0);
        const navState = location.state;
        if (!navState?.startSerialNumber && (!orderItems[0]?.denominationId || !orderItems[0]?.startSerialNumber)) {
          const firstDenomId = inStockDenoms.length > 0 ? inStockDenoms[0].id : (denomsList[0]?.id || '');
          if (firstDenomId) {
            prefillSerialRangeForItem(0, firstDenomId, [
              { denominationId: firstDenomId, startSerialNumber: '', endSerialNumber: '', availableStockInfo: null }
            ]);
          }
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
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setSearchQuery('');
    setFilterDistributorId('');
    setFilterPaymentMethod('');
    setFilterOrderStatus('');
    setFilterStartDate(monthStart);
    setFilterEndDate(today);
    fetchOrders(0, {});
  };

  useEffect(() => {
    loadData(0);
    const navState = location.state;
    if (navState?.openOrderModal || searchParams.get('action') === 'new') {
      setShowOrderModal(true);
      if (navState?.denominationId && navState?.startSerialNumber && navState?.endSerialNumber) {
        setOrderItems([
          {
            denominationId: String(navState.denominationId),
            startSerialNumber: navState.startSerialNumber,
            endSerialNumber: navState.endSerialNumber,
            availableStockInfo: null
          }
        ]);
      }
    }
  }, [location.state]);

  const activeDistributor = distributors.find((d) => String(d.id) === String(selectedDistributorId));

  const handleAddItemRow = () => {
    const inStockDenoms = denominations.filter(d => (d.availableStock || 0) > 0);
    const targetList = inStockDenoms.length > 0 ? inStockDenoms : denominations;
    if (targetList.length === 0) return;
    const defaultDenomId = targetList[0].id;
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

    // When product/denomination changes, automatically pre-fill available serial range cleanly
    if (field === 'denominationId') {
      const denomBatch = batches.find(b => String(b.denominationId) === String(val) && b.startSerialNumber && b.endSerialNumber);
      updated[idx] = {
        ...updated[idx],
        denominationId: val,
        startSerialNumber: denomBatch ? denomBatch.startSerialNumber : '',
        endSerialNumber: denomBatch ? denomBatch.endSerialNumber : '',
        availableStockInfo: null
      };
      setOrderItems(updated);
      prefillSerialRangeForItem(idx, val, updated);
      return;
    }

    updated[idx][field] = val;
    setOrderItems(updated);
  };

  const currentDiscountRate = customDiscount !== ''
    ? parseFloat(customDiscount) || 0
    : (activeDistributor?.discountRate || 0);

  const calculatedGross = orderItems.reduce((acc, item) => {
    const denom = denominations.find((d) => String(d.id) === String(item.denominationId));
    const range = calculateItemRange(item.startSerialNumber, item.endSerialNumber, item.denominationId);
    const qty = range && range.valid ? range.count : 0;
    const unitPrice = denom ? Number(denom.wholesalePrice != null ? denom.wholesalePrice : (denom.retailPrice || denom.faceValue || 0)) : 0;
    return acc + (unitPrice * qty);
  }, 0);

  const calculatedDiscount = (calculatedGross * currentDiscountRate) / 100;
  const calculatedNet = calculatedGross - calculatedDiscount;

  const hasRangeError = orderItems.some((item) => {
    if (!item.startSerialNumber || !item.endSerialNumber) return false;
    const range = calculateItemRange(item.startSerialNumber, item.endSerialNumber, item.denominationId);
    return range && !range.valid;
  });

  const isFormIncomplete = !selectedDistributorId ||
    orderItems.length === 0 ||
    orderItems.some((item) => !item.denominationId || !item.startSerialNumber || !item.endSerialNumber);

  const hasOrderFormErrors = hasRangeError || isFormIncomplete;

  const handleOpenOrderModal = () => {
    setShowOrderModal(true);
    if (!selectedDistributorId && distributors.length > 0) {
      const activeDist = distributors.find(d => d.status === 'ACTIVE') || distributors[0];
      if (activeDist) {
        setSelectedDistributorId(String(activeDist.id));
      }
    }
    const inStockDenoms = denominations.filter(d => (d.availableStock || 0) > 0);
    const targetList = inStockDenoms.length > 0 ? inStockDenoms : denominations;
    if (targetList.length > 0) {
      const firstDenomId = targetList[0].id;
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
      const range = calculateItemRange(item.startSerialNumber, item.endSerialNumber, item.denominationId);
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
          title="Total Orders"
          value={totalOrdersCount.toString()}
          subtext="Wholesale order invoices"
          icon={CheckCircle2}
          color="sky"
        />
        <StatCard
          title="Cards Distributed"
          value={totalCardsSold.toLocaleString()}
          subtext="Total units delivered"
          icon={ShoppingCart}
          color="emerald"
        />
        <StatCard
          title="Discounted Amount"
          value={`৳${totalDiscounts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtext="Promotional deductions"
          icon={Layers}
          color="violet"
        />
        <StatCard
          title="Net Sales"
          value={`৳${totalNetRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtext={`Retail Value: ৳${totalGrossValue.toFixed(2)}`}
          icon={DollarSign}
          color="amber"
        />
      </div>

      {/* Sales Orders Table Section */}
      <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">Sales & Invoices</h2>
            <p className="text-xs text-slate-400 mt-0.5">Manage, search, and filter Sales Details</p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Column Selector Dropdown */}
            <ColumnSelector
              columns={columnDefinitions}
              visibleColumns={visibleColumns}
              onToggleColumn={toggleColumn}
              onResetColumns={resetColumns}
            />

            <button
              onClick={() => setShowFilters(prev => !prev)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border ${
                showFilters || searchQuery || filterDistributorId || filterPaymentMethod || filterOrderStatus
                  ? 'bg-teal-500/15 border-teal-500/30 text-teal-300'
                  : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-700/80'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
              {(searchQuery || filterDistributorId || filterPaymentMethod || filterOrderStatus) && (
                <span className="w-2 h-2 rounded-full bg-teal-400 ml-0.5 animate-pulse" />
              )}
              {showFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {isAdmin && (
              <button
                onClick={handleOpenOrderModal}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 text-xs font-bold hover:from-teal-300 hover:to-emerald-300 transition shadow-lg shadow-teal-500/20 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> New Sales
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter Bar (Collapsible) */}
        {showFilters && (
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3 animate-fadeIn">
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
            {/* Start Date */}
            <div
              onClick={() => { startDateRef.current?.showPicker?.(); startDateRef.current?.click(); }}
              className="relative bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 w-32 focus-within:border-teal-500 cursor-pointer flex items-center gap-1.5 select-none"
            >
              <Calendar className="w-3 h-3 text-slate-500 flex-shrink-0" />
              <span className="text-xs font-mono text-white flex-1 leading-none pointer-events-none">
                {filterStartDate ? filterStartDate.split('-').reverse().join('-') : <span className="text-slate-500">dd-MM-YYYY</span>}
              </span>
              <input
                ref={startDateRef}
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="sr-only"
              />
            </div>
            <span>to</span>
            {/* End Date */}
            <div
              onClick={() => { endDateRef.current?.showPicker?.(); endDateRef.current?.click(); }}
              className="relative bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 w-32 focus-within:border-teal-500 cursor-pointer flex items-center gap-1.5 select-none"
            >
              <Calendar className="w-3 h-3 text-slate-500 flex-shrink-0" />
              <span className="text-xs font-mono text-white flex-1 leading-none pointer-events-none">
                {filterEndDate ? filterEndDate.split('-').reverse().join('-') : <span className="text-slate-500">dd-MM-YYYY</span>}
              </span>
              <input
                ref={endDateRef}
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="sr-only"
              />
            </div>
            {(filterStartDate || filterEndDate) && (
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
                  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                  setFilterStartDate(monthStart);
                  setFilterEndDate(today);
                  fetchOrders(0, {
                    search: searchQuery || undefined,
                    distributorId: filterDistributorId || undefined,
                    paymentMethod: filterPaymentMethod || undefined,
                    status: filterOrderStatus || undefined,
                    startDate: monthStart,
                    endDate: today,
                  });
                }}
                className="text-xs text-teal-400 hover:underline"
              >
                Reset Dates
              </button>
            )}
          </div>
        </div>
        )}

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
                  {visibleColumns.orderNumber && <th className="px-4 py-3">Order #</th>}
                  {visibleColumns.distributor && <th className="px-4 py-3">Distributor</th>}
                  {visibleColumns.date && <th className="px-4 py-3">Date</th>}
                  {visibleColumns.units && <th className="px-4 py-3">Units</th>}
                  {visibleColumns.gross && <th className="px-4 py-3">Gross</th>}
                  {visibleColumns.discount && <th className="px-4 py-3">Discount</th>}
                  {visibleColumns.netTotal && <th className="px-4 py-3">Net Total</th>}
                  {visibleColumns.payment && <th className="px-4 py-3">Payment</th>}
                  {visibleColumns.actions && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/30 transition">
                    {visibleColumns.orderNumber && (
                      <td className="px-4 py-3 font-mono font-bold text-teal-400">{o.orderNumber}</td>
                    )}
                    {visibleColumns.distributor && (
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{o.distributorName}</div>
                        <div className="text-[10px] text-slate-500">{o.distributorPhone || o.distributorEmail}</div>
                      </td>
                    )}
                    {visibleColumns.date && (
                      <td className="px-4 py-3 text-slate-400">
                        {o.createdAt ? (() => { const d = new Date(o.createdAt); return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`; })() : '-'}
                      </td>
                    )}
                    {visibleColumns.units && (
                      <td className="px-4 py-3 font-semibold text-white">{o.totalCardsCount?.toLocaleString()}</td>
                    )}
                    {visibleColumns.gross && (
                      <td className="px-4 py-3 font-mono text-slate-300">৳{Number(o.totalFaceValue || 0).toFixed(2)}</td>
                    )}
                    {visibleColumns.discount && (
                      <td className="px-4 py-3 font-mono text-emerald-400">
                        {Number(o.discountAmount || 0) > 0 ? `-৳${Number(o.discountAmount).toFixed(2)}` : '৳0.00'}
                      </td>
                    )}
                    {visibleColumns.netTotal && (
                      <td className="px-4 py-3 font-mono font-bold text-teal-300">৳{Number(o.finalAmount || 0).toFixed(2)}</td>
                    )}
                    {visibleColumns.payment && (
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          o.paymentMethod === 'BALANCE_CREDIT'
                            ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {o.paymentMethod?.replace('_', ' ')}
                        </span>
                      </td>
                    )}
                    {visibleColumns.actions && (
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleViewInvoice(o.id)}
                          className="px-3 py-1.5 rounded-lg bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 border border-teal-500/30 text-xs font-semibold flex items-center gap-1.5 ml-auto transition"
                        >
                          <Eye className="w-3.5 h-3.5" /> Invoice
                        </button>
                      </td>
                    )}
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
      {showOrderModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          {/* Fullscreen Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity"
            onClick={() => setShowOrderModal(false)}
            aria-hidden="true"
          />

          {/* Modal Dialog Card (Never exceeds 90vh, pinned header and footer) */}
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-slate-900/85 backdrop-blur-xl border border-slate-700/70 rounded-3xl shadow-2xl z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Pinned Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/40 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-white">Create Order</h3>
                <p className="text-xs text-slate-400 mt-0.5">Select partner, product and serial range</p>
              </div>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800/60 transition"
              >
                ✕
              </button>
            </div>

            {/* Form with Scrollable Content Body and Pinned Footer */}
            <form onSubmit={handleCreateOrder} className="flex flex-col flex-1 overflow-hidden min-h-0">
              {/* Scrollable Form Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {formError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Partner & Payment Method */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                      Distributor <span className="text-teal-400">*</span>
                    </label>
                    <SearchableDistributorSelect
                      required
                      value={selectedDistributorId}
                      onChange={(val) => setSelectedDistributorId(val)}
                      distributors={distributors}
                      placeholder="-- Search or Choose Distributor --"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">Payment Method</label>
                    <select
                      value={selectedPaymentMethod}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                      className="w-full bg-slate-950/60 backdrop-blur-sm border border-slate-800/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                    >
                      <option value="BALANCE_CREDIT">Distributor Credit Wallet</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CASH">Cash Settlement</option>
                    </select>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-teal-400" />
                      Card & Serial Range
                    </label>
                    <button
                      type="button"
                      onClick={handleAddItemRow}
                      className="text-xs text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>

                  {orderItems.map((item, idx) => {
                    const selectedDenomObj = denominations.find(d => String(d.id) === String(item.denominationId));
                    const range = calculateItemRange(item.startSerialNumber, item.endSerialNumber, item.denominationId);
                    const stockInfo = item.availableStockInfo;

                    return (
                      <div key={idx} className="p-4 rounded-2xl bg-slate-950/50 backdrop-blur-sm border border-slate-800/80 space-y-3 relative group">
                        {/* Item # and Product Selector in One Line */}
                        <div className="flex items-center gap-2.5">
                          <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wide px-2 py-2 rounded-xl bg-teal-500/10 border border-teal-500/20 flex-shrink-0">
                            Item #{idx + 1}
                          </span>

                          <div className="flex-1 min-w-0">
                            <SearchableProductSelect
                              required
                              value={item.denominationId}
                              onChange={(val) => handleItemChange(idx, 'denominationId', val)}
                              products={denominations.filter(d => (d.availableStock || 0) > 0 || String(d.id) === String(item.denominationId))}
                              placeholder="-- Search or Choose Card --"
                            />
                          </div>

                          {orderItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(idx)}
                              className="text-slate-500 hover:text-red-400 p-2 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-red-500/30 transition flex-shrink-0"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Serial Range, Allocation & Subtotal in One Line */}
                        <div className="space-y-2">
                          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1 flex-shrink-0">
                              <Hash className="w-3 h-3" /> Serial
                            </span>
                            <div className="flex-1 min-w-[130px]">
                              <input
                                type="text"
                                required
                                placeholder="Start Serial"
                                value={item.startSerialNumber}
                                onChange={(e) => handleItemChange(idx, 'startSerialNumber', e.target.value)}
                                className="w-full bg-slate-950/70 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-teal-500 placeholder:font-normal placeholder:text-slate-500"
                              />
                            </div>

                            <span className="text-slate-500 font-mono font-bold">~</span>

                            <div className="flex-1 min-w-[130px]">
                              <input
                                type="text"
                                required
                                placeholder="End Serial"
                                value={item.endSerialNumber}
                                onChange={(e) => handleItemChange(idx, 'endSerialNumber', e.target.value)}
                                className="w-full bg-slate-950/70 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-teal-500 placeholder:font-normal placeholder:text-slate-500"
                              />
                            </div>

                            {range && range.valid && (
                              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-xs flex-shrink-0">
                                <div className="flex items-center gap-1 text-teal-300">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                                  <span>
                                    <strong className="text-white font-mono">{range.count.toLocaleString()}</strong> cards
                                  </span>
                                </div>
                                {selectedDenomObj && (
                                  <span className="font-mono text-teal-300 font-bold pl-2 border-l border-teal-500/30">
                                    ৳{(range.count * Number(selectedDenomObj.wholesalePrice != null ? selectedDenomObj.wholesalePrice : (selectedDenomObj.retailPrice || selectedDenomObj.faceValue || 0))).toFixed(2)}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Error Message if range is invalid */}
                          {range && !range.valid && (
                            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                              <span>{range.error}</span>
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
                      Discount % <span className="text-slate-500">(Optional override)</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder={`Default: ${activeDistributor?.discountRate || 0}%`}
                      value={customDiscount}
                      onChange={(e) => setCustomDiscount(e.target.value)}
                      className="w-full bg-slate-950/60 backdrop-blur-sm border border-slate-800/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">Order Remarks / Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Monthly allocation batch"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      className="w-full bg-slate-950/60 backdrop-blur-sm border border-slate-800/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                {/* Calculated Summary Box */}
                <div className="p-4 rounded-2xl bg-slate-950/50 backdrop-blur-sm border border-slate-800/80 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Wholesale Value:</span>
                    <span className="font-mono text-white">৳{calculatedGross.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400">
                    <span>Distributor Discount ({currentDiscountRate}%):</span>
                    <span className="font-mono">-৳{calculatedDiscount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-white pt-1 border-t border-slate-800/80">
                    <span>Payable Amount:</span>
                    <span className="font-mono text-teal-400 text-base">৳{calculatedNet.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Pinned Footer with Action Buttons */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800/80 bg-slate-950/40 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || hasOrderFormErrors}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 text-xs font-bold hover:from-teal-300 hover:to-emerald-300 transition shadow-lg shadow-teal-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-400 disabled:shadow-none"
                >
                  {isSubmitting ? 'Confirming...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
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
