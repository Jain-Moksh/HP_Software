import { useState, useEffect } from 'react';
import {
  Download,
  Calculator,
  RefreshCw,
  Filter,
  Columns3,
  FileDown,
  Plus,
  RotateCcw,
  X,
  Save,
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
  { id: 'new',        icon: Plus,        label: 'New Entry'   },
  { id: 'export',     icon: FileDown,    label: 'Export'      },
  { id: 'calculator', icon: Calculator,  label: 'Calculator'  },
  { id: 'refresh',    icon: RefreshCw,   label: 'Refresh'     },
  { id: 'filter',     icon: Filter,      label: 'Filter'      },
  { id: 'columns',    icon: Columns3,    label: 'Columns'     },
  { id: 'download',   icon: Download,    label: 'Download'    },
];

const INITIAL_ROW = {
  type1: '',
  type2: '',
  material: '',
  rate: '',
  seller: '',
  jobber: '',
  date: new Date().toISOString().split('T')[0],
  w: false,
  b: false,
  a: false,
  amount: 0
};

export default function MaterialIn() {
  const [data, setData] = useState([]);
  const [showEntryRow, setShowEntryRow] = useState(false);
  const [newRow, setNewRow] = useState(INITIAL_ROW);
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const resp = await fetch('http://localhost:5000/api/material');
      const json = await resp.json();
      
      // Map backend data to include _month and _year for DataTable
      const mapped = json.map(item => {
        const d = new Date(item.date);
        return {
          ...item,
          _month: d.getMonth(),
          _year: d.getFullYear()
        };
      });
      setData(mapped);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToolbarClick = (id) => {
    if (id === 'new') setShowEntryRow(true);
    if (id === 'refresh') fetchData();
  };

  const handleInputChange = (field, value) => {
    let updatedRow = { ...newRow, [field]: value };
    if (field === 'type1' || field === 'type2' || field === 'rate' || field === 'b') {
      updatedRow = calculateAmount(updatedRow);
    }
    setNewRow(updatedRow);
  };

  const handleSave = async () => {
    try {
      // Data preparation
      const entryToSave = {
        ...newRow,
        type1: Number(newRow.type1) || 0,
        type2: Number(newRow.type2) || 0,
        rate: Number(newRow.rate) || 0,
        amount: Number(newRow.amount) || 0
      };

      const resp = await fetch('http://localhost:5000/api/material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryToSave),
      });

      if (resp.ok) {
        setShowEntryRow(false);
        setNewRow(INITIAL_ROW);
        fetchData(); // Refresh main table
      } else {
        alert('Failed to save data. Please check backend connection.');
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('Error connecting to server.');
    }
  };

  const handleRedo = () => setNewRow(INITIAL_ROW);
  const handleCancel = () => {
    setShowEntryRow(false);
    setNewRow(INITIAL_ROW);
  };

  return (
    <div className="p-6 flex flex-col h-full bg-[#F8FAFC]">
      {/* Page header */}
      <div className="flex items-start justify-between mb-5 flex-shrink-0">
        <div>
          <h2 className="text-base font-semibold text-[#0F172A]">Material Records</h2>
          <p className="text-xs text-[#64748B] mt-0.5">Manage and track all material entries</p>
        </div>

        {/* Toolbar icons */}
        <div className="flex items-center gap-1.5">
          {TOOLBAR_ICONS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => handleToolbarClick(id)}
              title={label}
              className="w-8 h-8 flex items-center justify-center rounded border border-[#E2E8F0] text-[#334155] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors bg-white shadow-sm"
            >
              <Icon size={15} />
            </button>
          ))}
        </div>
      </div>

      {/* New Entry Table Section */}
      {showEntryRow && (
        <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="bg-[#334155] text-white px-4 py-2 text-xs font-semibold tracking-wide">
              New Data Entry
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    {COLUMNS.map(col => (
                      <th key={col.key} className="px-3 py-2 text-center text-[10px] font-bold text-[#64748B] uppercase tracking-wider border-r border-[#E2E8F0] last:border-r-0">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {COLUMNS.map(col => (
                      <td key={col.key} className="px-2 py-3 border-r border-[#E2E8F0] last:border-r-0">
                        {col.type === 'checkbox' ? (
                          <div className="flex justify-center">
                            <input
                              type="checkbox"
                              checked={newRow[col.key]}
                              onChange={(e) => handleInputChange(col.key, e.target.checked)}
                              className="accent-[#2563EB] w-4 h-4 cursor-pointer"
                            />
                          </div>
                        ) : col.type === 'computed' ? (
                          <div className="text-center font-mono font-bold text-[#0F172A]">
                             {col.prefix}{newRow[col.key]?.toLocaleString()}
                          </div>
                        ) : (
                          <input
                            type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                            value={newRow[col.key]}
                            onChange={(e) => handleInputChange(col.key, e.target.value)}
                            placeholder={col.label}
                            className={`w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded px-2 py-1.5 text-xs text-[#0F172A] outline-none focus:ring-1 focus:ring-[#2563EB] transition-all text-center`}
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            {/* Entry Actions */}
            <div className="flex items-center justify-end gap-3 p-3 bg-[#F8FAFC] border-t border-[#E2E8F0]">
              <button 
                onClick={handleRedo}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#64748B] hover:text-[#0F172A] transition-colors"
                title="Reset fields"
              >
                <RotateCcw size={14} /> Redo
              </button>
              <button 
                onClick={handleCancel}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#64748B] hover:text-[#EF4444] transition-colors"
              >
                <X size={14} /> Cancel
              </button>
              <button 
                onClick={handleSave}
                className="flex items-center gap-1.5 px-5 py-1.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded shadow-sm transition-colors"
              >
                <Save size={14} /> Save Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table (takes remaining height) */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full text-xs text-[#64748B]">Loading data...</div>
        ) : (
          <DataTable
            columns={COLUMNS}
            initialData={data}
            comboboxFields={{ seller: [], jobber: [] }}
            calculateFields={calculateAmount}
            checkboxRecalcFields={['b']}
          />
        )}
      </div>
    </div>
  );
}
