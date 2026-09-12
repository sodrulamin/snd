import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { 
  Megaphone, 
  Plus, 
  Search, 
  Filter, 
  RotateCcw, 
  Calendar, 
  DollarSign, 
  Layers, 
  FileText, 
  Printer, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Building2, 
  Tag, 
  Eye, 
  ExternalLink,
  Gift,
  Wrench,
  Sparkles,
  TrendingDown,
  Info,
  Pencil
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { campaignService, inventoryService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { usePageLoading } from '../context/PageLoadingContext';

const PURPOSE_CATEGORIES = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'CAMPAIGN', label: 'Marketing Campaign', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
  { value: 'INTERNAL_USE', label: 'Internal Office Use', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  { value: 'TESTING', label: 'QA / Technical Testing', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
  { value: 'COMPLIMENTARY', label: 'VIP / Complimentary', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  { value: 'PROMOTION', label: 'Sales Promotion', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  { value: 'OTHER', label: 'Other Purpose', color: 'bg-slate-500/10 text-slate-400 border-slate-500/30' },
];

export default function CampaignExpensesPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { setPageLoading } = usePageLoading();
  const { isAdmin } = useAuth();

  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [denominations, setDenominations] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filtering
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Modals
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit' | 'view'
  const [editingCampaign, setEditingCampaign] = useState(null);

  // Unified Campaign Form State (Used for both Create and Edit)
  const [formCampaignName, setFormCampaignName] = useState('');
  const [formCategory, setFormCategory] = useState('CAMPAIGN');
  const [formReferenceNo, setFormReferenceNo] = useState('');
  const [formStartDate, setFormStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formEndDate, setFormEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [formBeneficiaryDept, setFormBeneficiaryDept] = useState('');
  const [formDisbursedAt, setFormDisbursedAt] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [existingItems, setExistingItems] = useState([]);
  const [formItems, setFormItems] = useState([
    { denominationId: '', startSerialNumber: '', endSerialNumber: '', notes: '' }
  ]);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);



  // Load Denominations & Available Batches for Creation Form
  const loadInventoryOptions = async () => {
    try {
      const [denomsRes, batchesRes] = await Promise.all([
        inventoryService.getActiveDenominations(),
        inventoryService.getAllBatches()
      ]);
      if (denomsRes.data?.success) setDenominations(denomsRes.data.data);
      if (batchesRes.data?.success) setBatches(batchesRes.data.data);
      return { denoms: denomsRes.data?.data || [], batches: batchesRes.data?.data || [] };
    } catch (err) {
      console.error('Failed to load inventory options', err);
      return { denoms: [], batches: [] };
    }
  };

  // Load Campaign Expenses & Calculation Summary
  const fetchData = async (targetPage = page) => {
    try {
      setLoading(true);
      setPageLoading(true);

      const params = {
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: searchQuery.trim() || undefined,
        page: targetPage,
        size: pageSize,
      };

      const [listRes, summaryRes] = await Promise.all([
        campaignService.getCampaigns(params),
        campaignService.getCalculationSummary({
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        })
      ]);

      if (listRes.data?.success) {
        setExpenses(listRes.data.data.content || []);
        setTotalPages(listRes.data.data.totalPages || 0);
        setTotalElements(listRes.data.data.totalElements || 0);
        setPage(targetPage);
      }

      if (summaryRes.data?.success) {
        setSummary(summaryRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load campaigns data', err);
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  // Open Create Modal & Pre-fill
  const handleOpenCreateModal = (prefill = null) => {
    setModalMode('create');
    setEditingCampaign(null);
    setFormCampaignName(prefill?.campaignName || '');
    setFormCategory(prefill?.category || 'CAMPAIGN');
    const now = new Date();
    setFormStartDate(prefill?.startDate || now.toISOString().split('T')[0]);
    const defaultEnd = new Date();
    defaultEnd.setDate(now.getDate() + 30);
    setFormEndDate(prefill?.endDate || defaultEnd.toISOString().split('T')[0]);
    setFormReferenceNo('');
    setFormBeneficiaryDept(prefill?.beneficiaryDept || '');
    setFormDisbursedAt('');
    setFormNotes('');
    setExistingItems([]);
    setFormError('');

    if (prefill?.denominationId && prefill?.startSerialNumber && prefill?.endSerialNumber) {
      setFormItems([
        {
          denominationId: String(prefill.denominationId),
          startSerialNumber: prefill.startSerialNumber,
          endSerialNumber: prefill.endSerialNumber,
          notes: ''
        }
      ]);
    } else {
      setFormItems([]);
    }
    setShowCampaignModal(true);
  };

  useEffect(() => {
    fetchData(0);
    loadInventoryOptions().then(({ denoms, batches }) => {
      const navState = location.state;
      const action = searchParams.get('action');
      if (navState?.openCreateModal || action === 'new') {
        const prefill = {
          denominationId: navState?.denominationId || searchParams.get('denominationId'),
          startSerialNumber: navState?.startSerialNumber || searchParams.get('startSerialNumber'),
          endSerialNumber: navState?.endSerialNumber || searchParams.get('endSerialNumber'),
          campaignName: navState?.campaignName || searchParams.get('campaignName'),
          category: navState?.category || searchParams.get('category') || 'CAMPAIGN'
        };
        handleOpenCreateModal(prefill);
      }
    });
  }, [location.state]);

  const handleApplyFilter = (e) => {
    if (e) e.preventDefault();
    fetchData(0);
  };

  const handleResetFilter = () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    setSearchQuery('');
    setSelectedCategory('ALL');
    setStartDate(monthStart);
    setEndDate(today);
    setTimeout(() => {
      fetchData(0);
    }, 0);
  };



  // Serial Range Calculator & Stock Verification
  const calculateItemRange = (start, end, denomId) => {
    if (!start || !end) return null;
    const s = String(start).trim();
    const e = String(end).trim();
    if (!s || !e) return null;

    const regex = /^(.*?)(\d+)$/;
    const m1 = s.match(regex);
    const m2 = e.match(regex);

    if (!m1 || !m2) {
      return { valid: false, error: 'Serials must end with numeric digits (e.g. 100001)' };
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

    // Verify against available stock lots
    if (denomId && batches && batches.length > 0) {
      const denomBatches = batches.filter(b => String(b.denominationId) === String(denomId));
      if (denomBatches.length > 0) {
        const matchingBatch = denomBatches.find(b => {
          if (!b.startSerialNumber || !b.endSerialNumber) return false;
          const bM1 = b.startSerialNumber.trim().match(regex);
          const bM2 = b.endSerialNumber.trim().match(regex);
          if (!bM1 || !bM2 || bM1[1] !== bM2[1] || bM1[1] !== m1[1]) return false;
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
              ? `Range outside available inventory stock (${availableRanges})`
              : 'Range outside available inventory stock for this product'
          };
        }
      }
    }

    return { valid: true, count, prefix: m1[1] };
  };

  const handleAddItemRow = () => {
    const defaultDenomId = denominations[0]?.id || '';
    const matchingBatch = batches.find(b => String(b.denominationId) === String(defaultDenomId) && b.startSerialNumber && b.endSerialNumber);
    setFormItems([
      ...formItems,
      {
        denominationId: defaultDenomId,
        startSerialNumber: matchingBatch ? matchingBatch.startSerialNumber : '',
        endSerialNumber: matchingBatch ? matchingBatch.endSerialNumber : '',
        notes: ''
      }
    ]);
  };

  const handleRemoveItemRow = (idx) => {
    setFormItems(formItems.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, val) => {
    const updated = [...formItems];
    if (field === 'denominationId') {
      const denomBatch = batches.find(b => String(b.denominationId) === String(val) && b.startSerialNumber && b.endSerialNumber);
      updated[idx] = {
        ...updated[idx],
        denominationId: val,
        startSerialNumber: denomBatch ? denomBatch.startSerialNumber : '',
        endSerialNumber: denomBatch ? denomBatch.endSerialNumber : '',
      };
      setFormItems(updated);
      return;
    }
    updated[idx][field] = val;
    setFormItems(updated);
  };

  // Live stats calculation for the unified campaign modal
  const existingCalculatedStats = (existingItems || []).reduce((acc, item) => ({
    totalCards: acc.totalCards + (item.quantity || 0),
    totalWholesale: acc.totalWholesale + Number(item.subtotalWholesaleCost || 0),
    totalFace: acc.totalFace + Number(item.subtotalFaceValue || 0),
  }), { totalCards: 0, totalWholesale: 0, totalFace: 0 });

  const newItemsCalculatedStats = formItems.reduce((acc, item) => {
    const denom = denominations.find(d => String(d.id) === String(item.denominationId));
    const range = calculateItemRange(item.startSerialNumber, item.endSerialNumber, item.denominationId);
    const qty = range && range.valid ? range.count : 0;
    const unitWholesale = denom ? Number(denom.wholesalePrice != null ? denom.wholesalePrice : (denom.retailPrice || denom.faceValue || 0)) : 0;
    const unitFace = denom ? Number(denom.retailPrice != null ? denom.retailPrice : (denom.faceValue || 0)) : 0;

    return {
      totalCards: acc.totalCards + qty,
      totalWholesale: acc.totalWholesale + (qty * unitWholesale),
      totalFace: acc.totalFace + (qty * unitFace),
    };
  }, { totalCards: 0, totalWholesale: 0, totalFace: 0 });

  const modalCombinedStats = {
    totalCards: existingItems.length > 0
      ? existingCalculatedStats.totalCards + newItemsCalculatedStats.totalCards
      : (editingCampaign?.totalCardsCount || 0) + newItemsCalculatedStats.totalCards,
    totalWholesale: existingItems.length > 0
      ? existingCalculatedStats.totalWholesale + newItemsCalculatedStats.totalWholesale
      : Number(editingCampaign?.totalWholesaleCost || 0) + newItemsCalculatedStats.totalWholesale,
    totalFace: existingItems.length > 0
      ? existingCalculatedStats.totalFace + newItemsCalculatedStats.totalFace
      : Number(editingCampaign?.totalFaceValue || 0) + newItemsCalculatedStats.totalFace,
  };

  // Open Edit Modal & Pre-fill
  const handleOpenEditModal = async (campaign) => {
    setModalMode('edit');
    setEditingCampaign(campaign);
    setFormCampaignName(campaign.campaignName || '');
    setFormCategory(campaign.purposeCategory || 'CAMPAIGN');
    setFormReferenceNo(campaign.referenceNo || '');
    setFormStartDate(campaign.startDate || '');
    setFormEndDate(campaign.endDate || '');
    setFormBeneficiaryDept(campaign.beneficiaryDept || '');
    setFormDisbursedAt(campaign.disbursedAt ? campaign.disbursedAt.substring(0, 16) : '');
    setFormNotes(campaign.notes || '');
    setExistingItems(campaign.items || []);
    setFormItems([]);
    setFormError('');
    setShowCampaignModal(true);

    try {
      const res = await campaignService.getCampaignById(campaign.id);
      if (res.data?.success) {
        setEditingCampaign(res.data.data);
        setExistingItems(res.data.data.items || []);
      }
    } catch (err) {
      console.error('Failed to load campaign items for edit', err);
    }
  };

  // Open View Modal (Uses the same unified modal in read-only mode)
  const handleOpenViewModal = async (campaignOrId) => {
    const campaignId = typeof campaignOrId === 'object' ? campaignOrId.id : campaignOrId;
    const initialCampaign = typeof campaignOrId === 'object' ? campaignOrId : null;

    setModalMode('view');
    setEditingCampaign(initialCampaign);
    setFormCampaignName(initialCampaign?.campaignName || '');
    setFormCategory(initialCampaign?.purposeCategory || 'CAMPAIGN');
    setFormReferenceNo(initialCampaign?.referenceNo || '');
    setFormStartDate(initialCampaign?.startDate || '');
    setFormEndDate(initialCampaign?.endDate || '');
    setFormBeneficiaryDept(initialCampaign?.beneficiaryDept || '');
    setFormDisbursedAt(initialCampaign?.disbursedAt ? initialCampaign.disbursedAt.substring(0, 16) : '');
    setFormNotes(initialCampaign?.notes || '');
    setExistingItems(initialCampaign?.items || []);
    setFormItems([]);
    setFormError('');
    setShowCampaignModal(true);

    if (campaignId) {
      try {
        const res = await campaignService.getCampaignById(campaignId);
        if (res.data?.success) {
          const data = res.data.data;
          setEditingCampaign(data);
          setFormCampaignName(data.campaignName || '');
          setFormCategory(data.purposeCategory || 'CAMPAIGN');
          setFormReferenceNo(data.referenceNo || '');
          setFormStartDate(data.startDate || '');
          setFormEndDate(data.endDate || '');
          setFormBeneficiaryDept(data.beneficiaryDept || '');
          setFormDisbursedAt(data.disbursedAt ? data.disbursedAt.substring(0, 16) : '');
          setFormNotes(data.notes || '');
          setExistingItems(data.items || []);
        }
      } catch (err) {
        console.error('Failed to load campaign details for view', err);
      }
    }
  };

  const handleViewVoucher = handleOpenViewModal;

  const handleCampaignFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formCampaignName.trim()) {
      setFormError('Please enter a Campaign Name');
      return;
    }

    if (!formStartDate) {
      setFormError('Campaign start date is required');
      return;
    }

    if (!formEndDate) {
      setFormError('Campaign end date is required');
      return;
    }

    if (formEndDate < formStartDate) {
      setFormError('Campaign end date cannot be before start date');
      return;
    }

    // Allow empty records; validate only if items are specified
    const activeItems = formItems.filter(i => 
      (i.startSerialNumber && i.startSerialNumber.trim()) || 
      (i.endSerialNumber && i.endSerialNumber.trim())
    );

    for (let i = 0; i < activeItems.length; i++) {
      const item = activeItems[i];
      if (!item.denominationId) {
        setFormError(`Item #${i + 1}: Please select a card product`);
        return;
      }
      if (!item.startSerialNumber?.trim() || !item.endSerialNumber?.trim()) {
        setFormError(`Item #${i + 1}: Please specify both Start and End serial numbers`);
        return;
      }
      const range = calculateItemRange(item.startSerialNumber, item.endSerialNumber, item.denominationId);
      if (!range || !range.valid) {
        setFormError(`Item #${i + 1}: ${range?.error || 'Invalid serial range'}`);
        return;
      }
    }

    try {
      setIsSubmitting(true);

      if (modalMode === 'create') {
        const payload = {
          campaignName: formCampaignName.trim(),
          purposeCategory: formCategory,
          startDate: formStartDate,
          endDate: formEndDate,
          referenceNo: formReferenceNo.trim() || null,
          beneficiaryDept: formBeneficiaryDept.trim() || null,
          notes: formNotes.trim() || null,
          items: activeItems.map(i => ({
            denominationId: Number(i.denominationId),
            startSerialNumber: i.startSerialNumber.trim(),
            endSerialNumber: i.endSerialNumber.trim(),
            notes: i.notes?.trim() || null
          }))
        };

        const res = await campaignService.createCampaignExpense(payload);
        if (res.data?.success) {
          setShowCampaignModal(false);
          fetchData(0);
          loadInventoryOptions();
          handleOpenViewModal(res.data.data);
        }
      } else {
        const payload = {
          campaignName: formCampaignName.trim(),
          purposeCategory: formCategory,
          startDate: formStartDate,
          endDate: formEndDate,
          beneficiaryDept: formBeneficiaryDept.trim() || null,
          disbursedAt: formDisbursedAt ? formDisbursedAt : null,
          notes: formNotes.trim() || null,
        };

        const res = await campaignService.updateCampaign(editingCampaign.id, payload);

        if (activeItems.length > 0) {
          const addPayload = {
            items: activeItems.map(i => ({
              denominationId: Number(i.denominationId),
              startSerialNumber: i.startSerialNumber.trim(),
              endSerialNumber: i.endSerialNumber.trim(),
              notes: i.notes?.trim() || null
            }))
          };
          await campaignService.addCardExpenses(editingCampaign.id, addPayload);
        }

        if (res.data?.success) {
          setShowCampaignModal(false);
          fetchData(page);
          loadInventoryOptions();
        }
      }
    } catch (err) {
      setFormError(err.response?.data?.message || (modalMode === 'create' ? 'Failed to disburse cards and record campaign.' : 'Failed to update campaign details.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryBadge = (cat) => {
    const matched = PURPOSE_CATEGORIES.find(c => c.value === cat) || {
      label: cat,
      color: 'bg-slate-500/10 text-slate-400 border-slate-500/30'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${matched.color}`}>
        {matched.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary KPI Cards / Calculations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Cards Disbursed"
          value={summary ? (summary.totalCardsSpent || 0).toLocaleString() : '0'}
          subtitle={`Across ${summary ? summary.totalCampaigns || 0 : 0} campaign event(s)`}
          icon={Layers}
          color="indigo"
        />
        <StatCard
          title="Wholesale Value"
          value={`৳${summary ? Number(summary.totalWholesaleCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}`}
          subtitle="Actual cost incurred by company"
          icon={DollarSign}
          color="teal"
        />
        <StatCard
          title="Retail Value"
          value={`৳${summary ? Number(summary.totalFaceValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}`}
          subtitle="Nominal retail value distributed"
          icon={Tag}
          color="sky"
        />
        <StatCard
          title="Gross Value Concession"
          value={`৳${summary ? Number(summary.totalVariance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}`}
          subtitle="Nominal Value − Wholesale Cost"
          icon={Sparkles}
          color="purple"
        />
      </div>

      {/* Filter & Action Toolbar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 shadow-sm">
        <form onSubmit={handleApplyFilter} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by campaign name, ref #, or dept..."
              className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>

          {/* Campaign Category */}
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-teal-500 transition-colors"
            >
              {PURPOSE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="md:col-span-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-teal-500 transition-colors"
              title="Start Date"
            />
          </div>

          {/* End Date */}
          <div className="md:col-span-2">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-teal-500 transition-colors"
              title="End Date"
            />
          </div>

          {/* Filter & Reset Buttons */}
          <div className="md:col-span-1 flex items-center gap-1.5">
            <button
              type="submit"
              className="p-2 bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 rounded-lg border border-teal-500/30 transition-colors"
              title="Apply Filters"
            >
              <Filter className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetFilter}
              className="p-2 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 rounded-lg border border-slate-700 transition-colors"
              title="Reset Filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Disbursal Records Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-semibold text-slate-200">Disbursal Records & Campaign Calculations</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">
              Total records: <span className="text-teal-400 font-mono font-medium">{totalElements}</span>
            </span>
            <button
              onClick={() => handleOpenCreateModal()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Campaign</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-800/60 border-b border-slate-800 text-xs font-semibold text-slate-300 tracking-wider uppercase">
                <th className="py-3.5 px-4 w-12">SL</th>
                <th className="py-3.5 px-4">Campaign ID</th>
                <th className="py-3.5 px-4">Campaign Name</th>
                <th className="py-3.5 px-4">Campaign Category</th>
                <th className="py-3.5 px-4">Campaign Period</th>
                <th className="py-3.5 px-4">Target Team</th>
                <th className="py-3.5 px-4 text-right">Cards Spent</th>
                <th className="py-3.5 px-4 text-right">Wholesale Value</th>
                <th className="py-3.5 px-4 text-right">Retail Value</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs">Loading campaign disbursals...</span>
                    </div>
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <Megaphone className="w-10 h-10 text-slate-600 stroke-[1.5]" />
                      <p className="text-base font-semibold text-slate-200">No campaign card disbursements found</p>
                      <p className="text-xs text-slate-400 max-w-md">
                        Spend and document cards from your inventory for promotional campaigns, internal office use, QA testing, or VIP allocations.
                      </p>
                      <button
                        onClick={() => handleOpenCreateModal()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-teal-500/20 transition"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Create New Campaign</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                expenses.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="py-3.5 px-4 text-slate-400 text-xs font-mono">{page * pageSize + idx + 1}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs text-teal-300 font-semibold bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                        {item.referenceNo}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-200">{item.campaignName}</div>
                      {item.serialRangesSummary && (
                        <div className="text-xs text-slate-400 font-mono truncate max-w-xs" title={item.serialRangesSummary}>
                          {item.serialRangesSummary}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">{getCategoryBadge(item.purposeCategory)}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-300 whitespace-nowrap">
                      {item.startDate && item.endDate ? (
                        <div className="flex items-center gap-1.5 font-mono text-xs text-teal-300">
                          <Calendar className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                          <span>{item.startDate} ~ {item.endDate}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-300">
                      {item.beneficiaryDept || <span className="text-slate-500 italic">Not specified</span>}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                        {item.totalCardsCount?.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-400 text-xs">
                      ৳{Number(item.totalWholesaleCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-sky-400 text-xs">
                      ৳{Number(item.totalFaceValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">

                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="inline-flex items-center justify-center p-1.5 bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-500/30 rounded-lg text-xs transition-colors"
                          title="Edit Campaign Details"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenViewModal(item)}
                          className="inline-flex items-center justify-center p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-xs transition-colors"
                          title="View Campaign Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div>
              Showing page <span className="font-medium text-slate-200">{page + 1}</span> of <span className="font-medium text-slate-200">{totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchData(page - 1)}
                disabled={page === 0}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:pointer-events-none rounded-lg border border-slate-700 text-slate-200 font-medium transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => fetchData(page + 1)}
                disabled={page + 1 >= totalPages}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:pointer-events-none rounded-lg border border-slate-700 text-slate-200 font-medium transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      {/* UNIFIED CAMPAIGN MODAL: Create, Edit or View Campaign */}
      {showCampaignModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-6">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-100">
                    {modalMode === 'create'
                      ? 'Create New Campaign'
                      : modalMode === 'edit'
                      ? 'Edit Campaign Details'
                      : 'View Campaign Details'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {modalMode === 'create'
                      ? 'Select and disburse cards from your inventory, calculating company wholesale expense and nominal value.'
                      : modalMode === 'edit'
                      ? 'Update campaign details, schedule validity dates, and review or disburse additional cards from inventory.'
                      : 'Review campaign details, validity schedule, and summary of disbursed cards from inventory.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCampaignModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={modalMode === 'view' ? (e) => { e.preventDefault(); setShowCampaignModal(false); } : handleCampaignFormSubmit} className="p-5 overflow-y-auto space-y-5 flex-1">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* General Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Campaign Name {modalMode !== 'view' && <span className="text-red-400">*</span>}
                  </label>
                  <input
                    type="text"
                    value={formCampaignName}
                    readOnly={modalMode === 'view'}
                    onChange={(e) => setFormCampaignName(e.target.value)}
                    placeholder={modalMode === 'view' ? '' : 'e.g. Boishakhi Mega Campaign 2026, Core NOC Testing, Staff Allowance Q3'}
                    className={`w-full px-3 py-2 bg-slate-800 border rounded-lg text-sm text-slate-200 focus:outline-none ${modalMode === 'view' ? 'border-slate-700/60 bg-slate-800/50 cursor-default' : 'border-slate-700 focus:border-teal-500'}`}
                    required={modalMode !== 'view'}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Campaign Category {modalMode !== 'view' && <span className="text-red-400">*</span>}
                  </label>
                  <select
                    value={formCategory}
                    disabled={modalMode === 'view'}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className={`w-full px-3 py-2 bg-slate-800 border rounded-lg text-sm text-slate-200 focus:outline-none ${modalMode === 'view' ? 'border-slate-700/60 bg-slate-800/50 cursor-default' : 'border-slate-700 focus:border-teal-500'}`}
                  >
                    {PURPOSE_CATEGORIES.filter(c => c.value !== 'ALL').map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Campaign ID {modalMode === 'create' ? <span className="text-slate-500 text-[10px]">(Optional, auto-generated if blank)</span> : <span className="text-slate-500 text-[10px]">(Fixed)</span>}
                  </label>
                  {modalMode === 'create' ? (
                    <input
                      type="text"
                      value={formReferenceNo}
                      onChange={(e) => setFormReferenceNo(e.target.value)}
                      placeholder="e.g. CMP-2026-001 or MEMO-982"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-teal-500"
                    />
                  ) : (
                    <input
                      type="text"
                      value={formReferenceNo}
                      readOnly
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/60 rounded-lg text-sm font-mono text-teal-300 focus:outline-none cursor-default"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Campaign Start Date {modalMode !== 'view' && <span className="text-red-400">*</span>}
                  </label>
                  <input
                    type="date"
                    value={formStartDate}
                    readOnly={modalMode === 'view'}
                    disabled={modalMode === 'view'}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className={`w-full px-3 py-2 bg-slate-800 border rounded-lg text-sm text-slate-200 focus:outline-none ${modalMode === 'view' ? 'border-slate-700/60 bg-slate-800/50 cursor-default' : 'border-slate-700 focus:border-teal-500'}`}
                    required={modalMode !== 'view'}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Campaign End Date {modalMode !== 'view' && <span className="text-red-400">*</span>}
                  </label>
                  <input
                    type="date"
                    value={formEndDate}
                    readOnly={modalMode === 'view'}
                    disabled={modalMode === 'view'}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className={`w-full px-3 py-2 bg-slate-800 border rounded-lg text-sm text-slate-200 focus:outline-none ${modalMode === 'view' ? 'border-slate-700/60 bg-slate-800/50 cursor-default' : 'border-slate-700 focus:border-teal-500'}`}
                    required={modalMode !== 'view'}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Target Team
                  </label>
                  <input
                    type="text"
                    value={formBeneficiaryDept}
                    readOnly={modalMode === 'view'}
                    onChange={(e) => setFormBeneficiaryDept(e.target.value)}
                    placeholder={modalMode === 'view' ? 'Not specified' : 'e.g. Marketing Division, IT & QA Support, Fair Visitors'}
                    className={`w-full px-3 py-2 bg-slate-800 border rounded-lg text-sm text-slate-200 focus:outline-none ${modalMode === 'view' ? 'border-slate-700/60 bg-slate-800/50 cursor-default' : 'border-slate-700 focus:border-teal-500'}`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Remarks
                  </label>
                  <input
                    type="text"
                    value={formNotes}
                    readOnly={modalMode === 'view'}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder={modalMode === 'view' ? 'No remarks' : 'e.g. Approved under marketing budget allocation Q3'}
                    className={`w-full px-3 py-2 bg-slate-800 border rounded-lg text-sm text-slate-200 focus:outline-none ${modalMode === 'view' ? 'border-slate-700/60 bg-slate-800/50 cursor-default' : 'border-slate-700 focus:border-teal-500'}`}
                  />
                </div>
              </div>

              {/* Items / Card Ranges Selection */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-teal-400" />
                    <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                      Used Inventory
                    </h4>
                  </div>
                  {modalMode !== 'view' && (
                    <button
                      type="button"
                      onClick={handleAddItemRow}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-500/10 text-teal-300 hover:bg-teal-500/20 border border-teal-500/30 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Item</span>
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {/* In Edit or View mode, show already disbursed items */}
                  {(modalMode === 'edit' || modalMode === 'view') && existingItems.map((item, idx) => (
                    <div key={`exist-${item.id || idx}`} className="p-3.5 bg-slate-800/50 border border-slate-700/80 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-300">Item #{idx + 1}</span>
                          <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                            Disbursed ({item.quantity} cards)
                          </span>
                        </div>
                        <span className="text-xs font-mono text-slate-400 font-medium">
                          {item.batchNumber ? `Batch: ${item.batchNumber}` : ''}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                        <div className="sm:col-span-4">
                          <label className="block text-[11px] font-medium text-slate-400 mb-1">Card Product</label>
                          <input
                            type="text"
                            value={`${item.denominationName || 'Product'} (${item.denominationCode || ''})`}
                            readOnly
                            className="w-full px-2.5 py-1.5 bg-slate-900/60 border border-slate-700/60 rounded-lg text-xs text-slate-300 cursor-default"
                          />
                        </div>

                        <div className="sm:col-span-4">
                          <label className="block text-[11px] font-medium text-slate-400 mb-1">Start Serial #</label>
                          <input
                            type="text"
                            value={item.startSerialNumber || ''}
                            readOnly
                            className="w-full px-2.5 py-1.5 bg-slate-900/60 border border-slate-700/60 rounded-lg text-xs font-mono text-slate-300 cursor-default"
                          />
                        </div>

                        <div className="sm:col-span-4">
                          <label className="block text-[11px] font-medium text-slate-400 mb-1">End Serial #</label>
                          <input
                            type="text"
                            value={item.endSerialNumber || ''}
                            readOnly
                            className="w-full px-2.5 py-1.5 bg-slate-900/60 border border-slate-700/60 rounded-lg text-xs font-mono text-slate-300 cursor-default"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between text-xs pt-2 border-t border-slate-700/50">
                        <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Allocated ({item.quantity} cards)
                        </span>
                        <div className="flex items-center gap-4 text-xs font-mono">
                          <span className="text-slate-400">
                            Wholesale Value: <span className="text-emerald-400 font-semibold">৳{Number(item.subtotalWholesaleCost || 0).toFixed(2)}</span>
                          </span>
                          <span className="text-slate-400">
                            Retail Value: <span className="text-sky-400 font-semibold">৳{Number(item.subtotalFaceValue || 0).toFixed(2)}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Form Items (newly added items) */}
                  {modalMode !== 'view' && formItems.map((item, idx) => {
                    const rangeInfo = calculateItemRange(item.startSerialNumber, item.endSerialNumber, item.denominationId);
                    const selectedDenom = denominations.find(d => String(d.id) === String(item.denominationId));
                    const unitWholesale = selectedDenom ? Number(selectedDenom.wholesalePrice != null ? selectedDenom.wholesalePrice : selectedDenom.faceValue || 0) : 0;
                    const unitFace = selectedDenom ? Number(selectedDenom.retailPrice != null ? selectedDenom.retailPrice : selectedDenom.faceValue || 0) : 0;

                    const itemQty = rangeInfo && rangeInfo.valid ? rangeInfo.count : 0;
                    const subWholesale = itemQty * unitWholesale;
                    const subFace = itemQty * unitFace;

                    const itemIndex = modalMode === 'edit' ? existingItems.length + idx + 1 : idx + 1;

                    return (
                      <div key={`item-${idx}`} className={`p-3.5 bg-slate-800/50 border ${modalMode === 'edit' ? 'border-teal-500/30' : 'border-slate-700/80'} rounded-xl space-y-3`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-300">Item #{itemIndex}</span>
                            {modalMode === 'edit' && (
                              <span className="text-[10px] font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full">
                                New Allocation
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            className="text-slate-400 hover:text-red-400 p-1 rounded transition-colors"
                            title="Remove Line"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                          {/* Card Product */}
                          <div className="sm:col-span-4">
                            <label className="block text-[11px] font-medium text-slate-400 mb-1">Card Product</label>
                            <select
                              value={item.denominationId}
                              onChange={(e) => handleItemChange(idx, 'denominationId', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                              required
                            >
                              {denominations.map(d => (
                                <option key={d.id} value={d.id}>
                                  {d.name} ({d.code}) - Stock: {d.availableStock || 0}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Start Serial */}
                          <div className="sm:col-span-4">
                            <label className="block text-[11px] font-medium text-slate-400 mb-1">Start Serial #</label>
                            <input
                              type="text"
                              value={item.startSerialNumber}
                              onChange={(e) => handleItemChange(idx, 'startSerialNumber', e.target.value)}
                              placeholder="e.g. 100001"
                              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-teal-500"
                              required
                            />
                          </div>

                          {/* End Serial */}
                          <div className="sm:col-span-4">
                            <label className="block text-[11px] font-medium text-slate-400 mb-1">End Serial #</label>
                            <input
                              type="text"
                              value={item.endSerialNumber}
                              onChange={(e) => handleItemChange(idx, 'endSerialNumber', e.target.value)}
                              placeholder="e.g. 100100"
                              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-teal-500"
                              required
                            />
                          </div>
                        </div>

                        {/* Range status and live calculation info */}
                        <div className="flex flex-wrap items-center justify-between text-xs pt-2 border-t border-slate-700/50">
                          <div>
                            {rangeInfo && !rangeInfo.valid ? (
                              <span className="text-red-400 flex items-center gap-1 text-[11px]">
                                <AlertCircle className="w-3.5 h-3.5" />
                                {rangeInfo.error}
                              </span>
                            ) : rangeInfo && rangeInfo.valid ? (
                              <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Range valid ({itemQty} cards)
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[11px]">Enter valid start and end serial numbers</span>
                            )}
                          </div>

                          {rangeInfo && rangeInfo.valid && (
                            <div className="flex items-center gap-4 text-xs font-mono">
                              <span className="text-slate-400">
                                Wholesale Value: <span className="text-emerald-400 font-semibold">৳{subWholesale.toFixed(2)}</span>
                              </span>
                              <span className="text-slate-400">
                                Retail Value: <span className="text-sky-400 font-semibold">৳{subFace.toFixed(2)}</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {((modalMode === 'view' && existingItems.length === 0) || (modalMode !== 'view' && formItems.length === 0 && existingItems.length === 0)) && (
                    <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-700/70 rounded-xl bg-slate-900/30">
                      <Layers className="w-7 h-7 text-slate-600 mx-auto mb-2 stroke-[1.5]" />
                      <p className="font-medium text-slate-300">No cards allocated</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        {modalMode === 'view'
                          ? 'No inventory cards were disbursed for this campaign.'
                          : 'Click "+ Add Item" above to select cards and serial ranges from inventory, or save the campaign without card expenses.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Total Calculation Preview */}
              <div className="bg-slate-950/80 border border-teal-500/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-200 uppercase tracking-wider">Summary</span>
                  <span className="text-teal-400 font-mono">
                    {modalMode === 'view' ? 'Campaign Totals' : 'Live calculation'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg text-center">
                    <span className="block text-[11px] text-slate-400">Total Cards</span>
                    <span className="text-base font-bold font-mono text-indigo-300">
                      {modalCombinedStats.totalCards.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg text-center">
                    <span className="block text-[11px] text-slate-400">Wholesale Value</span>
                    <span className="text-base font-bold font-mono text-emerald-400">
                      ৳{modalCombinedStats.totalWholesale.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg text-center">
                    <span className="block text-[11px] text-slate-400">Retail Value</span>
                    <span className="text-base font-bold font-mono text-sky-400">
                      ৳{modalCombinedStats.totalFace.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit / Cancel Buttons */}
              {modalMode === 'view' ? (
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCampaignModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalMode('edit')}
                    className="inline-flex items-center gap-2 px-5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-sm font-bold transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                    <span>Edit Campaign</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCampaignModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-lg transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>{modalMode === 'create' ? 'Recording Campaign & Disbursing...' : 'Updating Campaign...'}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{modalMode === 'create' ? 'Confirm' : 'Save Changes'}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

          </div>
  );
}