import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Box } from 'lucide-react';
import DataTable from '../components/DataTable';

// ─── Transaction Table Columns ──────────────────────────────────────────────
const COLUMNS = [
  { 
    key: 'tx_type', 
    label: 'TX Type', 
    type: 'text',
    render: (val) => (
      <span className={`font-bold text-xs ${val === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
        {val}
      </span>
    )
  },
  { key: 'type1',    label: 'Type 1',    type: 'number' },
  { key: 'type2',    label: 'Type 2',    type: 'number' },
  { key: 'material', label: 'Material',  type: 'text', minWidth: '140px' },
  { key: 'rate',     label: 'Rate',      type: 'number', prefix: '₹' },
  { key: 'seller',   label: 'Seller',    type: 'combobox', minWidth: '120px' },
  { key: 'jobber',   label: 'Jobber',    type: 'combobox', minWidth: '120px' },
  { key: 'date',     label: 'Date',      type: 'date', minWidth: '120px' },
  { key: 'amount',   label: 'Amount',    type: 'computed', prefix: '₹' },
  { key: 'w',        label: 'W',         type: 'checkbox' },
  { key: 'b',        label: 'B',         type: 'checkbox' },
  { key: 'a',        label: 'A',         type: 'checkbox' },
];

export default function JobReportDetail({ jobber, onBack }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const resp = await fetch(`http://localhost:5000/api/job-report/${encodeURIComponent(jobber.name)}`);
        const json = await resp.json();
        
        // Map data for DataTable (_month, _year)
        const mappedTransactions = json.transactions.map(item => {
          const d = new Date(item.date);
          return {
            ...item,
            _month: d.getMonth(),
            _year: d.getFullYear()
          };
        });

        setReport({
          ...json,
          transactions: mappedTransactions
        });
      } catch (err) {
        console.error('Failed to fetch job report:', err);
      } finally {
        setLoading(false);
      }
    };
    if (jobber?.name) fetchReport();
  }, [jobber]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <p className="text-sm text-[#64748B]">Loading job report...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full gap-4">
        <p className="text-sm text-[#64748B]">No report data found for this jobber.</p>
        <button onClick={onBack} className="text-[#2563EB] text-sm font-semibold underline">Go Back</button>
      </div>
    );
  }

  const { openingStock, transactions, closingStock } = report;

  return (
    <div className="p-6 flex flex-col h-full bg-[#F8FAFC]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-[#0F172A]">{jobber?.name || 'Jobber Report'}</h2>
            <p className="text-sm text-[#64748B]">Monthly transaction and stock summary</p>
          </div>
        </div>
      </div>

      {/* Stock Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
        {/* Opening Stock */}
        <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
              <Box size={18} />
            </div>
            <h3 className="font-bold text-[#0F172A]">Opening Stock</h3>
          </div>
          <div className="flex gap-x-12">
            <div>
              <p className="text-xs text-[#64748B] uppercase font-semibold">Type 1</p>
              <p className="text-2xl font-bold text-[#0F172A]">{openingStock.type1}</p>
            </div>
            <div>
              <p className="text-xs text-[#64748B] uppercase font-semibold">Type 2</p>
              <p className="text-2xl font-bold text-[#0F172A]">{openingStock.type2}</p>
            </div>
          </div>
        </div>

        {/* Closing Stock */}
        <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-8 h-8 rounded flex items-center justify-center ${closingStock.type1 > openingStock.type1 ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
              {closingStock.type1 > openingStock.type1 ? <TrendingUp size={18} /> : <Box size={18} />}
            </div>
            <h3 className="font-bold text-[#0F172A]">Closing Stock</h3>
          </div>
          <div className="flex gap-x-12">
            <div>
              <p className="text-xs text-[#64748B] uppercase font-semibold">Type 1</p>
              <p className="text-2xl font-bold text-[#0F172A]">{closingStock.type1}</p>
            </div>
            <div>
              <p className="text-xs text-[#64748B] uppercase font-semibold">Type 2</p>
              <p className="text-2xl font-bold text-[#0F172A]">{closingStock.type2}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="flex-1 overflow-hidden min-h-[400px]">
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm h-full flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-slate-50/50">
            <h3 className="text-sm font-bold text-[#334155]">Transaction Records</h3>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">
              {transactions.length} Records
            </span>
          </div>
          <div className="flex-1 p-1">
            <DataTable 
              columns={COLUMNS} 
              initialData={transactions}
              comboboxFields={{ seller: [], jobber: [] }}
              onSave={handleUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
