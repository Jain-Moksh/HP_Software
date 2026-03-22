import { useState, useEffect } from 'react';
import { ArrowLeft, Box, Truck, Plus } from 'lucide-react';
import DataTable from '../components/DataTable';

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
      date: new Date().toISOString().split('T')[0],
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

export default function SellerReportDetail({ seller, onBack }) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [masters, setMasters] = useState({ jobbers: [] });
  
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [activeMonth, setActiveMonth]   = useState(currentMonth);
  const [showAdjEntry, setShowAdjEntry] = useState(false);

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const visibleMonths = (selectedYear === currentYear) ? MONTHS.slice(0, currentMonth + 1) : MONTHS;

  const fetchMasters = async () => {
    try {
      const resp = await fetch('http://localhost:5000/api/jobbers');
      const json = await resp.json();
      setMasters({ jobbers: json });
    } catch (err) {
      console.error('Master fetch error:', err);
    }
  };

  const fetchReport = async () => {
    try {
      const resp = await fetch(`http://localhost:5000/api/seller-report/${encodeURIComponent(seller.name)}`);
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
      const resp = await fetch(`http://localhost:5000/api/${apiPath}`, {
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
        const isNew = updatedRow.isDraft;
        const url = isNew 
          ? `http://localhost:5000/api/seller-adjustments`
          : `http://localhost:5000/api/seller-adjustments/${updatedRow.id}`;
        
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

      const resp = await fetch(`http://localhost:5000/api/transactions/in/${updatedRow.id}`, {
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
      let url = `http://localhost:5000/api/transactions/in/${id}`;
      if (tx_type === 'IN_ADJ') {
         url = `http://localhost:5000/api/seller-adjustments/${id}`;
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
    if (seller?.name) {
      fetchReport();
      fetchMasters();
    }
  }, [seller]);

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-screen">
      <p className="text-sm text-[#64748B]">Loading report...</p>
    </div>
  );
  
  if (!report) return (
    <div className="p-6 flex flex-col items-center justify-center h-screen gap-4">
      <p className="text-sm text-[#64748B]">No report data found.</p>
      <button onClick={onBack} className="text-[#2563EB] text-sm font-semibold underline">Go Back</button>
    </div>
  );

  const allTransactions = report.transactions || [];
  const transactions = allTransactions.filter(t => t.tx_type === 'IN' || t.tx_type === 'IN_ADJ');

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC]">
      {/* ── Compact Sticky Header ── */}
      <div className="flex-none bg-white border-b border-[#E2E8F0] px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-[#F1F5F9] rounded-lg text-[#64748B] hover:text-[#0F172A] transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
              {seller?.name}
              <span className="text-[10px] font-medium bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full uppercase tracking-wider">Seller Report</span>
            </h1>
            <p className="text-xs text-[#64748B]">Historical supply and payment status</p>
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
                className="p-1 hover:bg-white rounded border border-[#E2E8F0] text-rose-600 transition-all"
                title="Add Deduction/Payment"
              >
                <Plus size={14} />
              </button>
              <span className="text-[10px] font-bold text-[#64748B] bg-white px-2 py-0.5 rounded border border-[#E2E8F0]">
                {transactions.filter(r => {
                   const d = new Date(r.date);
                   return d.getMonth() === activeMonth && d.getFullYear() === selectedYear;
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
    </div>
  );
}
