import {
  Download,
  Code2,
  Calculator,
  RefreshCw,
  Filter,
  Columns3,
  FileDown,
} from 'lucide-react';
import MaterialTable from '../components/MaterialTable';

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
        <MaterialTable />
      </div>
    </div>
  );
}
