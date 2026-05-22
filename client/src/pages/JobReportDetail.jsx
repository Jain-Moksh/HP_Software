import { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Box, Plus, IndianRupee, Pencil } from 'lucide-react';
import DataTable, { EditCombobox } from '../components/DataTable';
import EditMasterModal from '../components/EditMasterModal';
import API_BASE_URL from '../config';

const IN_COLUMNS = [
  { key: 'type1',    label: 'Type 1',    type: 'stacked-number', subKey: 'type1_b' },
  { key: 'type2',    label: 'Type 2',    type: 'stacked-number', subKey: 'type2_b' },
  { key: 'material', label: 'Material',  type: 'text', minWidth: '140px' },
  { key: 'seller',   label: 'Seller',    type: 'combobox' },
  { key: 'w',        label: 'W',         type: 'checkbox' },
  { key: 'b',        label: 'B',         type: 'checkbox' },
  { key: 'a',        label: 'A',         type: 'checkbox' },
  { key: 'date',     label: 'Date',      type: 'date' },
  { key: 'remark',   label: 'Remark',    type: 'text', minWidth: '160px' },
];

const OUT_COLUMNS = [
  { key: 'type1',    label: 'Type 1',    type: 'stacked-number', subKey: 'type1_b' },
  { key: 'type2',    label: 'Type 2',    type: 'stacked-number', subKey: 'type2_b' },
  { key: 'material', label: 'Material',     type: 'text', minWidth: '140px' },
  { key: 'rate',     label: 'Rate',         type: 'number', prefix: '₹' },
  { key: 'vendor',   label: 'Vendor',       type: 'combobox' },
  { key: 'date',     label: 'Date',         type: 'date' },
  { key: 'amount',   label: 'Amount',       type: 'computed', prefix: '₹' },
  { key: 'remark',   label: 'Remark',       type: 'text', minWidth: '160px' },
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const prepareTableData = (data, month, year, showDraftAdj = false) => {
  if (!data && !showDraftAdj) return [];
  
  const allProcessed = (data || []).map(item => {
    const d = item.date ? new Date(item.date) : new Date();
    return {
      ...item,
      _month: item._month ?? d.getMonth(),
      _year: item._year ?? d.getFullYear()
    };
  });

  const filtered = allProcessed.filter(r => r._month === month && r._year === year);

  // Split into Material and Adjustment rows
  const materialRows = filtered.filter(r => r.tx_type !== 'OUT_ADJ');
  const savedAdjRows = filtered.filter(r => r.tx_type === 'OUT_ADJ');

  // Calculate Material Totals
  const matTotals = materialRows.reduce((acc, row) => {
    acc.type1 += (Number(row.type1) || 0);
    acc.type1_b += (Number(row.type1_b) || 0);
    acc.type2 += (Number(row.type2) || 0);
    acc.type2_b += (Number(row.type2_b) || 0);
    acc.amount += (Number(row.amount) || 0);
    return acc;
  }, { type1: 0, type1_b: 0, type2: 0, type2_b: 0, amount: 0 });

  const result = [...materialRows];

  // Intermediate Total Row
  result.push({
    id: `mat-total-${month}-${year}`,
    type1: matTotals.type1,
    type1_b: matTotals.type1_b,
    type2: matTotals.type2,
    type2_b: matTotals.type2_b,
    material: '---',
    rate: '---',
    vendor: '---',
    seller: '---',
    remark: 'GROSS TOTAL',
    amount: matTotals.amount,
    isTotal: true,
    isTotalHeader: true // to distinguish if needed
  });

  // Adjustment Rows + Draft
  const adjGroup = [...savedAdjRows];
  if (showDraftAdj) {
    adjGroup.push({
      id: 'draft-adj',
      isDraft: true,
      tx_type: 'OUT_ADJ',
      date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`,
      amount: 0,
      remark: 'Adjustment',
      type1: '---', type1_b: '---', type2: '---', type2_b: '---',
      material: '---', rate: '---', vendor: '---',
      w: false, b: false, a: false
    });
  }

  if (adjGroup.length > 0) {
    result.push(...adjGroup);
    
    const adjSum = adjGroup.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    
    // Final Net Total Row
    result.push({
      id: `net-total-${month}-${year}`,
      type1: matTotals.type1, // usually stock doesn't change with adj
      type1_b: matTotals.type1_b,
      type2: matTotals.type2,
      type2_b: matTotals.type2_b,
      material: '---',
      rate: '---',
      vendor: '---',
      seller: '---',
      remark: 'NET TOTAL',
      amount: matTotals.amount - adjSum,
      isTotal: true
    });
  }

  return result;
};

export default function JobReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setHeaderActions } = useOutletContext();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const [jobber, setJobber] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [masters, setMasters] = useState({ sellers: [], vendors: [], jobbers: [] });
  
  // Lifted Filter State
   const [selectedYear, setSelectedYear] = useState(currentYear);
   const [activeMonth, setActiveMonth]   = useState(currentMonth);
   const [showAdjEntry, setShowAdjEntry] = useState(false);
   const [editModal, setEditModal] = useState({ 
      isOpen: false, jobberId: null, jobberName: '', 
      openingStockT1: 0, openingStockT2: 0, openingAmount: 0 
   });

  const fetchMasters = async () => {
    try {
      const [sRes, vRes, jRes] = await Promise.all([
        fetch(`${API_BASE_URL}/sellers`),
        fetch(`${API_BASE_URL}/vendors`),
        fetch(`${API_BASE_URL}/jobbers`)
      ]);
      const [sellers, vendors, jobbers] = await Promise.all([sRes.json(), vRes.json(), jRes.json()]);
      setMasters({ sellers, vendors, jobbers });
      
      // Find the specific jobber for this ID
      const currentJobber = jobbers.find(j => j.id.toString() === id);
      if (currentJobber) {
        setJobber(currentJobber);
      } else {
        setLoading(false); // Jobber not found
      }
    } catch (err) {
      console.error('Master fetch error:', err);
      setLoading(false);
    }
  };

  const handleEditJobber = async (newName, t1, t2, amt) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/jobbers/${jobber.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           name: newName,
           opening_stock_type1: t1,
           opening_stock_type2: t2,
           opening_amount: amt
        })
      });
      
      const data = await resp.json();
      if (resp.ok) {
        setEditModal({ isOpen: false, jobberId: null, jobberName: '', openingStockT1: 0, openingStockT2: 0, openingAmount: 0 });
        await fetchMasters(); // This will refresh the jobber and subsequently fetch the new report!
      } else {
        alert(data.error || 'Failed to rename jobber');
      }
    } catch (err) {
      console.error('Rename error:', err);
      alert('An error occurred while renaming');
    }
  };

  const ensureMasterRecord = async (type, name) => {
    if (!name) return null;
    const list = type === 'seller' ? masters.sellers : type === 'vendor' ? masters.vendors : masters.jobbers;
    const existing = list.find(item => item.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing.id;

    const apiPath = type === 'seller' ? 'sellers' : type === 'vendor' ? 'vendors' : 'jobbers';
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

  const handleUpdate = async (updatedRow, type) => {
    if (updatedRow.isTotal) {
       fetchReport();
       return;
    }
    try {
      if (updatedRow.tx_type === 'OUT_ADJ' || updatedRow.isDraft) {
        if (!updatedRow.date) {
          alert('Please enter a valid date');
          fetchReport(); // reload to clear invalid draft state
          return;
        }

        const isNew = updatedRow.isDraft;
        const url = isNew 
          ? `${API_BASE_URL}/adjustments`
          : `${API_BASE_URL}/adjustments/${updatedRow.id}`;
        
        const payload = {
          jobber_id: jobber.id || report?.jobberId || (await ensureMasterRecord('jobber', jobber.name)),
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
        } else {
          alert('Failed to save adjustment.');
        }
        return;
      }

      const mode = type || updatedRow.tx_type;
      const apiPath = mode === 'IN' ? 'in' : 'out';
      const masterType = mode === 'IN' ? 'seller' : 'vendor';
      
      const mId = await ensureMasterRecord(masterType, updatedRow[masterType]);
      const jId = await ensureMasterRecord('jobber', updatedRow.jobber || jobber.name);

      if (!mId || !jId) return;

      const payload = {
        ...updatedRow,
        [`${masterType}_id`]: mId,
        jobber_id: jId
      };

      const resp = await fetch(`${API_BASE_URL}/transactions/${apiPath}/${updatedRow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (resp.ok) {
        fetchReport();
      }
    } catch (err) {
      console.error('Update error:', err);
    }
  };

  const handleDelete = async (id, password, tx_type) => {
    try {
      let url = `${API_BASE_URL}/transactions/${tx_type === 'IN' ? 'in' : 'out'}/${id}`;
      if (tx_type === 'OUT_ADJ') {
        url = `${API_BASE_URL}/adjustments/${id}`;
      } else if (tx_type === 'TRANSFER_IN' || tx_type === 'TRANSFER_OUT') {
        url = `${API_BASE_URL}/transactions/transfer/${id}`;
      }

      const resp = await fetch(url, {
        method: 'DELETE',
        headers: { 'x-delete-password': password }
      });

      if (resp.ok) {
        fetchReport();
      } else {
        const error = await resp.json();
        alert(error.message || 'Failed to delete record.');
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const fetchReport = async () => {
    if (!jobber?.name) return;
    try {
      const resp = await fetch(`${API_BASE_URL}/job-report/${encodeURIComponent(jobber.name)}`);
      if (resp.ok) {
        const json = await resp.json();
        setReport(json);
      } else {
        setReport(null);
      }
    } catch (err) {
      console.error('Failed to fetch job report:', err);
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasters();
    setHeaderActions?.(null);
  }, [id]);

  useEffect(() => {
    if (jobber?.name) {
        fetchReport();
    }
  }, [jobber]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <p className="text-sm text-[#64748B]">Loading job report...</p>
      </div>
    );
  }

  if (!report || !jobber) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full gap-4">
        <p className="text-sm text-[#64748B]">No report data found for this jobber.</p>
        <button onClick={() => navigate(-1)} className="text-[#2563EB] text-sm font-semibold underline">Go Back</button>
      </div>
    );
  }

  const rawTransactions = report?.transactions || [];
  const baseOpening = report?.openingStock || { type1: 0, type2: 0 };

  const allTransactions = rawTransactions.map(tx => {
    if (tx.tx_type === 'TRANSFER_IN') {
      return {
        ...tx,
        seller: `From: ${tx.from_jobber || 'Jobber'}`,
        readOnly: true,
        w: '---', b: '---', a: '---'
      };
    }
    if (tx.tx_type === 'TRANSFER_OUT') {
      return {
        ...tx,
        vendor: `To: ${tx.to_jobber || 'Jobber'}`,
        readOnly: true,
        rate: '---',
        amount: '---'
      };
    }
    return tx;
  });

  // Calculate Dynamic Opening Stock (balance before the selected month/year)
  const openingStock = allTransactions.reduce((acc, tx) => {
    const d = new Date(tx.date);
    const m = d.getMonth();
    const y = d.getFullYear();
    if (y < selectedYear || (y === selectedYear && m < activeMonth)) {
      if (tx.tx_type === 'IN' || tx.tx_type === 'TRANSFER_IN') {
        acc.type1 += (Number(tx.type1) || 0);
        acc.type2 += (Number(tx.type2) || 0);
      } else if (tx.tx_type === 'OUT' || tx.tx_type === 'TRANSFER_OUT') {
        acc.type1 -= (Number(tx.type1) || 0);
        acc.type2 -= (Number(tx.type2) || 0);
      }
    }
    return acc;
  }, { ...baseOpening });

  // Calculate net for the current selected month
  const currentNet = allTransactions.reduce((acc, tx) => {
    const d = new Date(tx.date);
    const m = d.getMonth();
    const y = d.getFullYear();
    if (y === selectedYear && m === activeMonth) {
      if (tx.tx_type === 'IN' || tx.tx_type === 'TRANSFER_IN') {
        acc.type1 += (Number(tx.type1) || 0);
        acc.type2 += (Number(tx.type2) || 0);
      } else if (tx.tx_type === 'OUT' || tx.tx_type === 'TRANSFER_OUT') {
        acc.type1 -= (Number(tx.type1) || 0);
        acc.type2 -= (Number(tx.type2) || 0);
      }
    }
    return acc;
  }, { type1: 0, type2: 0 });

  const closingStock = {
    type1: openingStock.type1 + currentNet.type1,
    type2: openingStock.type2 + currentNet.type2
  };

  // Calculate Dynamic Opening/Closing Financial Balances (Amounts)
  const baseOpeningAmount = report?.openingAmount || 0;
  const openingAmount = allTransactions.reduce((acc, tx) => {
    const d = new Date(tx.date);
    const m = d.getMonth();
    const y = d.getFullYear();
    if (y < selectedYear || (y === selectedYear && m < activeMonth)) {
      if (tx.tx_type === 'OUT') {
        acc += (Number(tx.amount) || 0);
      } else if (tx.tx_type === 'OUT_ADJ') {
        acc -= (Number(tx.amount) || 0);
      }
    }
    return acc;
  }, 0);

  const currentNetAmount = allTransactions.reduce((acc, tx) => {
    const d = new Date(tx.date);
    const m = d.getMonth();
    const y = d.getFullYear();
    if (y === selectedYear && m === activeMonth) {
      if (tx.tx_type === 'OUT') {
        acc += (Number(tx.amount) || 0);
      } else if (tx.tx_type === 'OUT_ADJ') {
        acc -= (Number(tx.amount) || 0);
      }
    }
    return acc;
  }, 0);

  const closingAmount = openingAmount + currentNetAmount;

  const inTransactions = allTransactions.filter(t => t.tx_type === 'IN' || t.tx_type === 'TRANSFER_IN');
  const outTransactions = allTransactions
    .filter(t => t.tx_type === 'OUT' || t.tx_type === 'OUT_ADJ' || t.tx_type === 'TRANSFER_OUT')
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Month filtering years
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const visibleMonths = (selectedYear === currentYear) ? MONTHS.slice(0, currentMonth + 1) : MONTHS;

  const handleAddNewOption = async (field, value) => {
    await ensureMasterRecord(field, value);
  };

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC]">
      {/* ── Compact Sticky Header ── */}
      <div className="flex-none bg-white border-b border-[#E2E8F0] px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-[#F1F5F9] rounded-lg text-[#64748B] hover:text-[#0F172A] transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
              {jobber?.name} 
              <button 
                onClick={() => setEditModal({ 
                  isOpen: true, 
                  jobberId: jobber.id, 
                  jobberName: jobber.name,
                  openingStockT1: baseOpening.type1 || 0,
                  openingStockT2: baseOpening.type2 || 0,
                  openingAmount: report?.openingAmount || 0
                })}
                className="p-1 text-[#94A3B8] hover:text-[#2563EB] hover:bg-blue-50 rounded transition-all"
                title="Edit Jobber"
              >
                <Pencil size={14} />
              </button>
              <span className="text-[10px] font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-wider">Jobber Report</span>
            </h1>
            <p className="text-xs text-[#64748B]">Overview & Transaction History</p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex flex-col items-end">
             <span className="text-[10px] items-center gap-1 uppercase font-bold text-[#64748B] flex mb-1">
                <Box size={10} className="text-blue-500" /> Opening Stock
             </span>
             <div className="flex gap-4">
                <div className="text-right flex flex-col items-end">
                   <span className="text-[9px] text-[#94A3B8] font-bold uppercase tracking-tighter -mb-1">T1</span>
                   <span className="text-xl font-extrabold text-[#0F172A] leading-tight">{openingStock.type1}</span>
                </div>
                <div className="text-right flex flex-col items-end">
                   <span className="text-[9px] text-[#94A3B8] font-bold uppercase tracking-tighter -mb-1">T2</span>
                   <span className="text-xl font-extrabold text-[#0F172A] leading-tight">{openingStock.type2}</span>
                </div>
             </div>
          </div>
          <div className="w-[1px] h-10 bg-slate-200" />
          <div className="flex flex-col items-end">
             <span className="text-[10px] items-center gap-1 uppercase font-bold text-[#64748B] flex mb-1">
                <Box size={10} className="text-emerald-500" /> Closing Stock
             </span>
             <div className="flex gap-4">
                <div className="text-right flex flex-col items-end">
                   <span className="text-[9px] text-[#94A3B8] font-bold uppercase tracking-tighter -mb-1">T1</span>
                   <span className="text-xl font-extrabold text-[#0F172A] leading-tight">{closingStock.type1}</span>
                </div>
                <div className="text-right flex flex-col items-end">
                   <span className="text-[9px] text-[#94A3B8] font-bold uppercase tracking-tighter -mb-1">T2</span>
                   <span className="text-xl font-extrabold text-[#0F172A] leading-tight">{closingStock.type2}</span>
                </div>
             </div>
          </div>
          <div className="w-[1px] h-10 bg-slate-200" />
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

      {/* ── Fixed Split Body (No main scroll) ── */}
      <div className="flex-1 p-4 flex flex-col gap-4 overflow-hidden">
        {/* Table IN */}
        <div className="flex-1 min-h-0 bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 py-2 bg-[#F1F5F9] border-b border-[#E2E8F0] flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#0F172A] flex items-center gap-2">
              <TrendingUp size={14} className="text-emerald-500" /> Material Inward (IN)
            </h3>
            <span className="text-[10px] font-bold text-[#64748B] bg-white px-2 py-0.5 rounded border border-[#E2E8F0]">
               {inTransactions.filter(r => {
                 const d = new Date(r.date);
                 return d.getMonth() === activeMonth && d.getFullYear() === selectedYear;
               }).length} Records
            </span>
          </div>
          <div className="flex-1 overflow-auto">
            <DataTable 
              columns={IN_COLUMNS}
              initialData={prepareTableData(inTransactions, activeMonth, selectedYear)}
              comboboxFields={{ 
                seller: masters.sellers.map(s => s.name), 
                jobber: masters.jobbers.map(j => j.name)
              }}
              onSave={handleUpdate}
              onAddNewOption={handleAddNewOption}
              onDelete={(id, pass) => handleDelete(id, pass, 'IN')}
              hideFilters={true}
            />
          </div>
        </div>

        {/* Table OUT */}
        <div className="flex-1 min-h-0 bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 py-2 bg-[#F1F5F9] border-b border-[#E2E8F0] flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#0F172A] flex items-center gap-2">
              <TrendingDown size={14} className="text-rose-500" /> Material Outward (OUT)
            </h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowAdjEntry(true)}
                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm"
                title="Add Deduction/Payment"
              >
                <Plus size={12} /> PAY
              </button>
              <span className="text-[10px] font-bold text-[#64748B] bg-white px-2 py-0.5 rounded border border-[#E2E8F0]">
                {outTransactions.filter(r => {
                   const d = new Date(r.date);
                   return d.getMonth() === activeMonth && d.getFullYear() === selectedYear;
                 }).length} Records
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            <DataTable 
              columns={OUT_COLUMNS}
              initialData={prepareTableData(outTransactions, activeMonth, selectedYear, showAdjEntry)}
              comboboxFields={{ 
                vendor: masters.vendors.map(v => v.name),
                jobber: masters.jobbers.map(j => j.name)
              }}
              onSave={handleUpdate}
              onAddNewOption={handleAddNewOption}
              onDelete={(id, pass, type) => handleDelete(id, pass, type || 'OUT')}
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
      {editModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] w-full max-w-sm p-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                 <Pencil size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0F172A] leading-tight">Edit Jobber Details</h3>
                <p className="text-xs text-[#64748B] mt-0.5 font-medium">Update name and opening balances.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5 ml-1">Name</label>
                <input type="text" value={editModal.jobberName} onChange={(e) => setEditModal({...editModal, jobberName: e.target.value})} className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" />
              </div>
              <div className="flex gap-3">
                 <div className="flex-1">
                   <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5 ml-1">Opening T1 (KG)</label>
                   <input type="number" value={editModal.openingStockT1} onChange={(e) => setEditModal({...editModal, openingStockT1: Number(e.target.value)})} className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-4 py-3 text-sm outline-none transition-all font-medium" />
                 </div>
                 <div className="flex-1">
                   <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5 ml-1">Opening T2 (KG)</label>
                   <input type="number" value={editModal.openingStockT2} onChange={(e) => setEditModal({...editModal, openingStockT2: Number(e.target.value)})} className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-4 py-3 text-sm outline-none transition-all font-medium" />
                 </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5 ml-1">Opening Amount (₹)</label>
                <input type="number" value={editModal.openingAmount} onChange={(e) => setEditModal({...editModal, openingAmount: Number(e.target.value)})} className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button onClick={() => setEditModal({...editModal, isOpen: false})} className="px-4 py-3 text-sm font-bold text-[#64748B] bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-xl transition-all">Cancel</button>
                <button onClick={() => handleEditJobber(editModal.jobberName, editModal.openingStockT1, editModal.openingStockT2, editModal.openingAmount)} className="px-4 py-3 text-sm font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl shadow-lg shadow-blue-200 transition-all">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
