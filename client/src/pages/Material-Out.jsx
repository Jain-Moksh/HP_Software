import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
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
import DataTable, { EditCombobox } from '../components/DataTable';
import DateField from '../components/DateField';
import API_BASE_URL from '../config';

// ─── Material-Out column definitions ─────────────────────────────────────────
const COLUMNS = [
  { key: 'type1',    label: 'Type 1',    type: 'number' },
  { key: 'type2',    label: 'Type 2',    type: 'number' },
  { key: 'material', label: 'Material',  type: 'text', autoFocus: true, minWidth: '140px' },
  { key: 'rate',     label: 'Rate',      type: 'number', prefix: '₹' },
  { key: 'jobber',   label: 'Jobber',    type: 'combobox', minWidth: '120px' },
  { key: 'vendor',   label: 'Vendor',    type: 'combobox', minWidth: '120px' },
  { key: 'date',     label: 'Date',      type: 'date', minWidth: '100px' },
  { key: 'amount',   label: 'Amount',    type: 'computed', prefix: '₹' },
  { key: 'remark',   label: 'Remark',    type: 'text', minWidth: '160px' },
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

const INITIAL_ROW = {
  type1: '',
  type2: '',
  material: '',
  rate: '',
  jobber: '',
  vendor: '',
  date: '',
  remark: '',
  amount: 0
};

const TOOLBAR_ICONS = [
  { id: 'new',        icon: Plus,        label: 'New Entry'   },
  { id: 'export',     icon: FileDown,    label: 'Export'      },
  { id: 'calculator', icon: Calculator,  label: 'Calculator'  },
  { id: 'refresh',    icon: RefreshCw,   label: 'Refresh'     },
  { id: 'filter',     icon: Filter,      label: 'Filter'      },
  { id: 'columns',    icon: Columns3,    label: 'Columns'     },
  { id: 'download',   icon: Download,    label: 'Download'    },
];

export default function MaterialOut() {
  const { setHeaderActions } = useOutletContext();
  const [data, setData] = useState([]);
  const [showEntryRow, setShowEntryRow] = useState(false);

  const [masters, setMasters] = useState({ vendors: [], jobbers: [] });
  const [newRow, setNewRow] = useState(INITIAL_ROW);
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/transactions/out`);
      const json = await resp.json();
      
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
  }, []);

  const fetchMasters = useCallback(async () => {
    try {
      const [vRes, jRes] = await Promise.all([
        fetch(`${API_BASE_URL}/vendors`),
        fetch(`${API_BASE_URL}/jobbers`)
      ]);
      const [vendors, jobbers] = await Promise.all([vRes.json(), jRes.json()]);
      setMasters({ vendors, jobbers });
    } catch (err) {
      console.error('Master fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchMasters();
  }, [fetchData, fetchMasters]);

  const ensureMasterRecord = async (type, name) => {
    if (!name) return null;
    const list = type === 'vendor' ? masters.vendors : masters.jobbers;
    const existing = list.find(item => item.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing.id;

    const apiPath = type === 'vendor' ? 'vendors' : 'jobbers';
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
      } else if (resp.status === 400) {
         await fetchMasters();
         const refetch = await fetch(`${API_BASE_URL}/${apiPath}`);
         const freshList = await refetch.json();
         const found = freshList.find(item => item.name.toLowerCase() === name.toLowerCase());
         if (found) return found.id;
      }
    } catch (err) { console.error(err); }
    return null;
  };

  const handleAddNewOption = async (field, value) => {
    await ensureMasterRecord(field, value);
  };

  const handleToolbarClick = useCallback((id) => {
    if (id === 'new') setShowEntryRow(true);
    if (id === 'refresh') {
      fetchData();
      fetchMasters();
    }
  }, [fetchData, fetchMasters]);

  // Set header actions
  useEffect(() => {
    if (setHeaderActions) {
      setHeaderActions(
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
      );
    }
    return () => setHeaderActions?.(null);
  }, [setHeaderActions, masters, handleToolbarClick]); 

  const handleInputChange = (field, value) => {
    let updatedRow = { ...newRow, [field]: value };
    
    if (field === 'type1' && value !== '') {
      updatedRow.type2 = '';
    } else if (field === 'type2' && value !== '') {
      updatedRow.type1 = '';
    }

    if (field === 'type1' || field === 'type2' || field === 'rate' || field === 'b') {
      updatedRow = calculateAmount(updatedRow);
    }
    setNewRow(updatedRow);
  };

  const handleSave = async () => {
    try {
      if (!(newRow.type1 || newRow.type2)) {
        alert('Please enter either Type 1 or Type 2');
        return;
      }
      if (!newRow.material || !newRow.rate || !newRow.vendor || !newRow.jobber || !newRow.date) {
        alert('All fields except Remark are mandatory');
        return;
      }
      const vendorId = await ensureMasterRecord('vendor', newRow.vendor);
      const jobberId = await ensureMasterRecord('jobber', newRow.jobber);

      if (!vendorId || !jobberId) return;

      const entryToSave = {
        ...newRow,
        jobber_id: jobberId,
        vendor_id: vendorId,
        type1: Number(newRow.type1) || 0,
        type2: Number(newRow.type2) || 0,
        rate: Number(newRow.rate) || 0,
        amount: Number(newRow.amount) || 0
      };

      const resp = await fetch(`${API_BASE_URL}/transactions/out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryToSave),
      });

      if (resp.ok) {
        // setShowEntryRow(false);
        setNewRow(INITIAL_ROW);
        fetchData();
      } else {
        const error = await resp.json();
        alert(error.error || 'Failed to save data.');
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('Error connecting to server.');
    }
  };

  const handleUpdate = async (updatedRow) => {
    try {
      const vendorId = await ensureMasterRecord('vendor', updatedRow.vendor);
      const jobberId = await ensureMasterRecord('jobber', updatedRow.jobber);

      if (!vendorId || !jobberId) return;

      const payload = {
        ...updatedRow,
        vendor_id: vendorId,
        jobber_id: jobberId
      };

      const resp = await fetch(`${API_BASE_URL}/transactions/out/${updatedRow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        alert('Failed to update record.');
        fetchData();
      }
    } catch (err) {
      console.error('Update error:', err);
      alert('Error connecting to server.');
      fetchData();
    }
  };

  const handleDelete = async (id, password) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/transactions/out/${id}`, {
        method: 'DELETE',
        headers: { 'x-delete-password': password }
      });

      if (resp.ok) {
        fetchData();
      } else {
        const error = await resp.json();
        alert(error.message || 'Failed to delete record.');
      }
    } catch (err) {
      console.error('Delete error:', err);
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
      {/* Redundant Page header removed - now in global Header */}

      {showEntryRow && (
        <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="bg-[#334155] text-white px-4 py-2 text-xs font-semibold tracking-wide">
              New Data Entry
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border-collapse text-center">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    {COLUMNS.map(col => (
                      <th key={col.key} className="px-3 py-2 text-[10px] font-bold text-[#64748B] uppercase tracking-wider border-r border-[#E2E8F0] last:border-r-0">
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
                        ) : col.type === 'combobox' ? (
                          <div className="flex justify-center">
                            <EditCombobox
                              field={col.key}
                              value={newRow[col.key]}
                              options={masters[col.key === 'jobber' ? 'jobbers' : 'vendors'].map(m => m.name)}
                              onChange={handleInputChange}
                              onAddNewOption={handleAddNewOption}
                              onKeyDown={() => {}}
                            />
                          </div>
                        ) : col.type === 'computed' ? (
                          <div className="font-mono font-bold text-[#0F172A]">
                             {col.prefix}{newRow[col.key]?.toLocaleString()}
                          </div>
                        ) : col.type === 'date' ? (
                          <DateField
                            field={col.key}
                            value={newRow[col.key]}
                            onChange={handleInputChange}
                            onKeyDown={() => {}}
                          />
                        ) : col.key === 'remark' ? (
                          <textarea
                            value={newRow[col.key]}
                            onChange={(e) => handleInputChange(col.key, e.target.value)}
                            placeholder={col.label}
                            rows={1}
                            className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded px-2 py-1.5 text-xs text-[#0F172A] outline-none focus:ring-1 focus:ring-[#2563EB] transition-all text-center resize-y min-h-[30px]"
                          />
                        ) : (
                          <input
                            type={col.type === 'number' ? 'number' : 'text'}
                            value={newRow[col.key]}
                            onChange={(e) => handleInputChange(col.key, e.target.value)}
                            disabled={
                              (col.key === 'type1' && Number(newRow.type2) > 0) || 
                              (col.key === 'type2' && Number(newRow.type1) > 0)
                            }
                            placeholder={col.label}
                            className={`w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded px-2 py-1.5 text-xs text-[#0F172A] outline-none focus:ring-1 focus:ring-[#2563EB] transition-all text-center ${(col.key === 'type1' && Number(newRow.type2) > 0) || (col.key === 'type2' && Number(newRow.type1) > 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-end gap-3 p-3 bg-[#F8FAFC] border-t border-[#E2E8F0]">
              <button onClick={handleRedo} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#64748B] hover:text-[#0F172A] transition-colors"><RotateCcw size={14} /> Redo</button>
              <button onClick={handleCancel} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#64748B] hover:text-[#EF4444] transition-colors"><X size={14} /> Cancel</button>
              <button onClick={handleSave} className="flex items-center gap-1.5 px-5 py-1.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded shadow-sm transition-colors"><Save size={14} /> Save Record</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full text-xs text-[#64748B]">Loading data...</div>
        ) : (
          <DataTable
            columns={COLUMNS}
            initialData={data}
            comboboxFields={{ 
              jobber: masters.jobbers.map(j => j.name), 
              vendor: masters.vendors.map(v => v.name) 
            }}
            calculateFields={calculateAmount}
            checkboxRecalcFields={['b']}
            onSave={handleUpdate}
            onDelete={handleDelete}
            onAddNewOption={handleAddNewOption}
          />
        )}
      </div>
    </div>
  );
}
