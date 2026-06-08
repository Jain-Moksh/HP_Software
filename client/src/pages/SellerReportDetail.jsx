import { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { ArrowLeft, Box, Truck, Plus, IndianRupee, Pencil } from 'lucide-react';
import DataTable from '../components/DataTable';
import EditMasterModal from '../components/EditMasterModal';
import API_BASE_URL from '../config';

const COLUMNS = [
  { key: 'type1',    label: 'Type 1',    type: 'number' },
  { key: 'type2',    label: 'Type 2',    type: 'number' },
  { key: 'material', label: 'Material',  type: 'text', minWidth: '140px' },
  { key: 'rate',     label: 'Rate',      type: 'number', prefix: '₹' },
  { key: 'jobber',   label: 'Jobber',    type: 'combobox' },
  { key: 'date',     label: 'Date',      type: 'date', minWidth: '100px' },
  { key: 'amount',   label: 'Amount',    type: 'computed', prefix: '₹' },
  { key: 'w',        label: 'W',         type: 'checkbox' },
  { key: 'b',        label: 'B',         type: 'checkbox' },
  { key: 'a',        label: 'A',         type: 'checkbox' },
  { key: 'remark',   label: 'Remark',    type: 'text', minWidth: '160px' },
];

const getLocalDateParts = (dateStr) => {
  if (!dateStr) {
    const d = new Date();
    return { month: d.getMonth(), year: d.getFullYear(), day: d.getDate() };
  }
  if (typeof dateStr === 'string') {
    const dateOnly = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const parts = dateOnly.split('-');
    if (parts.length === 3) {
      return {
        year: parseInt(parts[0], 10),
        month: parseInt(parts[1], 10) - 1, // 0-indexed
        day: parseInt(parts[2], 10)
      };
    }
  }
  const d = new Date(dateStr);
  return { month: d.getMonth(), year: d.getFullYear(), day: d.getDate() };
};

const prepareTableData = (data, month, year, showDraftAdj = false) => {
  if (!data && !showDraftAdj) return [];

  const allProcessed = (data || []).map(item => {
    const dateParts = getLocalDateParts(item.date);
    return {
      ...item,
      _month: item._month ?? dateParts.month,
      _year: item._year ?? dateParts.year
    };
  });

  const filtered = allProcessed.filter(r => r._month === month && r._year === year);

  const materialRows = filtered.filter(r => r.tx_type !== 'IN_ADJ');
  const savedAdjRows = filtered.filter(r => r.tx_type === 'IN_ADJ');

  const matTotals = materialRows.reduce((acc, row) => {
    acc.type1 += (Number(row.type1) || 0);
    acc.type2 += (Number(row.type2) || 0);
    acc.amount += (Number(row.amount) || 0);
    return acc;
  }, { type1: 0, type2: 0, amount: 0 });

  const result = [...materialRows];

  result.push({
    id: `gross-total-${month}-${year}`,
    type1: matTotals.type1,
    type2: matTotals.type2,
    material: '---',
    rate: '---',
    jobber: '---',
    remark: 'GROSS TOTAL',
    amount: matTotals.amount,
    isTotal: true
  });

  const adjGroup = [...savedAdjRows];
  if (showDraftAdj) {
    adjGroup.push({
      id: 'draft-adj',
      isDraft: true,
      tx_type: 'IN_ADJ',
      date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`,
      amount: 0,
      remark: 'Adjustment',
      type1: '---', type2: '---', material: '---', rate: '---',
      w: false, b: false, a: false, jobber: '---'
    });
  }

  if (adjGroup.length > 0) {
    result.push(...adjGroup);
    const adjSum = adjGroup.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    result.push({
      id: `net-total-${month}-${year}`,
      type1: matTotals.type1,
      type2: matTotals.type2,
      remark: 'NET TOTAL',
      amount: matTotals.amount - adjSum,
      isTotal: true,
      material: '---', rate: '---', jobber: '---'
    });
  }

  return result;
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function SellerReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setHeaderActions } = useOutletContext();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const [seller, setSeller] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [masters, setMasters] = useState({ jobbers: [] });
  
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [activeMonth, setActiveMonth]   = useState(currentMonth);
  const [showAdjEntry, setShowAdjEntry] = useState(false);
  const [editModal, setEditModal] = useState({ isOpen: false, sellerId: null, sellerName: '' });

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const visibleMonths = (selectedYear === currentYear) ? MONTHS.slice(0, currentMonth + 1) : MONTHS;

  const fetchMasters = async () => {
    try {
      const [jRes, sRes] = await Promise.all([
        fetch(`${API_BASE_URL}/jobbers`),
        fetch(`${API_BASE_URL}/sellers`)
      ]);
      const [jobbers, sellers] = await Promise.all([jRes.json(), sRes.json()]);
      setMasters({ jobbers });
      
      const currentSeller = sellers.find(s => s.id.toString() === id);
      if (currentSeller) {
        setSeller(currentSeller);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('Master fetch error:', err);
      setLoading(false);
    }
  };

  const handleEditSeller = async (newName) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/sellers/${seller.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });
      
      const data = await resp.json();
      if (resp.ok) {
        setEditModal({ isOpen: false, sellerId: null, sellerName: '' });
        await fetchMasters(); // This will refresh the seller and subsequently fetch the new report!
      } else {
        alert(data.error || 'Failed to rename seller');
      }
    } catch (err) {
      console.error('Rename error:', err);
      alert('An error occurred while renaming');
    }
  };

  const fetchReport = async () => {
    if (!seller?.name) return;
    try {
      const resp = await fetch(`${API_BASE_URL}/seller-report/${encodeURIComponent(seller.name)}`);
      if (resp.ok) {
        const json = await resp.json();
        setReport(json);
      } else {
        setReport(null);
      }
    } catch (err) {
      console.error('Failed to fetch seller report:', err);
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const ensureMasterRecord = async (type, name) => {
    if (!name) return null;
    const list = type === 'jobber' ? masters.jobbers : masters.sellers;
    const existing = list?.find(item => item.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing.id;

    const apiPath = type === 'jobber' ? 'jobbers' : 'sellers';
    try {
      const resp = await fetch(`${API_BASE_URL}/${apiPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (resp.ok) {
        const newRecord = await resp.json();
        await fetchMasters();
        return newRecord.id;
      }
    } catch (err) { console.error(err); }
    return null;
  };

  const handleUpdate = async (updatedRow) => {
    if (updatedRow.isTotal) {
      fetchReport();
      return;
    }
    try {
      if (updatedRow.tx_type === 'IN_ADJ' || updatedRow.isDraft) {
        if (!updatedRow.date) {
          alert('Please enter a valid date');
          fetchReport(); // reload to clear invalid draft state
          return;
        }

        const isNew = updatedRow.isDraft;
        const url = isNew 
          ? `${API_BASE_URL}/seller-adjustments`
          : `${API_BASE_URL}/seller-adjustments/${updatedRow.id}`;
        
        const payload = {
          seller_id: seller.id || report?.sellerId || (await ensureMasterRecord('seller', seller.name)),
          amount: updatedRow.amount,
          date: updatedRow.date,
          remark: updatedRow.remark
        };

        const resp = await fetch(url, {
          method: isNew ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (resp.ok) {
          setShowAdjEntry(false);
          fetchReport();
        } else alert('Failed to save adjustment.');
        return;
      }

      const jId = await ensureMasterRecord('jobber', updatedRow.jobber);
      const sId = await ensureMasterRecord('seller', seller.name); 

      if (!jId || !sId) return;

      const payload = {
        ...updatedRow,
        jobber_id: jId,
        seller_id: sId
      };

      const resp = await fetch(`${API_BASE_URL}/transactions/in/${updatedRow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (resp.ok) fetchReport();
      else alert('Failed to update.');
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id, password, tx_type) => {
    try {
      let url = `${API_BASE_URL}/transactions/in/${id}`;
      if (tx_type === 'IN_ADJ') {
         url = `${API_BASE_URL}/seller-adjustments/${id}`;
      }

      const resp = await fetch(url, {
        method: 'DELETE',
        headers: { 'x-delete-password': password }
      });
      if (resp.ok) fetchReport();
      else {
        const err = await resp.json();
        alert(err.message || 'Failed to delete');
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchMasters();
    setHeaderActions?.(null);
  }, [id]);

  useEffect(() => {
    if (seller?.name) {
      fetchReport();
    }
  }, [seller]);

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-screen">
      <p className="text-sm text-[#64748B]">Loading report...</p>
    </div>
  );
  
  if (!report || !seller) return (
    <div className="p-6 flex flex-col items-center justify-center h-screen gap-4">
      <p className="text-sm text-[#64748B]">No report data found.</p>
      <button onClick={() => navigate(-1)} className="text-[#2563EB] text-sm font-semibold underline">Go Back</button>
    </div>
  );

  const allTransactions = report.transactions || [];
  const transactions = allTransactions
    .filter(t => !t.tx_type || t.tx_type === 'IN' || t.tx_type === 'IN_ADJ')
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Calculate Dynamic Opening/Closing Financial Balances (Amounts)
  const openingAmount = transactions.reduce((acc, tx) => {
    const dateParts = getLocalDateParts(tx.date);
    const m = dateParts.month;
    const y = dateParts.year;
    if (y < selectedYear || (y === selectedYear && m < activeMonth)) {
      if (tx.tx_type === 'IN') {
        acc += (Number(tx.amount) || 0);
      } else if (tx.tx_type === 'IN_ADJ') {
        acc -= (Number(tx.amount) || 0);
      }
    }
    return acc;
  }, 0);

  const currentNetAmount = transactions.reduce((acc, tx) => {
    const dateParts = getLocalDateParts(tx.date);
    const m = dateParts.month;
    const y = dateParts.year;
    if (y === selectedYear && m === activeMonth) {
      if (tx.tx_type === 'IN') {
        acc += (Number(tx.amount) || 0);
      } else if (tx.tx_type === 'IN_ADJ') {
        acc -= (Number(tx.amount) || 0);
      }
    }
    return acc;
  }, 0);

  const closingAmount = openingAmount + currentNetAmount;

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC]">
      {/* ── Compact Sticky Header ── */}
      <div className="flex-none bg-white border-b border-[#E2E8F0] px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-[#F1F5F9] rounded-lg text-[#64748B] hover:text-[#0F172A] transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
              {seller?.name}
              <button 
                onClick={() => setEditModal({ isOpen: true, sellerId: seller.id, sellerName: seller.name })}
                className="p-1 text-[#94A3B8] hover:text-[#2563EB] hover:bg-blue-50 rounded transition-all"
                title="Rename Seller"
              >
                <Pencil size={14} />
              </button>
              <span className="text-[10px] font-medium bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full uppercase tracking-wider">Seller Report</span>
            </h1>
            <p className="text-xs text-[#64748B]">Historical supply and payment status</p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex flex-col items-end">
             <span className="text-[10px] items-center gap-1 uppercase font-bold text-[#64748B] flex mb-1">
                <IndianRupee size={10} className="text-violet-500" /> Opening Balance
             </span>
             <span className="text-xl font-extrabold text-violet-600 leading-tight">
                ₹{openingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
             </span>
          </div>
          <div className="w-[1px] h-10 bg-slate-200" />
          <div className="flex flex-col items-end">
             <span className="text-[10px] items-center gap-1 uppercase font-bold text-[#64748B] flex mb-1">
                <IndianRupee size={10} className="text-pink-500" /> Closing Balance
             </span>
             <span className="text-xl font-extrabold text-pink-600 leading-tight">
                ₹{closingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
             </span>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 p-4 overflow-hidden flex flex-col">
        <div className="flex-1 flex flex-col bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="px-4 py-2 bg-[#F1F5F9] border-b border-[#E2E8F0] flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#0F172A]">Supply Records</h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowAdjEntry(true)}
                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm"
                title="Add Deduction/Payment"
              >
                <Plus size={12} /> PAY
              </button>
              <span className="text-[10px] font-bold text-[#64748B] bg-white px-2 py-0.5 rounded border border-[#E2E8F0]">
                {transactions.filter(r => {
                   const dateParts = getLocalDateParts(r.date);
                   return dateParts.month === activeMonth && dateParts.year === selectedYear;
                 }).length} Records
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-1">
            <DataTable 
              columns={COLUMNS}
              initialData={prepareTableData(transactions, activeMonth, selectedYear, showAdjEntry)}
              comboboxFields={{
                jobber: masters.jobbers.map(j => j.name)
              }}
              onSave={handleUpdate}
              onDelete={handleDelete}
              onAddNewOption={(field, val) => ensureMasterRecord(field, val)}
              hideFilters={true}
            />
          </div>
        </div>
      </div>

      {/* ── Shared Footer Pagination ── */}
      <div className="flex-none bg-white border-t border-[#E2E8F0] px-6 py-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            {visibleMonths.map((m, idx) => (
              <button
                key={m}
                onClick={() => setActiveMonth(idx)}
                className={`flex-none px-4 py-1 text-xs font-semibold rounded-lg border transition-all ${
                  activeMonth === idx
                    ? 'bg-[#2563EB] text-white border-[#1D4ED8] shadow-[0_2px_4px_rgba(37,99,235,0.2)]'
                    : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] hover:bg-white hover:text-[#0F172A]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 px-3 py-1 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
             <span className="text-xs font-bold text-[#64748B]">Year:</span>
             <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-[#0F172A] outline-none cursor-pointer"
             >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
             </select>
          </div>
        </div>
      </div>
      <EditMasterModal
        isOpen={editModal.isOpen}
        title={`Rename ${editModal.sellerName}`}
        initialName={editModal.sellerName}
        onClose={() => setEditModal({ isOpen: false, sellerId: null, sellerName: '' })}
        onConfirm={handleEditSeller}
      />
    </div>
  );
}
