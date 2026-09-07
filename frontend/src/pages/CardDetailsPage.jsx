import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Tag, 
  Edit2, 
  Trash2, 
  Search, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  CreditCard, 
  Sparkles, 
  TrendingUp, 
  Percent, 
  X, 
  Clock 
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { inventoryService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CardDetailsPage() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modal State for Create / Edit
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);

  // Delete Confirmation State
  const [deletingCard, setDeletingCard] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getNextYearStr = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  };

  const [form, setForm] = useState({
    code: '',
    name: '',
    retailPrice: '',
    wholesalePrice: '',
    availableFrom: getTodayStr(),
    availableUntil: getNextYearStr(),
    description: '',
    isActive: true,
  });

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isAdmin } = useAuth();

  const loadCards = async () => {
    try {
      setLoading(true);
      const res = await inventoryService.getDenominations();
      if (res.data?.success) {
        setCards(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load card definitions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, []);

  const handleOpenCreate = () => {
    setEditingCard(null);
    setForm({
      code: '',
      name: '',
      retailPrice: '',
      wholesalePrice: '',
      availableFrom: getTodayStr(),
      availableUntil: getNextYearStr(),
      description: '',
      isActive: true,
    });
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEdit = (card) => {
    setEditingCard(card);
    setForm({
      code: card.code || '',
      name: card.name || '',
      retailPrice: card.retailPrice || card.faceValue || '',
      wholesalePrice: card.wholesalePrice || card.retailPrice || card.faceValue || '',
      availableFrom: card.availableFrom || getTodayStr(),
      availableUntil: card.availableUntil || getNextYearStr(),
      description: card.description || '',
      isActive: card.isActive ?? true,
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.code || !form.name || !form.retailPrice || !form.wholesalePrice) {
      setFormError('Please fill in all required fields (Code, Name, Retailer Price, Wholesale Price)');
      return;
    }

    if (!form.availableFrom || !form.availableUntil) {
      setFormError('Please specify Available From and Available Until dates');
      return;
    }

    if (new Date(form.availableUntil) < new Date(form.availableFrom)) {
      setFormError('Available Until date cannot be before Available From date');
      return;
    }

    const retail = parseFloat(form.retailPrice);
    const wholesale = parseFloat(form.wholesalePrice);

    if (isNaN(retail) || retail <= 0) {
      setFormError('Retailer price must be a valid positive number');
      return;
    }

    if (isNaN(wholesale) || wholesale <= 0) {
      setFormError('Wholesale price must be a valid positive number');
      return;
    }

    if (wholesale > retail) {
      setFormError('Wholesale price cannot be greater than retailer price');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        retailPrice: retail,
        wholesalePrice: wholesale,
        faceValue: retail,
        availableFrom: form.availableFrom,
        availableUntil: form.availableUntil,
        description: form.description,
        isActive: form.isActive,
      };

      if (editingCard) {
        const res = await inventoryService.updateDenomination(editingCard.id, payload);
        if (res.data?.success) {
          setShowModal(false);
          loadCards();
        }
      } else {
        const res = await inventoryService.createDenomination(payload);
        if (res.data?.success) {
          setShowModal(false);
          loadCards();
        }
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save card product details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCard) return;
    setDeleteError('');
    setIsDeleting(true);

    try {
      const res = await inventoryService.deleteDenomination(deletingCard.id);
      if (res.data?.success) {
        setDeletingCard(null);
        loadCards();
      }
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete card product.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCards = cards.filter((c) => {
    const matchesSearch = 
      (c.code && c.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.name && c.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = 
      filterStatus === 'ALL' ||
      (filterStatus === 'ACTIVE' && c.isActive) ||
      (filterStatus === 'INACTIVE' && !c.isActive);

    return matchesSearch && matchesStatus;
  });

  const totalCards = cards.length;
  const activeCards = cards.filter(c => c.isActive).length;
  const avgRetailPrice = totalCards > 0 
    ? (cards.reduce((acc, c) => acc + Number(c.retailPrice || c.faceValue || 0), 0) / totalCards).toFixed(2)
    : '0.00';
  const avgMargin = totalCards > 0
    ? (cards.reduce((acc, c) => {
        const r = Number(c.retailPrice || c.faceValue || 0);
        const w = Number(c.wholesalePrice || r);
        return acc + (r > 0 ? ((r - w) / r) * 100 : 0);
      }, 0) / totalCards).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Card Products"
          value={totalCards.toString()}
          subtext="Defined card denominations"
          icon={Tag}
          color="blue"
        />
        <StatCard
          title="Active Plans"
          value={activeCards.toString()}
          subtext="Ready for distribution"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Average Retail Price"
          value={`৳${avgRetailPrice}`}
          subtext="Across all product lines"
          icon={CreditCard}
          color="teal"
        />
        <StatCard
          title="Average Retailer Margin"
          value={`${avgMargin}%`}
          subtext="Distributor wholesale margin"
          icon={Percent}
          color="amber"
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Unique Code, Card Name, or Description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            New Card
          </button>
        </div>
      </div>

      {/* Card Details Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-teal-400" />
            <h3 className="font-bold text-white text-sm">Card Details</h3>
            <span className="text-xs text-slate-400 ml-2">({filteredCards.length} card products)</span>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 hover:from-teal-300 hover:to-emerald-300 transition shadow-lg shadow-teal-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Card</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5 text-center w-12">SL</th>
                <th className="p-3.5">Unique Code</th>
                <th className="p-3.5">Card Product Name</th>
                <th className="p-3.5 text-right">Retail Price (MRP)</th>
                <th className="p-3.5 text-right">Wholesale Price</th>
                <th className="p-3.5 text-center">Distributor Margin</th>
                <th className="p-3.5">Available From</th>
                <th className="p-3.5">Available Until</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCards.map((c, index) => {
                const retail = Number(c.retailPrice || c.faceValue || 0);
                const wholesale = Number(c.wholesalePrice || retail);
                const margin = retail > 0 ? (((retail - wholesale) / retail) * 100).toFixed(1) : '0.0';

                return (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition">
                    <td className="p-3.5 text-center font-mono text-slate-400 font-semibold">
                      {index + 1}
                    </td>
                    <td className="p-3.5 font-mono">
                      <span className="px-2 py-0.5 rounded bg-teal-500/15 text-teal-300 font-black text-[11px] border border-teal-500/30">
                        {c.code || `VOIP-${retail}`}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-white text-sm">{c.name}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{c.description || 'VoIP Recharge Card'}</p>
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-white text-sm">
                      ৳{retail.toFixed(2)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-teal-400 text-sm">
                      ৳{wholesale.toFixed(2)}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-400">
                        {margin}% (৳{(retail - wholesale).toFixed(2)})
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-teal-400" />
                        <span>{c.availableFrom || '—'}</span>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{c.availableUntil || '—'}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {c.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-white text-xs font-semibold transition border border-slate-700"
                          title="Edit Card Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => {
                            setDeletingCard(c);
                            setDeleteError('');
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-semibold transition border border-red-500/20"
                          title="Delete Card Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredCards.length === 0 && !loading && (
                <tr>
                  <td colSpan="10" className="p-8 text-center text-slate-500">
                    No card products found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Card Definition Modal (Create / Edit) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingCard ? 'Update Card Details' : 'Create New Card Product'}
                </h3>
                <p className="text-xs text-slate-400">
                  Configure card unique code, title, retail pricing (MRP), wholesale cost, and date window
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                    1. Unique Code <span className="text-teal-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VOIP-100"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                    2. Card Name <span className="text-teal-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VoIP Standard ৳100"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                    3. Retailer Price (৳) <span className="text-teal-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="100.00"
                    value={form.retailPrice}
                    onChange={(e) => setForm({ ...form, retailPrice: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                    4. Wholesale Price (৳) <span className="text-teal-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="90.00"
                    value={form.wholesalePrice}
                    onChange={(e) => setForm({ ...form, wholesalePrice: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 font-mono text-teal-400 font-bold"
                  />
                </div>
              </div>

              {/* Date Window */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-teal-400" />
                    <span>Available From <span className="text-teal-400">*</span></span>
                  </label>
                  <input
                    type="date"
                    required
                    value={form.availableFrom}
                    onChange={(e) => setForm({ ...form, availableFrom: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Available Until <span className="text-teal-400">*</span></span>
                  </label>
                  <input
                    type="date"
                    required
                    value={form.availableUntil}
                    onChange={(e) => setForm({ ...form, availableUntil: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">Description / Plan Details</label>
                <textarea
                  rows="2"
                  placeholder="e.g. 500 VoIP international minutes voucher"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-500 focus:ring-teal-400 bg-slate-950 border-slate-800"
                  />
                  <span className="text-xs font-semibold text-slate-200">Active for Distribution</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 text-xs font-bold hover:from-teal-300 hover:to-emerald-300 transition shadow-lg shadow-teal-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving Card...' : editingCard ? 'Save Changes' : 'Create Card Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-red-500/30 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Card Product</h3>
                <p className="text-xs text-slate-400">Are you sure you want to permanently delete this card?</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 mb-4 text-xs space-y-1 font-mono">
              <p className="text-slate-300">Code: <strong className="text-teal-400">[{deletingCard.code}]</strong></p>
              <p className="text-slate-300">Name: <strong className="text-white">{deletingCard.name}</strong></p>
              <p className="text-slate-300">Retailer MRP: <strong className="text-emerald-400">৳{Number(deletingCard.retailPrice || deletingCard.faceValue).toFixed(2)}</strong></p>
            </div>

            {deleteError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingCard(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition shadow-lg shadow-red-500/20 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Card'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}