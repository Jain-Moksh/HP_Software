import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Search
} from 'lucide-react';
import DataTable, { EditCombobox } from '../components/DataTable';
import DateField from '../components/DateField';
import API_BASE_URL from '../config';

// ─── Material-In column definitions ──────────────────────────────────────────
const COLUMNS = [
  { key: 'type1',    label: 'Type 1',    type: 'number' },
  { key: 'type2',    label: 'Type 2',    type: 'number' },
  { key: 'material', label: 'Material',  type: 'text', autoFocus: true, minWidth: '140px' },
  { key: 'rate',     label: 'Rate',      type: 'number', prefix: '₹' },
  { key: 'seller',   label: 'Seller',    type: 'combobox', minWidth: '120px' },
  { key: 'jobber',   label: 'Jobber',    type: 'combobox', minWidth: '120px' },
  { key: 'date',     label: 'Date',      type: 'date', minWidth: '100px' },
  { key: 'amount',   label: 'Amount',    type: 'computed', prefix: '₹' },
  { key: 'w',        label: 'W',         type: 'checkbox' },
  { key: 'b',        label: 'B',         type: 'checkbox' },
  { key: 'a',        label: 'A',         type: 'checkbox' },
  { key: 'remark',   label: 'Remark',    type: 'text', minWidth: '160px' },
];

// ─── calculation helper ──────────────────────────────────────────────────────
const calculateAmount = (row, field) => {
  if (field === 'amount') return row;
  const t1 = Number(row.type1) || 0;
  const t2 = Number(row.type2) || 0;
  const r  = Number(row.rate)  || 0;
  let total = (t1 + t2) * r;
  if (row.b) total = total + 0.18 * total;
  return { ...row, amount: Math.round(total) };
};

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

const getInitialRow = () => {
  const d = new Date();
  return {
    type1: '',
    type2: '',
    material: '',
    rate: '',
    seller: '',
    jobber: '',
    date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    remark: '',
    w: false,
    b: false,
    a: false,
    amount: 0
  };
};

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

