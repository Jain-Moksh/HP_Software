import {
  Download,
  Code2,
  Calculator,
  RefreshCw,
  Filter,
  Columns3,
  FileDown,
} from 'lucide-react';
import DataTable from '../components/DataTable';

// ─── Material-In column definitions ──────────────────────────────────────────
const COLUMNS = [
  { key: 'type1',    label: 'Type 1',    type: 'number' },
  { key: 'type2',    label: 'Type 2',    type: 'number' },
  { key: 'material', label: 'Material',  type: 'text', autoFocus: true, minWidth: '140px' },
  { key: 'rate',     label: 'Rate',      type: 'number', prefix: '₹' },
  { key: 'seller',   label: 'Seller',    type: 'combobox', minWidth: '120px' },
  { key: 'jobber',   label: 'Jobber',    type: 'combobox', minWidth: '120px' },
  { key: 'date',     label: 'Date',      type: 'date', minWidth: '120px' },
  { key: 'amount',   label: 'Amount',    type: 'computed', prefix: '₹' },
  { key: 'w',        label: 'W',         type: 'checkbox' },
  { key: 'b',        label: 'B',         type: 'checkbox' },
  { key: 'a',        label: 'A',         type: 'checkbox' },
];

// ─── calculation helper ──────────────────────────────────────────────────────
const calculateAmount = (row) => {
  const t1 = Number(row.type1) || 0;
  const t2 = Number(row.type2) || 0;
  const r  = Number(row.rate)  || 0;
  let total = (t1 + t2) * r;
  if (row.b) total = total + 0.18 * total;
  return { ...row, amount: Math.round(total) };
};

// ─── data generator ──────────────────────────────────────────────────────────
const generateMockData = () => {
  const data = [];
  let id = 1;

  const createEntries = (monthIdx, year, count, materialBase) => {
    for (let i = 1; i <= count; i++) {
      const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
      const month = String(monthIdx + 1).padStart(2, '0');
      const entry = {
        id: id++,
        type1: 100 + i,
        type2: 200 + (i % 5),
        material: `${materialBase} - Batch ${i}`,
        rate: 70 + Math.floor(Math.random() * 50),
        seller: ['Raj Traders', 'Kumar Supplies', 'Gupta Corp.', 'Steel Hub', 'Joshi Goods'][i % 5],
        jobber: ['Mehta & Co.', 'Patel Bros.', 'Shah Traders', 'Iyer & Sons'][i % 4],
        date: `${year}-${month}-${day}`,
        w: i % 2 === 0,
        b: i % 3 === 0,
        a: i % 4 === 0,
        _month: monthIdx,
        _year: year,
      };
      entry.amount = calculateAmount(entry).amount;
      data.push(entry);
    }
  };

  createEntries(0, 2026, 30, 'HDPE Granules'); // Jan
  createEntries(1, 2026, 20, 'NBR Rubber');    // Feb
  createEntries(2, 2026, 25, 'PVC Pipes');     // Mar

  return data;
};

const ALL_DATA = generateMockData();

// ─── toolbar icons ───────────────────────────────────────────────────────────
const TOOLBAR_ICONS = [
  { icon: FileDown,   label: 'Export'     },
  { icon: Code2,      label: 'Code'       },
  { icon: Calculator, label: 'Calculator' },
  { icon: RefreshCw,  label: 'Refresh'    },
  { icon: Filter,     label: 'Filter'     },
  { icon: Columns3,   label: 'Columns'    },
  { icon: Download,   label: 'Download'   },
];

export default function MaterialIn() {
  return (
    <div className="p-6 flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-start justify-between mb-5 flex-shrink-0">
        <div>
          <h2 className="text-base font-semibold text-[#0F172A]">Material Records</h2>
          <p className="text-xs text-[#64748B] mt-0.5">Manage and track all material entries</p>
        </div>

        {/* Toolbar icons */}
        <div className="flex items-center gap-1.5">
          {TOOLBAR_ICONS.map(({ icon: Icon, label }) => (
            <button
              key={label}
              title={label}
              className="w-8 h-8 flex items-center justify-center rounded border border-[#E2E8F0] text-[#334155] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors bg-white"
            >
              <Icon size={15} />
            </button>
          ))}
        </div>
      </div>

      {/* Table (takes remaining height) */}
      <div className="flex-1 overflow-hidden">
        <DataTable
          columns={COLUMNS}
          initialData={ALL_DATA}
          comboboxFields={{ seller: [], jobber: [] }}
          calculateFields={calculateAmount}
          checkboxRecalcFields={['b']}
        />
      </div>
    </div>
  );
}
