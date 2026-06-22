import { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Box, Plus, IndianRupee, Pencil, FileText } from 'lucide-react';
import DataTable, { EditCombobox } from '../components/DataTable';
import EditMasterModal from '../components/EditMasterModal';
import API_BASE_URL from '../config';

const IN_COLUMNS = [
  { key: 'material', label: 'Material',  type: 'text', minWidth: '140px' },
  { key: 'type1',    label: 'Type 1',    type: 'stacked-number', subKey: 'type1_b' },
  { key: 'type2',    label: 'Type 2',    type: 'stacked-number', subKey: 'type2_b' },
  { key: 'seller',   label: 'Seller',    type: 'combobox' },
  { key: 'w',        label: 'W',         type: 'checkbox' },
  { key: 'b',        label: 'B',         type: 'checkbox' },
  { key: 'a',        label: 'A',         type: 'checkbox' },
  { key: 'date',     label: 'Date',      type: 'date' },
  { key: 'remark',   label: 'Remark',    type: 'text', minWidth: '160px' },
];

const OUT_COLUMNS = [
  { key: 'material', label: 'Material',     type: 'text', minWidth: '140px' },
  { key: 'type1',    label: 'Type 1',    type: 'stacked-number', subKey: 'type1_b' },
  { key: 'type2',    label: 'Type 2',    type: 'stacked-number', subKey: 'type2_b' },
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

const toLocalYYYYMMDD = (dateVal) => {
  if (!dateVal) return '';
  if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
    return dateVal;
  }
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dateStr = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dateStr}`;
};

const getLocalTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getLocalDateParts = (dateStr) => {
  if (!dateStr) {
    const d = new Date();
    return { month: d.getMonth(), year: d.getFullYear(), day: d.getDate() };
  }
  if (typeof dateStr === 'string' && !dateStr.includes('T')) {
    const parts = dateStr.split('-');
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

const formatNumberMax4Decimals = (val) => {
  if (val === undefined || val === null || val === '---') return val;
  const num = Number(val);
  if (isNaN(num)) return val;
  return Number(num.toFixed(4));
};

const prepareTableData = (data, month, year, openingStock = null, txType = 'IN') => {
  if (!data) return [];
  
  const allProcessed = (data || []).map(item => {
    const dateParts = getLocalDateParts(item.date);
    return {
      ...item,
      type1: item.type1 !== undefined && item.type1 !== '---' ? formatNumberMax4Decimals(item.type1) : item.type1,
      type2: item.type2 !== undefined && item.type2 !== '---' ? formatNumberMax4Decimals(item.type2) : item.type2,
      type1_b: item.type1_b !== undefined && item.type1_b !== '---' ? formatNumberMax4Decimals(item.type1_b) : item.type1_b,
      type2_b: item.type2_b !== undefined && item.type2_b !== '---' ? formatNumberMax4Decimals(item.type2_b) : item.type2_b,
      rate: item.rate !== undefined && item.rate !== '---' ? formatNumberMax4Decimals(item.rate) : item.rate,
      amount: item.amount !== undefined && item.amount !== '---' ? formatNumberMax4Decimals(item.amount) : item.amount,
      _month: item._month ?? dateParts.month,
      _year: item._year ?? dateParts.year
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
    type1: formatNumberMax4Decimals(matTotals.type1),
    type1_b: formatNumberMax4Decimals(matTotals.type1_b),
    type2: formatNumberMax4Decimals(matTotals.type2),
    type2_b: formatNumberMax4Decimals(matTotals.type2_b),
    material: '---',
    rate: '---',
    vendor: '---',
    seller: '---',
    remark: 'GROSS TOTAL',
    amount: formatNumberMax4Decimals(matTotals.amount),
    isTotal: true,
    isTotalHeader: true // to distinguish if needed
  });

  if (openingStock) {
    const isOut = txType === 'OUT';
    const finalT1 = isOut
      ? Number((openingStock.type1 - matTotals.type1).toFixed(3))
      : Number((matTotals.type1 + openingStock.type1).toFixed(3));
    const finalT2 = isOut
      ? Number((openingStock.type2 - matTotals.type2).toFixed(3))
      : Number((matTotals.type2 + openingStock.type2).toFixed(3));

    // Opening Stock Row
    result.push({
      id: `opening-stock-row-${month}-${year}`,
      type1: openingStock.type1,
      type2: openingStock.type2,
      material: '---',
      rate: '---',
      vendor: '---',
      seller: '---',
      remark: 'OPENING STOCK',
      amount: '---',
      isTotal: true,
      actionLabel: 'OPENING'
    });

    // Final Total Row
    result.push({
      id: `final-total-row-${month}-${year}`,
      type1: finalT1,
      type2: finalT2,
      material: '---',
      rate: '---',
      vendor: '---',
      seller: '---',
      remark: isOut ? 'CLOSING STOCK' : 'FINAL TOTAL',
      amount: '---',
      isTotal: true,
      actionLabel: isOut ? 'CLOSING' : 'FINAL'
    });
  }

  // Adjustment Rows
  const adjGroup = [...savedAdjRows];

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
   const [payModal, setPayModal] = useState({ isOpen: false, date: getLocalTodayString(), amount: '', remark: '' });
   const [activeTab, setActiveTab] = useState('OUT');
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

  const handleSavePayment = async () => {
    if (!payModal.date || !payModal.amount) {
      alert('Please enter a valid date and amount');
      return;
    }

    try {
      const payload = {
        jobber_id: jobber.id || report?.jobberId,
        amount: Number(payModal.amount),
        date: payModal.date,
        remark: payModal.remark
      };

      const resp = await fetch(`${API_BASE_URL}/adjustments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (resp.ok) {
        setPayModal({ isOpen: false, date: getLocalTodayString(), amount: '', remark: '' });
        fetchReport();
      } else {
        alert('Failed to save payment.');
      }
    } catch (err) {
      console.error('Save payment error:', err);
      alert('An error occurred while saving payment');
    }
  };

  const handleUpdate = async (updatedRow, type) => {
    if (updatedRow.isTotal) {
       fetchReport();
       return;
    }
    try {
      if (updatedRow.tx_type === 'OUT_ADJ') {
        if (!updatedRow.date) {
          alert('Please enter a valid date');
          fetchReport(); 
          return;
        }

        const url = `${API_BASE_URL}/adjustments/${updatedRow.id}`;
        
        const payload = {
          jobber_id: jobber.id || report?.jobberId || (await ensureMasterRecord('jobber', jobber.name)),
          amount: updatedRow.amount,
          date: updatedRow.date,
          remark: updatedRow.remark
        };

        const resp = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (resp.ok) {
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
        if (json.transactions) {
          json.transactions = json.transactions.map(tx => {
            if (tx.date) {
              tx.date = toLocalYYYYMMDD(tx.date);
            }
            return tx;
          });
        }
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
    const dateParts = getLocalDateParts(tx.date);
    const m = dateParts.month;
    const y = dateParts.year;
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

  // Format opening stock to max 4 decimal places
  openingStock.type1 = formatNumberMax4Decimals(openingStock.type1);
  openingStock.type2 = formatNumberMax4Decimals(openingStock.type2);

  // Calculate net for the current selected month
  const currentNet = allTransactions.reduce((acc, tx) => {
    const dateParts = getLocalDateParts(tx.date);
    const m = dateParts.month;
    const y = dateParts.year;
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
    type1: formatNumberMax4Decimals(openingStock.type1 + currentNet.type1),
    type2: formatNumberMax4Decimals(openingStock.type2 + currentNet.type2)
  };

  // Calculate Dynamic Opening/Closing Financial Balances (Amounts)
  const baseOpeningAmount = report?.openingAmount || 0;
  const openingAmount = allTransactions.reduce((acc, tx) => {
    const dateParts = getLocalDateParts(tx.date);
    const m = dateParts.month;
    const y = dateParts.year;
    if (y < selectedYear || (y === selectedYear && m < activeMonth)) {
      if (tx.tx_type === 'OUT') {
        acc += (Number(tx.amount) || 0);
      } else if (tx.tx_type === 'OUT_ADJ') {
        acc -= (Number(tx.amount) || 0);
      }
    }
    return acc;
  }, baseOpeningAmount);

  const currentNetAmount = allTransactions.reduce((acc, tx) => {
    const dateParts = getLocalDateParts(tx.date);
    const m = dateParts.month;
    const y = dateParts.year;
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

  // Calculate total inward for the selected month/year
  const monthlyInTransactions = inTransactions.filter(r => {
    const dateParts = getLocalDateParts(r.date);
    return dateParts.month === activeMonth && dateParts.year === selectedYear;
  });
  const totalInward = monthlyInTransactions.reduce((acc, row) => {
    acc.type1 += (Number(row.type1) || 0);
    acc.type2 += (Number(row.type2) || 0);
    return acc;
  }, { type1: 0, type2: 0 });

  // Calculate total outward for the selected month/year (excluding adjustments OUT_ADJ as in the gross total of the outward entry)
  const monthlyOutTransactions = outTransactions.filter(r => {
    const dateParts = getLocalDateParts(r.date);
    return dateParts.month === activeMonth && dateParts.year === selectedYear;
  });
  const monthlyOutMaterialRows = monthlyOutTransactions.filter(r => r.tx_type !== 'OUT_ADJ');
  const totalOutward = monthlyOutMaterialRows.reduce((acc, row) => {
    acc.type1 += (Number(row.type1) || 0);
    acc.type2 += (Number(row.type2) || 0);
    acc.amount += (Number(row.amount) || 0);
    return acc;
  }, { type1: 0, type2: 0, amount: 0 });

  // Calculate total payments/adjustments (OUT_ADJ) for the selected month/year
  const monthlyAdjustments = monthlyOutTransactions.filter(r => r.tx_type === 'OUT_ADJ');
  const totalPayment = monthlyAdjustments.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

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

      {/* ── Scrollable Body ── */}
      <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
        {/* TABS */}
        <div className="flex gap-2 shrink-0">
           <button 
             onClick={() => setActiveTab('IN')} 
             className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all ${
               activeTab === 'IN' ? 'bg-[#2563EB] text-white shadow-md' : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'
             }`}
           >
             <TrendingUp size={14} /> Material Inward (IN)
           </button>
           <button 
             onClick={() => setActiveTab('OUT')} 
             className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all ${
               activeTab === 'OUT' ? 'bg-[#2563EB] text-white shadow-md' : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'
             }`}
           >
             <TrendingDown size={14} /> Material Outward (OUT)
           </button>
           <button 
             onClick={() => setActiveTab('REPORTS')} 
             className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all ${
               activeTab === 'REPORTS' ? 'bg-[#2563EB] text-white shadow-md' : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'
             }`}
           >
             <FileText size={14} /> Reports
           </button>
        </div>

        {activeTab === 'IN' && (
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col shrink-0">
            <div className="px-4 py-2 bg-[#F1F5F9] border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#0F172A] flex items-center gap-2">
                <TrendingUp size={14} className="text-emerald-500" /> Material Inward (IN)
              </h3>
              <span className="text-[10px] font-bold text-[#64748B] bg-white px-2 py-0.5 rounded border border-[#E2E8F0]">
                 {inTransactions.filter(r => {
                   const dateParts = getLocalDateParts(r.date);
                   return dateParts.month === activeMonth && dateParts.year === selectedYear;
                 }).length} Records
              </span>
            </div>
            <div className="overflow-x-auto">
              <DataTable 
                columns={IN_COLUMNS}
                initialData={prepareTableData(inTransactions, activeMonth, selectedYear, null, 'IN')}
                comboboxFields={{ 
                  seller: masters.sellers.map(s => s.name), 
                  jobber: masters.jobbers.map(j => j.name)
                }}
                onSave={handleUpdate}
                onAddNewOption={handleAddNewOption}
                onDelete={(id, pass) => handleDelete(id, pass, 'IN')}
                hideFilters={true}
                noVerticalScroll={true}
              />
            </div>
          </div>
        )}

        {activeTab === 'OUT' && (
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col shrink-0">
            <div className="px-4 py-2 bg-[#F1F5F9] border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#0F172A] flex items-center gap-2">
                <TrendingDown size={14} className="text-rose-500" /> Material Outward (OUT)
              </h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setPayModal({ isOpen: true, date: getLocalTodayString(), amount: '', remark: '' })}
                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm"
                  title="Add Deduction/Payment"
                >
                  <Plus size={12} /> PAY
                </button>
                <span className="text-[10px] font-bold text-[#64748B] bg-white px-2 py-0.5 rounded border border-[#E2E8F0]">
                  {outTransactions.filter(r => {
                     const dateParts = getLocalDateParts(r.date);
                     return dateParts.month === activeMonth && dateParts.year === selectedYear;
                   }).length} Records
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <DataTable 
                columns={OUT_COLUMNS}
                initialData={prepareTableData(outTransactions, activeMonth, selectedYear, null, 'OUT')}
                comboboxFields={{ 
                  vendor: masters.vendors.map(v => v.name),
                  jobber: masters.jobbers.map(j => j.name)
                }}
                onSave={handleUpdate}
                onAddNewOption={handleAddNewOption}
                onDelete={(id, pass, type) => handleDelete(id, pass, type || 'OUT')}
                hideFilters={true}
                noVerticalScroll={true}
              />
            </div>
          </div>
        )}

        {activeTab === 'REPORTS' && (
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col shrink-0">
            <div className="px-4 py-2 bg-[#F1F5F9] border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#0F172A] flex items-center gap-2">
                <FileText size={14} className="text-[#2563EB]" /> Summary Report ({MONTHS[activeMonth]} {selectedYear})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#334155] text-white">
                    <th className="px-4 py-2 text-center text-xs font-semibold tracking-wide border-r border-[#475569] whitespace-nowrap">Particulars</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold tracking-wide border-r border-[#475569] whitespace-nowrap">Type 1</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold tracking-wide border-r border-[#475569] whitespace-nowrap">Type 2</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold tracking-wide whitespace-nowrap">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Row 1: Opening Stock */}
                  <tr className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]">
                    <td className="px-4 py-2.5 font-bold text-[#0F172A] border-r border-[#E2E8F0] text-center">Opening Stock</td>
                    <td className="px-4 py-2.5 font-mono text-center text-[#0F172A] border-r border-[#E2E8F0]">
                      {openingStock.type1 !== undefined && openingStock.type1 !== null ? `${openingStock.type1}kg` : '0kg'}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-center text-[#0F172A] border-r border-[#E2E8F0]">
                      {openingStock.type2 !== undefined && openingStock.type2 !== null ? `${openingStock.type2}kg` : '0kg'}
                    </td>
                    <td className="px-4 py-2.5 font-mono font-semibold text-center text-violet-600">
                      ₹{openingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>

                  {/* Row 2: Total Inward */}
                  <tr className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]">
                    <td className="px-4 py-2.5 font-bold text-[#0F172A] border-r border-[#E2E8F0] text-center">Total Inward</td>
                    <td className="px-4 py-2.5 font-mono text-center text-[#0F172A] border-r border-[#E2E8F0]">
                      {totalInward.type1 !== undefined && totalInward.type1 !== null ? `${formatNumberMax4Decimals(totalInward.type1)}kg` : '0kg'}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-center text-[#0F172A] border-r border-[#E2E8F0]">
                      {totalInward.type2 !== undefined && totalInward.type2 !== null ? `${formatNumberMax4Decimals(totalInward.type2)}kg` : '0kg'}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-center text-slate-400">
                      ---
                    </td>
                  </tr>

                  {/* Row 3: Total Outward */}
                  <tr className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]">
                    <td className="px-4 py-2.5 font-bold text-[#0F172A] border-r border-[#E2E8F0] text-center">Total Outward</td>
                    <td className="px-4 py-2.5 font-mono text-center text-[#0F172A] border-r border-[#E2E8F0]">
                      {totalOutward.type1 !== undefined && totalOutward.type1 !== null ? `${formatNumberMax4Decimals(totalOutward.type1)}kg` : '0kg'}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-center text-[#0F172A] border-r border-[#E2E8F0]">
                      {totalOutward.type2 !== undefined && totalOutward.type2 !== null ? `${formatNumberMax4Decimals(totalOutward.type2)}kg` : '0kg'}
                    </td>
                    <td className="px-4 py-2.5 font-mono font-semibold text-center text-[#0F172A]">
                      ₹{totalOutward.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>

                  {/* Row 4: Total Payment */}
                  <tr className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]">
                    <td className="px-4 py-2.5 font-bold text-[#0F172A] border-r border-[#E2E8F0] text-center">Total Payment</td>
                    <td className="px-4 py-2.5 font-mono text-center text-slate-400 border-r border-[#E2E8F0]">
                      ---
                    </td>
                    <td className="px-4 py-2.5 font-mono text-center text-slate-400 border-r border-[#E2E8F0]">
                      ---
                    </td>
                    <td className="px-4 py-2.5 font-mono font-semibold text-center text-rose-600">
                      ₹{totalPayment.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>

                  {/* Row 5: Closing Stock */}
                  <tr className="bg-slate-50 font-bold border-b border-[#E2E8F0] hover:bg-[#F1F5F9]">
                    <td className="px-4 py-2.5 text-[#0F172A] border-r border-[#E2E8F0] text-center">Closing Stock</td>
                    <td className="px-4 py-2.5 font-mono text-center text-[#0F172A] border-r border-[#E2E8F0]">
                      {formatNumberMax4Decimals((openingStock.type1 || 0) + (totalInward.type1 || 0) - (totalOutward.type1 || 0))}kg
                    </td>
                    <td className="px-4 py-2.5 font-mono text-center text-[#0F172A] border-r border-[#E2E8F0]">
                      {formatNumberMax4Decimals((openingStock.type2 || 0) + (totalInward.type2 || 0) - (totalOutward.type2 || 0))}kg
                    </td>
                    <td className="px-4 py-2.5 font-mono font-bold text-center text-violet-600">
                      ₹{(openingAmount + (totalOutward.amount || 0) - (totalPayment || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
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
      {payModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] w-full max-w-sm p-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                 <IndianRupee size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0F172A] leading-tight">Add Payment</h3>
                <p className="text-xs text-[#64748B] mt-0.5 font-medium">Enter payment details below.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5 ml-1">Date</label>
                <input type="date" value={payModal.date} onChange={(e) => setPayModal({...payModal, date: e.target.value})} className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5 ml-1">Amount (₹)</label>
                <input type="number" value={payModal.amount} onChange={(e) => setPayModal({...payModal, amount: e.target.value})} className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5 ml-1">Remarks</label>
                <input type="text" value={payModal.remark} onChange={(e) => setPayModal({...payModal, remark: e.target.value})} className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium" />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button onClick={() => setPayModal({...payModal, isOpen: false})} className="px-4 py-3 text-sm font-bold text-[#64748B] bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-xl transition-all">Cancel</button>
                <button onClick={handleSavePayment} className="px-4 py-3 text-sm font-bold text-white bg-[#E11D48] hover:bg-[#BE123C] rounded-xl shadow-lg shadow-rose-200 transition-all">Save Payment</button>
              </div>
            </div>
          </div>
        </div>
      )}

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
