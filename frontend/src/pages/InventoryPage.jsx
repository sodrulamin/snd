import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  Layers, 
  ShieldCheck, 
  Download, 
  Calendar, 
  Sparkles, 
  AlertCircle, 
  Hash, 
  Package, 
  CheckCircle2, 
  Clock, 
  Plus,
  Trash2,
  ShoppingCart,
  ArrowRight,
  Info,
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { inventoryService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { usePageLoading } from '../context/PageLoadingContext';

export default function InventoryPage() {
  const navigate = useNavigate();
  const { setPageLoading } = usePageLoading();
  const [denominations, setDenominations] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Pagination & Search States
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Summary KPI Stats (aggregated across entire available stock)
  const [summaryStats, setSummaryStats] = useState({
    totalLots: 0,
    inStockCards: 0,
    totalWholesaleValue: 0,
    totalRetailValue: 0,
  });

  // Helper for formatting date to "YYYY-MM-DD HH:mm"
  const formatDateYMDHM = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const pad = (n) => String(n).padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  // Helper for ISO Date string YYYY-MM-DD
  const getNextYearStr = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  };

  // Add Inventory Form State
  const [showBatchModal, setShowBatchModal] = useState(false);

  const [batchForm, setBatchForm] = useState({
    denominationId: '',
    startSerialNumber: '',
    endSerialNumber: '',
    availableUntil: getNextYearStr(),
    notes: '',
  });

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isAdmin } = useAuth();

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(0); // Reset to first page on new search
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load KPI summary
  const loadSummary = async () => {
    try {
      const res = await inventoryService.getInventorySummary();
      if (res.data?.success && res.data.data) {
        setSummaryStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load inventory summary', err);
    }
  };

  // Load Denominations for modal
  const loadDenominations = async () => {
    try {
      const res = await inventoryService.getDenominations();
      if (res.data?.success) {
        setDenominations(res.data.data);
        if (res.data.data.length > 0 && !batchForm.denominationId) {
          const first = res.data.data[0];
          setBatchForm((prev) => ({ 
            ...prev, 
            denominationId: first.id,
            availableUntil: first.availableUntil || getNextYearStr()
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load denominations', err);
    }
  };

  // Load paginated batches
  const loadBatches = useCallback(async (page = currentPage, search = debouncedSearch, size = pageSize) => {
    try {
      setLoading(true);
      const res = await inventoryService.getBatches({
        page,
        size,
        search: search ? search.trim() : undefined,
        status: 'AVAILABLE'
      });
      if (res.data?.success) {
        const pageData = res.data.data;
        setBatches(pageData.content || []);
        setTotalPages(pageData.totalPages || 1);
        setTotalElements(pageData.totalElements || 0);
      }
    } catch (err) {
      console.error('Failed to load batches', err);
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  }, [currentPage, debouncedSearch, pageSize, setPageLoading]);

  // Initial load
  useEffect(() => {
    loadDenominations();
    loadSummary();
  }, []);

  // Fetch batches when page, debounced search, or pageSize changes
  useEffect(() => {
    loadBatches(currentPage, debouncedSearch, pageSize);
  }, [currentPage, debouncedSearch, pageSize, loadBatches]);

  // Calculate quantity and validation status from serial range
  const calculateSerialQuantity = (start, end) => {
    if (!start || !end) return null;
    const s = start.trim();
    const e = end.trim();
    const regex = /^(.*?)(\d+)$/;
    const m1 = s.match(regex);
    const m2 = e.match(regex);

    if (!m1 || !m2) {
      return { valid: false, error: 'Serial numbers must end with numeric digits (e.g. 100001 or SN-100-0001)' };
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
      return { valid: false, error: 'Maximum 10,000 cards per addition' };
    }
    return { valid: true, count, prefix: m1[1] };
  };

  const selectedDenom = denominations.find(d => String(d.id) === String(batchForm.denominationId)) || denominations[0];
  const rangeCalculation = calculateSerialQuantity(batchForm.startSerialNumber, batchForm.endSerialNumber);

  const handleOpenAddModal = () => {
    setFormError('');
    const firstDenom = denominations[0];
    const code = firstDenom?.code || 'IPTSP-100';
    setBatchForm({
      denominationId: firstDenom?.id || '',
      startSerialNumber: `${code}-0001`,
      endSerialNumber: `${code}-0050`,
      availableUntil: firstDenom?.availableUntil || getNextYearStr(),
      notes: '',
    });
    setShowBatchModal(true);
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!batchForm.startSerialNumber || !batchForm.endSerialNumber) {
      setFormError('Please enter both Start and End Serial Numbers.');
      return;
    }

    const calc = calculateSerialQuantity(batchForm.startSerialNumber, batchForm.endSerialNumber);
    if (!calc || !calc.valid) {
      setFormError(calc?.error || 'Invalid serial range format.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await inventoryService.generateBatch({
        denominationId: Number(batchForm.denominationId),
        startSerialNumber: batchForm.startSerialNumber.trim(),
        endSerialNumber: batchForm.endSerialNumber.trim(),
        availableUntil: batchForm.availableUntil,
        notes: batchForm.notes,
      });

      if (res.data?.success) {
        setShowBatchModal(false);
        loadBatches(0, debouncedSearch);
        loadSummary();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add inventory.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSellBatch = (batch) => {
    navigate('/sales', {
      state: {
        openOrderModal: true,
        denominationId: batch.denominationId,
        startSerialNumber: batch.startSerialNumber,
        endSerialNumber: batch.endSerialNumber
      }
    });
  };

  const handleDeleteBatch = async (batch) => {
    const isSoldOrAllocated = (batch.soldCount || 0) > 0;
    if (isSoldOrAllocated) {
      alert(`Cannot delete inventory lot "${batch.batchNumber}" because ${batch.soldCount} card(s) have already been sold or allocated to orders.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete inventory lot "${batch.batchNumber}" (${batch.startSerialNumber} ~ ${batch.endSerialNumber})?\\n\\nThis will permanently delete all ${batch.quantity} cards from inventory.`)) {
      return;
    }

    try {
      const res = await inventoryService.deleteBatch(batch.id);
      if (res.data?.success) {
        loadBatches(currentPage, debouncedSearch);
        loadSummary();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete inventory lot.');
    }
  };

  // Export ALL matching values for the current search filter
  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const res = await inventoryService.getAllBatches({
        search: debouncedSearch ? debouncedSearch.trim() : undefined,
        status: 'AVAILABLE'
      });

      const exportBatches = res.data?.data || [];

      if (!exportBatches || exportBatches.length === 0) {
        alert('No available inventory lot data to export.');
        return;
      }

      const headers = [
        'Inventory Lot #',
        'Code',
        'Name',
        'Start Serial',
        'End Serial',
        'Quantity',
        'Wholesale Value',
        'Retail Value',
        'Added Time'
      ];

      const rows = exportBatches.map((b) => {
        const qty = b.inStockCount != null ? b.inStockCount : (b.quantity || 0);
        const wholesaleTotal = (Number(b.wholesalePrice || b.faceValue || 0) * qty).toFixed(2);
        const retailTotal = (Number(b.faceValue || b.retailPrice || 0) * qty).toFixed(2);
        return [
          `"${b.batchNumber || ''}"`,
          `"${b.denominationCode || 'IPTSP'}"`,
          `"${(b.denominationName || '').replace(/"/g, '""')}"`,
          `"${b.startSerialNumber || ''}"`,
          `"${b.endSerialNumber || ''}"`,
          qty,
          wholesaleTotal,
          retailTotal,
          `"${b.generatedAt ? formatDateYMDHM(b.generatedAt) : ''}"`
        ];
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const today = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `IPTSP_Available_Inventory_${today}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('Failed to export CSV', err);
      alert('Failed to download CSV.');
    } finally {
      setIsExporting(false);
    }
  };

  const totalBatches = summaryStats.totalLots || 0;
  const inStockCards = summaryStats.inStockCards || 0;
  const totalWholesaleValue = summaryStats.totalWholesaleValue || 0;
  const totalRetailValue = summaryStats.totalRetailValue || 0;

  return (
    <div className="space-y-6">
      {/* Inventory KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Available Lots"
          value={totalBatches.toString()}
          subtext="Active in-stock lots"
          icon={Layers}
          color="blue"
        />
        <StatCard
          title="Cards In Stock"
          value={inStockCards.toLocaleString()}
          subtext="Ready for sale"
          icon={Package}
          color="emerald"
        />
        <StatCard
          title="Wholesale Value"
          value={`৳${Number(totalWholesaleValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtext="Price in stock"
          icon={ShieldCheck}
          color="teal"
        />
        <StatCard
          title="Retail (MRP) Value"
          value={`৳${Number(totalRetailValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtext="Price in stock"
          icon={CheckCircle2}
          color="amber"
        />
      </div>

      {/* Inventory Details Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Inventory Details</h3>
              <p className="text-xs text-slate-400">Displaying only available stock</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportCsv}
              disabled={isExporting}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-white border border-slate-700/80 hover:border-teal-500/30 transition shadow-sm disabled:opacity-50"
              title="Download all filtered inventory batch details as CSV"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />
              ) : (
                <Download className="w-4 h-4 text-teal-400" />
              )}
              <span>{isExporting ? 'Exporting...' : 'Download CSV'}</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 hover:from-teal-300 hover:to-emerald-300 transition shadow-lg shadow-teal-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Inventory</span>
            </button>
          </div>
        </div>

        {/* Search filter toolbar */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search available inventory by Lot #, Card Name, Code, or Serial Number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold"
            >
              Clear
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5 text-center w-12">SL</th>
                <th className="p-3.5">Inventory Lot #</th>
                <th className="p-3.5">Code</th>
                <th className="p-3.5">Name</th>
                <th className="p-3.5">Start Serial</th>
                <th className="p-3.5">End Serial</th>
                <th className="p-3.5 text-center">Quantity</th>
                <th className="p-3.5 text-right">Wholesale</th>
                <th className="p-3.5 text-right">Retail</th>
                <th className="p-3.5 text-center">Added Time</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {batches.map((b, idx) => (
                <tr key={b.id} className="hover:bg-slate-800/30 transition">
                  <td className="p-3.5 text-center font-mono text-slate-400">
                    {(currentPage * pageSize) + idx + 1}
                  </td>
                  <td className="p-3.5 font-mono font-semibold text-white">
                    {b.batchNumber}
                  </td>
                  <td className="p-3.5">
                    <span className="px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-300 font-mono text-[10px] font-bold border border-teal-500/20">
                      {b.denominationCode || 'IPTSP'}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="font-semibold text-white">{b.denominationName}</span>
                    <span className="text-teal-400 font-mono text-[11px] ml-1.5">(৳{Number(b.faceValue).toFixed(0)})</span>
                  </td>
                  <td className="p-3.5 font-mono text-slate-300 font-medium">
                    {b.startSerialNumber || 'N/A'}
                  </td>
                  <td className="p-3.5 font-mono text-slate-300 font-medium">
                    {b.endSerialNumber || 'N/A'}
                  </td>
                  <td className="p-3.5 text-center font-bold text-teal-300">
                    <span className="px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/20">
                      {b.inStockCount != null ? b.inStockCount : b.quantity}
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-teal-400">
                    ৳{(Number(b.wholesalePrice || b.faceValue || 0) * (b.inStockCount != null ? b.inStockCount : b.quantity || 0)).toFixed(2)}
                  </td>
                  <td className="p-3.5 text-right font-mono font-semibold text-slate-200">
                    ৳{(Number(b.faceValue || b.retailPrice || 0) * (b.inStockCount != null ? b.inStockCount : b.quantity || 0)).toFixed(2)}
                  </td>
                  <td className="p-3.5 text-center text-slate-300 font-mono text-[11px]">
                    {formatDateYMDHM(b.generatedAt)}
                  </td>
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleSellBatch(b)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-teal-500/20 text-slate-400 hover:text-teal-300 border border-slate-700 hover:border-teal-500/30 transition shadow-sm"
                        title={`Sell Lot ${b.batchNumber} (Create Wholesale Order)`}
                      >
                        <ShoppingCart className="w-4 h-4 text-teal-400" />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteBatch(b)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/30 transition shadow-sm"
                          title="Delete Inventory Lot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {batches.length === 0 && !loading && (
                <tr>
                  <td colSpan="11" className="p-8 text-center text-slate-500">
                    {debouncedSearch ? 'No available inventory lots match your search query.' : 'No available card inventory found. Click "Add Inventory" to add card stock.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Backend Pagination Bar */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <div>
              {totalElements > 0 ? (
                <>
                  Showing <span className="text-white font-medium">{(currentPage * pageSize) + 1}</span> to{' '}
                  <span className="text-white font-medium">
                    {Math.min((currentPage + 1) * pageSize, totalElements)}
                  </span>{' '}
                  of <span className="text-white font-medium">{totalElements}</span> lots
                </>
              ) : (
                '0 lots available'
              )}
            </div>

            <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
              <span className="text-slate-400">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  const newSize = Number(e.target.value);
                  setPageSize(newSize);
                  setCurrentPage(0);
                }}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-teal-500 font-medium cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
              disabled={currentPage === 0 || loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-mono">
              Page <strong className="text-white font-semibold">{currentPage + 1}</strong> of{' '}
              <strong className="text-white font-semibold">{totalPages || 1}</strong>
            </span>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
              disabled={currentPage >= totalPages - 1 || loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Inventory Modal */}
      {showBatchModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4 sm:p-6">
          {/* Fullscreen Backdrop Overlay */}
          <div 
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity"
            onClick={() => setShowBatchModal(false)}
            aria-hidden="true"
          />

          {/* Modal Dialog Card */}
          <div className="relative bg-slate-900/85 backdrop-blur-xl border border-slate-700/70 rounded-3xl w-full max-w-lg p-6 shadow-2xl my-8 z-10 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-white mb-1">Add Card Inventory</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter serial number range to save serialized card inventory
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  1. Select Card Product <span className="text-teal-400">*</span>
                </label>
                <select
                  value={batchForm.denominationId}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const d = denominations.find(item => String(item.id) === String(selectedId));
                    const code = d?.code || 'IPTSP';
                    setBatchForm({ 
                      ...batchForm, 
                      denominationId: selectedId,
                      startSerialNumber: `${code}-0001`,
                      endSerialNumber: `${code}-0050`,
                      availableUntil: d?.availableUntil || batchForm.availableUntil
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  {denominations.map((d) => (
                    <option key={d.id} value={d.id}>
                      [{d.code || 'IPTSP'}] {d.name} (Retail: ৳{Number(d.retailPrice || d.faceValue).toFixed(0)}, Wholesale: ৳{Number(d.wholesalePrice || d.faceValue).toFixed(0)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Serial Range Inputs */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 uppercase flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-teal-400" />
                    Serialized Range
                  </span>
                  <span className="text-[11px] text-slate-400">e.g. 100001 ~ 100050</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Start Serial Number <span className="text-teal-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SN-100-0001"
                      value={batchForm.startSerialNumber}
                      onChange={(e) => setBatchForm({ ...batchForm, startSerialNumber: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      End Serial Number <span className="text-teal-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SN-100-0050"
                      value={batchForm.endSerialNumber}
                      onChange={(e) => setBatchForm({ ...batchForm, endSerialNumber: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Real-time Calculation Summary */}
                {rangeCalculation && (
                  <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                    rangeCalculation.valid
                      ? 'bg-teal-500/10 border-teal-500/30 text-teal-300'
                      : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}>
                    {rangeCalculation.valid ? (
                      <>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-teal-400" />
                          <span>
                            Total Cards: <strong>{rangeCalculation.count.toLocaleString()} units</strong>
                          </span>
                        </div>
                        {selectedDenom && (
                          <span className="font-mono font-bold text-white">
                            Total MRP: ৳{(rangeCalculation.count * Number(selectedDenom.retailPrice || selectedDenom.faceValue || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <span>{rangeCalculation.error}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  Available Until (Expiry Date) <span className="text-teal-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={batchForm.availableUntil}
                  onChange={(e) => setBatchForm({ ...batchForm, availableUntil: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  Inventory Notes (Optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Q3 Distribution Stock for Metro partners"
                  value={batchForm.notes}
                  onChange={(e) => setBatchForm({ ...batchForm, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || (rangeCalculation && !rangeCalculation.valid)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 text-xs font-bold hover:from-teal-300 hover:to-emerald-300 transition shadow-lg shadow-teal-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding Inventory...' : 'Add Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
