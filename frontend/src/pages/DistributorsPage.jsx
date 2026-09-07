import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  CreditCard, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  DollarSign, 
  History, 
  Edit, 
  ArrowUpRight, 
  ArrowDownLeft,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Power
} from 'lucide-react';
import { distributorService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { usePageLoading } from '../context/PageLoadingContext';

export default function DistributorsPage() {
  const { setPageLoading } = usePageLoading();
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [selectedDistributor, setSelectedDistributor] = useState(null);
  const [transactions, setTransactions] = useState([]);

  // Deletion State
  const [deletingDistributor, setDeletingDistributor] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Forms
  const [distForm, setDistForm] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phone: '',
    creditLimit: '5000',
    discountRate: '5.0',
    address: '',
    status: 'ACTIVE',
  });

  const [walletForm, setWalletForm] = useState({
    amount: '',
    transactionType: 'CREDIT',
    referenceType: 'BANK_TRANSFER',
    referenceId: '',
    notes: '',
  });

  const { isAdmin } = useAuth();

  const loadDistributors = async () => {
    try {
      setLoading(true);
      const res = await distributorService.getAll();
      if (res.data?.success) {
        setDistributors(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load distributors', err);
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  useEffect(() => {
    loadDistributors();
  }, []);

  const handleOpenWalletModal = (dist) => {
    setSelectedDistributor(dist);
    setWalletForm({
      amount: '',
      transactionType: 'CREDIT',
      referenceType: 'BANK_TRANSFER',
      referenceId: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
      notes: 'Balance top-up / credit advance',
    });
    setShowWalletModal(true);
  };

  const handleOpenLedgerModal = async (dist) => {
    setSelectedDistributor(dist);
    setShowLedgerModal(true);
    try {
      const res = await distributorService.getTransactions(dist.id, { size: 50 });
      if (res.data?.success) {
        setTransactions(res.data.data.content);
      }
    } catch (err) {
      console.error('Failed to load transactions', err);
    }
  };

  const handleCreateDistributor = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...distForm,
        creditLimit: parseFloat(distForm.creditLimit) || 0,
        discountRate: parseFloat(distForm.discountRate) || 0,
      };
      const res = await distributorService.create(payload);
      if (res.data?.success) {
        setShowAddModal(false);
        setDistForm({ username: '', password: '', fullName: '', email: '', phone: '', creditLimit: '5000', discountRate: '5.0', address: '', status: 'ACTIVE' });
        await loadDistributors();
        alert('Distributor created successfully!');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating distributor');
    }
  };

  const handleWalletSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        distributorId: selectedDistributor.id,
        amount: parseFloat(walletForm.amount),
        transactionType: walletForm.transactionType,
        referenceType: walletForm.referenceType,
        referenceId: walletForm.referenceId,
        notes: walletForm.notes,
      };
      const res = await distributorService.walletAdjustment(payload);
      if (res.data?.success) {
        setShowWalletModal(false);
        await loadDistributors();
        alert('Wallet transaction processed!');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing wallet adjustment');
    }
  };
  const handleToggleStatus = async (dist) => {
    const isCurrentlyActive = dist.status === 'ACTIVE';
    const confirmMsg = isCurrentlyActive
      ? `Are you sure you want to disable distributor "${dist.fullName}" (@${dist.username})?\n\nThey will be blocked from logging in or receiving new wholesale sales orders until re-enabled.`
      : `Are you sure you want to activate distributor "${dist.fullName}" (@${dist.username})?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await distributorService.toggleStatus(dist.id);
      if (res.data?.success) {
        await loadDistributors();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update distributor status');
    }
  };

  const handleOpenDeleteModal = (dist) => {
    setDeletingDistributor(dist);
    setDeleteError('');
  };

  const handleDeleteDistributor = async () => {
    if (!deletingDistributor) return;
    try {
      setIsDeleting(true);
      setDeleteError('');
      const res = await distributorService.delete(deletingDistributor.id);
      if (res.data?.success) {
        setDeletingDistributor(null);
        await loadDistributors();
      }
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete distributor.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white">Registered Distribution Partners</h3>
          <p className="text-xs text-slate-400">Total {distributors.length} partners in your network</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 transition"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Register Distributor
          </button>
        )}
      </div>

      {/* Distributors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {distributors.map((d) => (
          <div key={d.id} className={`rounded-2xl bg-slate-900/80 border p-6 flex flex-col justify-between transition-all group ${
            d.status === 'ACTIVE' ? 'border-slate-800 hover:border-teal-500/40' : 'border-amber-500/30 bg-slate-900/50 opacity-90'
          }`}>
            <div>
              {/* Partner Card Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center font-bold text-lg ${
                    d.status === 'ACTIVE' 
                      ? 'bg-gradient-to-tr from-teal-500/20 to-emerald-500/10 border-teal-500/30 text-teal-300'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  }`}>
                    {d.fullName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base group-hover:text-teal-300 transition">{d.fullName}</h4>
                    <p className="text-xs text-slate-400 font-mono">@{d.username}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  d.status === 'ACTIVE'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${d.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                  {d.status === 'ACTIVE' ? 'ACTIVE' : 'DISABLED'}
                </span>
              </div>

              {/* Financial Box */}
              <div className="grid grid-cols-2 gap-2 mt-5 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div>
                  <p className="text-[11px] text-slate-400">Current Balance</p>
                  <p className={`text-lg font-mono font-black ${d.balance >= 0 ? 'text-teal-400' : 'text-red-400'}`}>
                    ৳{Number(d.balance).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">Credit Limit</p>
                  <p className="text-lg font-mono font-bold text-white">৳{Number(d.creditLimit).toFixed(2)}</p>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Discount Tier: <strong className="text-emerald-400 font-bold">{d.discountRate}%</strong></span>
                  <span className="text-slate-400">Orders: <strong className="text-white">{d.totalOrdersCount || 0}</strong></span>
                </div>
              </div>

              {/* Contact details */}
              <div className="mt-4 space-y-1 text-xs text-slate-400">
                {d.email && <div className="flex items-center gap-2 truncate"><Mail className="w-3.5 h-3.5 text-slate-500" /> <span>{d.email}</span></div>}
                {d.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-500" /> <span>{d.phone}</span></div>}
                {d.address && <div className="flex items-center gap-2 truncate"><MapPin className="w-3.5 h-3.5 text-slate-500" /> <span>{d.address}</span></div>}
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-2">
              <button
                onClick={() => handleOpenWalletModal(d)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 font-semibold text-xs border border-teal-500/30 transition"
              >
                <DollarSign className="w-3.5 h-3.5" />
                Deposit / Top-up
              </button>
              <button
                onClick={() => handleOpenLedgerModal(d)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                title="View Ledger History"
              >
                <History className="w-4 h-4" />
              </button>
              {isAdmin && (
                <>
                  <button
                    onClick={() => handleToggleStatus(d)}
                    className={`p-2 rounded-xl border transition ${
                      d.status === 'ACTIVE'
                        ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20 hover:border-amber-500/40'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20 hover:border-emerald-500/40'
                    }`}
                    title={d.status === 'ACTIVE' ? 'Disable Distributor' : 'Activate Distributor'}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenDeleteModal(d)}
                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 transition"
                    title="Delete Distributor"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Register Distributor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Register New Distributor</h3>
            <p className="text-xs text-slate-400 mb-5">Create a partner account for wholesale recharge card purchases</p>

            <form onSubmit={handleCreateDistributor} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. dist_fastcall"
                    value={distForm.username}
                    onChange={(e) => setDistForm({ ...distForm, username: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Password</label>
                  <input
                    type="password"
                    placeholder="Default: dist123"
                    value={distForm.password}
                    onChange={(e) => setDistForm({ ...distForm, password: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Company / Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FastCall Communications Ltd."
                  value={distForm.fullName}
                  onChange={(e) => setDistForm({ ...distForm, fullName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="sales@fastcall.io"
                    value={distForm.email}
                    onChange={(e) => setDistForm({ ...distForm, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+1 555-0199"
                    value={distForm.phone}
                    onChange={(e) => setDistForm({ ...distForm, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Credit Limit (৳)</label>
                  <input
                    type="number"
                    min="0"
                    value={distForm.creditLimit}
                    onChange={(e) => setDistForm({ ...distForm, creditLimit: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Discount Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={distForm.discountRate}
                    onChange={(e) => setDistForm({ ...distForm, discountRate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Office Address</label>
                <textarea
                  rows="2"
                  placeholder="Street, City, Country"
                  value={distForm.address}
                  onChange={(e) => setDistForm({ ...distForm, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 text-xs font-bold shadow-md shadow-teal-500/20"
                >
                  Save Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Wallet Deposit / Adjustment Modal */}
      {showWalletModal && selectedDistributor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Wallet Top-up & Settlement</h3>
            <p className="text-xs text-slate-400 mb-4">
              Partner: <strong className="text-white">{selectedDistributor.fullName}</strong>
            </p>

            <form onSubmit={handleWalletSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Type</label>
                  <select
                    value={walletForm.transactionType}
                    onChange={(e) => setWalletForm({ ...walletForm, transactionType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="CREDIT">Deposit (Credit +)</option>
                    <option value="DEBIT">Deduct (Debit -)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Amount (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="1000.00"
                    value={walletForm.amount}
                    onChange={(e) => setWalletForm({ ...walletForm, amount: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Payment Channel</label>
                  <select
                    value={walletForm.referenceType}
                    onChange={(e) => setWalletForm({ ...walletForm, referenceType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="BANK_TRANSFER">Bank Wire / ACH</option>
                    <option value="CASH_DEPOSIT">Cash Deposit</option>
                    <option value="CHEQUE">Cheque Clearance</option>
                    <option value="MANUAL_ADJUSTMENT">Manual Adjustment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Ref ID / TXN #</label>
                  <input
                    type="text"
                    value={walletForm.referenceId}
                    onChange={(e) => setWalletForm({ ...walletForm, referenceId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Ledger Notes</label>
                <textarea
                  rows="2"
                  value={walletForm.notes}
                  onChange={(e) => setWalletForm({ ...walletForm, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowWalletModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-500 text-slate-950 text-xs font-bold"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ledger History Modal */}
      {showLedgerModal && selectedDistributor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">Distributor Financial Ledger</h3>
                <p className="text-xs text-slate-400">{selectedDistributor.fullName} (Current Bal: ৳{Number(selectedDistributor.balance).toFixed(2)})</p>
              </div>
              <button onClick={() => setShowLedgerModal(false)} className="text-slate-400 hover:text-white text-sm font-semibold">✕</button>
            </div>

            <div className="overflow-y-auto flex-1 my-4">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold sticky top-0">
                  <tr>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5 text-right">Amount</th>
                    <th className="p-2.5 text-right">Prev Bal</th>
                    <th className="p-2.5 text-right">New Bal</th>
                    <th className="p-2.5">Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/30">
                      <td className="p-2.5 text-slate-400 font-mono text-[11px]">
                        {new Date(t.createdAt).toLocaleDateString()} {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-2.5 font-semibold">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          t.transactionType === 'CREDIT' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {t.transactionType}
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-white">
                        ৳{Number(t.amount).toFixed(2)}
                      </td>
                      <td className="p-2.5 text-right font-mono text-slate-400">৳{Number(t.previousBalance).toFixed(2)}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-teal-400">৳{Number(t.newBalance).toFixed(2)}</td>
                      <td className="p-2.5 font-mono text-[11px] text-slate-300">{t.referenceId || t.referenceType}</td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan="6" className="p-6 text-center text-slate-500">No ledger entries for this distributor yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowLedgerModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Distributor Confirmation Modal */}
      {deletingDistributor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-red-500/30 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Distributor</h3>
                <p className="text-xs text-slate-400">Are you sure you want to delete this partner account?</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 mb-4 text-xs space-y-1.5 font-mono">
              <p className="text-slate-300">Name: <strong className="text-white">{deletingDistributor.fullName}</strong></p>
              <p className="text-slate-300">Username: <strong className="text-teal-400">@{deletingDistributor.username}</strong></p>
              <p className="text-slate-300">Wallet Balance: <strong className="text-emerald-400">৳{Number(deletingDistributor.balance).toFixed(2)}</strong></p>
              <p className="text-slate-300">Total Orders: <strong className="text-white">{deletingDistributor.totalOrdersCount || 0}</strong></p>
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
                onClick={() => setDeletingDistributor(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteDistributor}
                className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? 'Deleting...' : 'Delete Distributor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}