export default function MaterialIn() {
  const { setHeaderActions } = useOutletContext();
  const [data, setData] = useState([]);
  const [showEntryRow, setShowEntryRow] = useState(false);

  const [masters, setMasters] = useState({ sellers: [], jobbers: [] });
  const [searchFilters, setSearchFilters] = useState({ seller: '', jobber: '', material: '' });
  const [newRow, setNewRow] = useState(getInitialRow());
  const [loading, setLoading] = useState(true);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchSeller   = (item.seller || '').toLowerCase().includes(searchFilters.seller.toLowerCase());
      const matchJobber   = (item.jobber || '').toLowerCase().includes(searchFilters.jobber.toLowerCase());
      const matchMaterial = (item.material || '').toLowerCase().includes(searchFilters.material.toLowerCase());
      return matchSeller && matchJobber && matchMaterial;
    });
  }, [data, searchFilters]);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/transactions/in`);
      const json = await resp.json();
      
      const mapped = json.map(item => {
        if (item.date) {
          item.date = toLocalYYYYMMDD(item.date);
        }
        const parts = item.date.split('-');
        return {
          ...item,
          _month: parseInt(parts[1], 10) - 1,
          _year: parseInt(parts[0], 10)
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
      const [sRes, jRes] = await Promise.all([
        fetch(`${API_BASE_URL}/sellers`),
        fetch(`${API_BASE_URL}/jobbers`)
      ]);
      const [sellers, jobbers] = await Promise.all([sRes.json(), jRes.json()]);
      setMasters({ sellers, jobbers });
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
    const list = type === 'seller' ? masters.sellers : masters.jobbers;
    const existing = list.find(item => item.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing.id;

    const apiPath = type === 'seller' ? 'sellers' : 'jobbers';
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
         // Fallback: fetch masters again and try to find it (someone might have added it simultaneously)
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
    // field is 'seller' or 'jobber'
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
    
    // Mutual exclusion logic for type1 and type2
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
      // Validation: All fields except Remark are required
      if (!(newRow.type1 || newRow.type2)) {
        alert('Please enter either Type 1 or Type 2');
        return;
      }
      if (!newRow.material || !newRow.rate || !newRow.seller || !newRow.jobber || !newRow.date) {
        alert('All fields except Remark are mandatory');
        return;
      }

      // Auto-add master records if they don't exist
      const sellerId = await ensureMasterRecord('seller', newRow.seller);
      const jobberId = await ensureMasterRecord('jobber', newRow.jobber);

      if (!sellerId || !jobberId) return;

      const entryToSave = {
        ...newRow,
        jobber_id: jobberId,
        seller_id: sellerId,
        type1: Number(newRow.type1) || 0,
        type2: Number(newRow.type2) || 0,
        rate: Number(newRow.rate) || 0,
        amount: Number(newRow.amount) || 0
      };

      const resp = await fetch(`${API_BASE_URL}/transactions/in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryToSave),
      });

      if (resp.ok) {
        // setShowEntryRow(false); // Persistent entry row
        setNewRow(getInitialRow());
        fetchData();
      }
 else {
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
      const sellerId = await ensureMasterRecord('seller', updatedRow.seller);
      const jobberId = await ensureMasterRecord('jobber', updatedRow.jobber);

      if (!sellerId || !jobberId) return;

      const payload = {
        ...updatedRow,
        seller_id: sellerId,
        jobber_id: jobberId
      };

      const resp = await fetch(`${API_BASE_URL}/transactions/in/${updatedRow.id}`, {
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
      const resp = await fetch(`${API_BASE_URL}/transactions/in/${id}`, {
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

  const handleRedo = () => setNewRow(getInitialRow());
  const handleCancel = () => {
    setShowEntryRow(false);
    setNewRow(getInitialRow());
  };

  return (
    <div className="p-6 flex flex-col h-full bg-[#F8FAFC]">
      {/* Redundant Page header removed - now in global Header */}

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
                      <th key={col.key} className="px-3 py-2 text-center text-[10px] font-bold text-[#64748B] uppercase tracking-wider border-r border-[#E2E8F0] last:border-r-0" style={{ minWidth: col.minWidth || '100px' }}>
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {COLUMNS.map(col => (
                      <td key={col.key} className="px-2 py-3 border-r border-[#E2E8F0] last:border-r-0" style={{ minWidth: col.minWidth || '100px' }}>
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
                              options={masters[col.key === 'seller' ? 'sellers' : 'jobbers'].map(m => m.name)}
                              onChange={handleInputChange}
                              onAddNewOption={handleAddNewOption}
                              onKeyDown={() => {}}
                            />
                          </div>
                        ) : col.type === 'computed' ? (
                          <div className="flex justify-center relative">
                            {col.prefix && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#64748B] text-xs font-bold">{col.prefix}</span>}
                            <input
                              type="number"
                              value={newRow[col.key] || ''}
                              onChange={(e) => handleInputChange(col.key, e.target.value)}
                              className={`w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded px-2 py-1.5 text-xs text-[#0F172A] outline-none focus:ring-1 focus:ring-[#2563EB] transition-all text-center font-mono font-bold ${col.prefix ? 'pl-5' : ''}`}
                            />
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

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm px-4 py-2.5 flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-2 text-[#64748B]">
          <Search size={14} className="text-[#2563EB]" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Quick Filters</span>
        </div>
        
        <div className="flex-1 min-w-[180px] relative group">
          <input
            type="text"
            placeholder="Search Material..."
            value={searchFilters.material}
            onChange={(e) => setSearchFilters({ ...searchFilters, material: e.target.value })}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded px-2 py-1.5 focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none transition-all placeholder:text-[#64748B]"
          />
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors" />
        </div>

        <div className="flex-1 min-w-[180px] relative group">
          <input
            type="text"
            placeholder="Search Seller..."
            value={searchFilters.seller}
            onChange={(e) => setSearchFilters({ ...searchFilters, seller: e.target.value })}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded px-2 py-1.5 focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none transition-all placeholder:text-[#64748B]"
          />
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors" />
        </div>

        <div className="flex-1 min-w-[180px] relative group">
          <input
            type="text"
            placeholder="Search Jobber..."
            value={searchFilters.jobber}
            onChange={(e) => setSearchFilters({ ...searchFilters, jobber: e.target.value })}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded px-2 py-1.5 focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none transition-all placeholder:text-[#64748B]"
          />
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors" />
        </div>
        
        {(searchFilters.seller || searchFilters.jobber || searchFilters.material) && (
          <button 
            onClick={() => setSearchFilters({ seller: '', jobber: '', material: '' })}
            className="text-[10px] font-bold text-[#E11D48] hover:text-[#9F1239] transition-colors uppercase tracking-tight"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Table (takes remaining height) */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full text-xs text-[#64748B]">Loading data...</div>
        ) : (
          <DataTable
            columns={COLUMNS}
            initialData={filteredData}
            comboboxFields={{ 
              seller: masters.sellers.map(s => s.name), 
              jobber: masters.jobbers.map(j => j.name) 
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
