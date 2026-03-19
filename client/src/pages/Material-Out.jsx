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

// ─── Material-Out column definitions ─────────────────────────────────────────
const COLUMNS = [
  { key: 'quantity',     label: 'Quantity',      type: 'number' },
  { key: 'materialType', label: 'Material Type', type: 'text', autoFocus: true, minWidth: '160px' },
  { key: 'date',         label: 'Date',          type: 'date', minWidth: '120px' },
  { key: 'sender',       label: 'Sender',        type: 'combobox', minWidth: '140px' },
  { key: 'receiver',     label: 'Receiver',      type: 'combobox', minWidth: '140px' },
];

// ─── mock data generator ─────────────────────────────────────────────────────
const generateMaterialOutData = () => {
  const data = [];
  let id = 1;

  const senders   = ['Warehouse', 'Main Storage', 'Godown A', 'Godown B', 'Central Depot'];
  const receivers = ['Jobber Unit 1', 'Factory', 'Processing Plant', 'Sub-Assembly', 'Packaging Unit'];
  const materials = ['HDPE', 'PVC', 'NBR Rubber', 'ABS Granules', 'PP Sheet'];

  const createEntries = (monthIdx, year, count) => {
    for (let i = 1; i <= count; i++) {
      const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
      const month = String(monthIdx + 1).padStart(2, '0');
      data.push({
        id: id++,
        quantity: 50 + Math.floor(Math.random() * 200),
        materialType: materials[i % materials.length],
        date: `${year}-${month}-${day}`,
        sender: senders[i % senders.length],
        receiver: receivers[i % receivers.length],
        _month: monthIdx,
        _year: year,
      });
    }
  };

  createEntries(0, 2026, 20); // Jan
  createEntries(1, 2026, 15); // Feb
  createEntries(2, 2026, 18); // Mar

  return data;
};

const ALL_DATA = generateMaterialOutData();

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

export default function MaterialOut() {
  return (
    <div className="p-6 flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-start justify-between mb-5 flex-shrink-0">
        <div>
          <h2 className="text-base font-semibold text-[#0F172A]">Material-Out Records</h2>
          <p className="text-xs text-[#64748B] mt-0.5">Track all outgoing material dispatches</p>
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
          comboboxFields={{ sender: [], receiver: [] }}
        />
      </div>
    </div>
  );
}
