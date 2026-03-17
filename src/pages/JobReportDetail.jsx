import { ArrowLeft, TrendingUp, TrendingDown, Box } from 'lucide-react';
import DataTable from '../components/DataTable';

// ─── Transaction Table Columns ──────────────────────────────────────────────
const COLUMNS = [
  { 
    key: 'txType', 
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

// ─── Mock Data ──────────────────────────────────────────────────────────────
const MOCK_TRANSACTIONS = [
  { id: 1, txType: "IN",  type1: 100, type2: 50, material: "HDPE", rate: 200, seller: "Patel Industries", jobber: "Rakesh Job", date: "2026-03-02", amount: 20000, w:true, b:false, a:false, _month: 2, _year: 2026 },
  { id: 2, txType: "OUT", type1: 40,  type2: 20, material: "HDPE", rate: 200, seller: "Patel Industries", jobber: "Rakesh Job", date: "2026-03-05", amount: 8000,  w:false, b:true, a:false, _month: 2, _year: 2026 },
  { id: 3, txType: "IN",  type1: 150, type2: 80, material: "PVC",  rate: 150, seller: "Kumar Supplies",  jobber: "Rakesh Job", date: "2026-03-10", amount: 34500, w:true, b:false, a:true,  _month: 2, _year: 2026 },
];

const OPENING_STOCK = {
  type1: 500,
  type2: 300,
};

// ─── Calculation Helper ─────────────────────────────────────────────────────
const calculateTotals = (transactions) => {
  const totals = {
    type1In: 0, type1Out: 0,
    type2In: 0, type2Out: 0
  };

  transactions.forEach(tx => {
    if (tx.txType === 'IN') {
      totals.type1In += (Number(tx.type1) || 0);
      totals.type2In += (Number(tx.type2) || 0);
    } else {
      totals.type1Out += (Number(tx.type1) || 0);
      totals.type2Out += (Number(tx.type2) || 0);
    }
  });

  return totals;
};

export default function JobReportDetail({ jobber, onBack }) {
  const totals = calculateTotals(MOCK_TRANSACTIONS);
  
  const closingStock = {
    type1: OPENING_STOCK.type1 + totals.type1In - totals.type1Out,
    type2: OPENING_STOCK.type2 + totals.type2In - totals.type2Out,
  };

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
            <p className="text-sm text-[#64748B]">Monthly transaction and stock summary • March 2026</p>
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
              <p className="text-2xl font-bold text-[#0F172A]">{OPENING_STOCK.type1}</p>
            </div>
            <div>
              <p className="text-xs text-[#64748B] uppercase font-semibold">Type 2</p>
              <p className="text-2xl font-bold text-[#0F172A]">{OPENING_STOCK.type2}</p>
            </div>
          </div>
        </div>

        {/* Closing Stock */}
        <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-8 h-8 rounded flex items-center justify-center ${closingStock.type1 > OPENING_STOCK.type1 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {closingStock.type1 > OPENING_STOCK.type1 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
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
              {MOCK_TRANSACTIONS.length} Records
            </span>
          </div>
          <div className="flex-1 p-1">
            <DataTable 
              columns={COLUMNS} 
              initialData={MOCK_TRANSACTIONS}
              comboboxFields={{ seller: [], jobber: [] }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
