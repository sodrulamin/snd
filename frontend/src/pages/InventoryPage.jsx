import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  ShieldCheck, 
  Eye, 
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
  ArrowRight,
  Info
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { inventoryService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { usePageLoading } from '../context/PageLoadingContext';

export default function InventoryPage() {
  const { setPageLoading } = usePageLoading();
  const [denominations, setDenominations] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper for ISO Date string YYYY-MM-DD
  const getNextYearStr = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  };

  // Add Inventory Form State
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchCards, setBatchCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(false);

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

  const loadData = async () => {
    try {
      setLoading(true);
      const [denomsRes, batchesRes] = await Promise.all([
        inventoryService.getDenominations(),
        inventoryService.getBatches(),
      ]);
      if (denomsRes.data?.success) {
        setDenominations(denomsRes.data.data);
        if (denomsRes.data.data.length > 0 && !batchForm.denominationId) {
          const first = denomsRes.data.data[0];
          setBatchForm((prev) => ({ 
            ...prev, 
            denominationId: first.id,
            availableUntil: first.availableUntil || getNextYearStr()
          }));
        }
      }
      if (batchesRes.data?.success) setBatches(batchesRes.data.data);
    } catch (err) {
      console.error('Failed to load inventory data', err);
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
    const code = firstDenom?.code || 'VOIP-100';
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
        loadData();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add inventory.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBatch = async (batch) => {
    const isSoldOrAllocated = (batch.soldCount || 0) > 0;
    if (isSoldOrAllocated) {
      alert(`Cannot delete inventory lot "${batch.batchNumber}" because ${batch.soldCount} card(s) have already been sold or allocated to orders.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete inventory lot "${batch.batchNumber}" (${batch.startSerialNumber} ~ ${batch.endSerialNumber})?\n\nThis will permanently delete all ${batch.quantity} cards from inventory.`)) {
      return;
    }

    try {
      const res = await inventoryService.deleteBatch(batch.id);
      if (res.data?.success) {
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete inventory lot.');
    }
  };

  const handleInspectBatch = async (batch) => {
    setSelectedBatch(batch);
    try {
      setLoadingCards(true);
      const res = await inventoryService.searchCards({
        batchId: batch.id,
        size: 50,
        includePlainPin: true,
      });
      if (res.data?.success) {
        setBatchCards(res.data.data.content);
      }
    } catch (err) {
      console.error('Failed to load inventory cards', err);
    } finally {
      setLoadingCards(false);
    }
  };

  const totalBatches = batches.length;
  const inStockCards = batches.reduce((acc, b) => acc + (b.inStockCount || 0), 0);
  const totalSold = batches.reduce((acc, b) => acc + (b.soldCount || 0), 0);
  const totalStockValue = batches.reduce((acc, b) => acc + (Number(b.faceValue || 0) * (b.inStockCount || 0)), 0);

  return (
    <div className="space-y-6">
      {/* Inventory KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Inventory Entries"
          value={totalBatches.toString()}
          subtext="Total stock additions"
          icon={Layers}
          color="blue"
        />
        <StatCard
          title="Cards In Stock"
          value={inStockCards.toLocaleString()}
          subtext="Ready for distributor dispatch"
          icon={Package}
          color="emerald"
        />
        <StatCard
          title="Cards Distributed"
          value={totalSold.toLocaleString()}
          subtext="Allocated to partner orders"
          icon={CheckCircle2}
          color="teal"
        />
        <StatCard
          title="In-Stock Face Value"
          value={`৳${totalStockValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtext="Available inventory value"
          icon={ShieldCheck}
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
              <p className="text-xs text-slate-400">Sequential serial ranges, encrypted card stock counts, and availability</p>
            </div>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 hover:from-teal-300 hover:to-emerald-300 transition shadow-lg shadow-teal-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Inventory</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Inventory Lot #</th>
                <th className="p-3.5">Card Product & Code</th>
                <th className="p-3.5">Serial Range (Start ~ End)</th>
                <th className="p-3.5 text-center">Quantity</th>
                <th className="p-3.5 text-center">In Stock</th>
                <th className="p-3.5 text-center">Sold</th>
                <th className="p-3.5 text-right">Retail Value</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Available Until</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {batches.map((b) => (
                <tr key={b.id} className="hover:bg-slate-800/30 transition">
                  <td className="p-3.5 font-mono font-semibold text-white">
                    {b.batchNumber}
                  </td>
                  <td className="p-3.5">
                    <span className="px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-300 font-mono text-[10px] font-bold mr-1.5 border border-teal-500/20">
                      {b.denominationCode || 'VOIP'}
                    </span>
                    <span className="font-semibold text-white">{b.denominationName}</span>
                    <span className="text-teal-400 font-mono text-[11px] ml-1">(৳{Number(b.faceValue).toFixed(0)})</span>
                  </td>
                  <td className="p-3.5 font-mono">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 text-[10px] font-semibold border border-teal-500/20">
                      <Hash className="w-2.5 h-2.5 text-teal-400" />
                      {b.startSerialNumber && b.endSerialNumber ? `${b.startSerialNumber} ~ ${b.endSerialNumber}` : 'N/A'}
                    </span>
                  </td>
                  <td className="p-3.5 text-center font-bold text-slate-300">{b.quantity}</td>
                  <td className="p-3.5 text-center font-bold text-emerald-400">{b.inStockCount}</td>
                  <td className="p-3.5 text-center font-bold text-slate-400">{b.soldCount}</td>
                  <td className="p-3.5 text-right font-mono font-semibold text-slate-200">
                    ৳{Number(b.totalFaceValue).toFixed(2)}
                  </td>
                  <td className="p-3.5 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      b.status === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-400' :
                      b.status === 'PARTIALLY_SOLD' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-center text-slate-300 font-mono text-[11px]">
                    {b.expiryDate}
                  </td>
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleInspectBatch(b)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 transition"
                        title="Inspect Serialized Cards"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <a
                        href={inventoryService.exportCardsCsvUrl(b.id, null, true)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 transition"
                        title="Export Card Stock CSV"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteBatch(b)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/30 transition"
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
                  <td colSpan="10" className="p-8 text-center text-slate-500">
                    No card inventory found. Click "Add Inventory" to add card stock.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Inventory Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 shadow-2xl my-8">
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
                    const code = d?.code || 'VOIP';
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
                      [{d.code || 'VOIP'}] {d.name} (Retail: ৳{Number(d.retailPrice || d.faceValue).toFixed(0)}, Wholesale: ৳{Number(d.wholesalePrice || d.faceValue).toFixed(0)})
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
        </div>
      )}

      {/* Inspect Inventory Modal */}
      {selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">Inventory Serial Cards Inspection</h3>
                <p className="text-xs text-slate-400">
                  {selectedBatch.batchNumber} ([{selectedBatch.denominationCode}] {selectedBatch.denominationName} - ৳{Number(selectedBatch.faceValue).toFixed(0)} × {selectedBatch.quantity} Cards)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={inventoryService.exportCardsCsvUrl(selectedBatch.id, null, true)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/30"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Card Serials (CSV)
                </a>
                <button
                  onClick={() => setSelectedBatch(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 my-4">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold sticky top-0">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">Serial Number</th>
                    <th className="p-2.5 text-center">Status</th>
                    <th className="p-2.5">Allocated Distributor</th>
                    <th className="p-2.5">Order Number</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {batchCards.map((c, idx) => (
                    <tr key={c.id} className="hover:bg-slate-800/30">
                      <td className="p-2.5 text-slate-500">{idx + 1}</td>
                      <td className="p-2.5 font-mono font-bold text-teal-300">{c.serialNumber}</td>
                      <td className="p-2.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.status === 'IN_STOCK' ? 'bg-emerald-500/10 text-emerald-400' :
                          c.status === 'SOLD' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-300">{c.distributorName || '—'}</td>
                      <td className="p-2.5 font-mono text-slate-400">{c.orderNumber || '—'}</td>
                    </tr>
                  ))}
                  {batchCards.length === 0 && !loadingCards && (
                    <tr>
                      <td colSpan="5" className="p-6 text-center text-slate-500">No cards found in inventory lot.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
