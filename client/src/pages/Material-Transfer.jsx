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

// ─── Material-Transfer column definitions ────────────────────────────────────
const COLUMNS = [
  { key: 'type1',       label: 'Type 1 Qty',   type: 'number' },
  { key: 'type2',       label: 'Type 2 Qty',   type: 'number' },
  { key: 'material',    label: 'Material',     type: 'text', autoFocus: true, minWidth: '140px' },
  { key: 'from_jobber', label: 'From Jobber',  type: 'combobox', minWidth: '130px' },
  { key: 'to_jobber',   label: 'To Jobber',    type: 'combobox', minWidth: '130px' },
  { key: 'date',        label: 'Date',         type: 'date', minWidth: '100px' },
  { key: 'remark',      label: 'Remark',       type: 'text', minWidth: '160px' },
];

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
    from_jobber: '',
    to_jobber: '',
    date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    remark: ''
  };
};

export default function MaterialTransfer() {
  const { setHeaderActions } = useOutletContext();
  const [data, setData] = useState([]);
  const [showEntryRow, setShowEntryRow] = useState(false);

  const [masters, setMasters] = useState({ jobbers: [] });
  const [searchFilters, setSearchFilters] = useState({ from_jobber: '', to_jobber: '', material: '' });
  const [newRow, setNewRow] = useState(getInitialRow());
  const [loading, setLoading] = useState(true);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchFromJobber = (item.from_jobber || '').toLowerCase().includes(searchFilters.from_jobber.toLowerCase());
      const matchToJobber   = (item.to_jobber || '').toLowerCase().includes(searchFilters.to_jobber.toLowerCase());
      const matchMaterial   = (item.material || '').toLowerCase().includes(searchFilters.material.toLowerCase());
      return matchFromJobber && matchToJobber && matchMaterial;
    });
  }, [data, searchFilters]);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/transactions/transfer`);
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
      console.error('Fetch transfers error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMasters = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/jobbers`);
      const jobbers = await resp.json();
      setMasters({ jobbers });
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
    const list = masters.jobbers;
    const existing = list.find(item => item.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing.id;

    try {
      const resp = await fetch(`${API_BASE_URL}/jobbers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (resp.ok) {
        const newRecord = await resp.json();
        await fetchMasters(); 
        return newRecord.id;
      } else if (resp.status === 400) {
         // Fallback: fetch masters again and try to find it
         await fetchMasters();
         const refetch = await fetch(`${API_BASE_URL}/jobbers`);
         const freshList = await refetch.json();
         const found = freshList.find(item => item.name.toLowerCase() === name.toLowerCase());
         if (found) return found.id;
      }
    } catch (err) { console.error(err); }
    return null;
  };

  const handleAddNewOption = async (field, value) => {
    // Both 'from_jobber' and 'to_jobber' map to 'jobber' master
    await ensureMasterRecord('jobber', value);
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

    setNewRow(updatedRow);
  };

  const handleSave = async () => {
    try {
      // Validation: Quantities, jobber match, required fields
      if (!(newRow.type1 || newRow.type2)) {
        alert('Please enter either Type 1 or Type 2 quantity');
        return;
      }
      if (!newRow.material || !newRow.from_jobber || !newRow.to_jobber || !newRow.date) {
        alert('Material, From Jobber, To Jobber, and Date are mandatory');
        return;
      }
      if (newRow.from_jobber.toLowerCase() === newRow.to_jobber.toLowerCase()) {
        alert('From Jobber and To Jobber cannot be the same');
        return;
      }

      // Auto-add master records if they don't exist
      const fromJobberId = await ensureMasterRecord('jobber', newRow.from_jobber);
      const toJobberId = await ensureMasterRecord('jobber', newRow.to_jobber);

      if (!fromJobberId || !toJobberId) return;

      const entryToSave = {
        ...newRow,
        from_jobber_id: fromJobberId,
        to_jobber_id: toJobberId,
        type1: Number(newRow.type1) || 0,
        type2: Number(newRow.type2) || 0
      };

      const resp = await fetch(`${API_BASE_URL}/transactions/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryToSave),
      });

      if (resp.ok) {
        setNewRow(getInitialRow());
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
      if (updatedRow.from_jobber.toLowerCase() === updatedRow.to_jobber.toLowerCase()) {
        alert('From Jobber and To Jobber cannot be the same');
        fetchData();
        return;
      }

      const fromJobberId = await ensureMasterRecord('jobber', updatedRow.from_jobber);
      const toJobberId = await ensureMasterRecord('jobber', updatedRow.to_jobber);

      if (!fromJobberId || !toJobberId) return;

      const payload = {
        ...updatedRow,
        from_jobber_id: fromJobberId,
        to_jobber_id: toJobberId
      };

      const resp = await fetch(`${API_BASE_URL}/transactions/transfer/${updatedRow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const err = await resp.json();
        alert(err.error || 'Failed to update record.');
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
      const resp = await fetch(`${API_BASE_URL}/transactions/transfer/${id}`, {
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
      {/* New Entry Table Section */}
      {showEntryRow && (
        <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="bg-[#334155] text-white px-4 py-2 text-xs font-semibold tracking-wide">
              New Transfer Entry
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
                        {col.type === 'combobox' ? (
                          <div className="flex justify-center">
                            <EditCombobox
                              field={col.key}
                              value={newRow[col.key]}
                              options={masters.jobbers.map(m => m.name)}
                              onChange={handleInputChange}
                              onAddNewOption={handleAddNewOption}
                              onKeyDown={() => {}}
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
                <Save size={14} /> Save Transfer
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
            placeholder="Search From Jobber..."
            value={searchFilters.from_jobber}
            onChange={(e) => setSearchFilters({ ...searchFilters, from_jobber: e.target.value })}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded px-2 py-1.5 focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none transition-all placeholder:text-[#64748B]"
          />
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors" />
        </div>

        <div className="flex-1 min-w-[180px] relative group">
          <input
            type="text"
            placeholder="Search To Jobber..."
            value={searchFilters.to_jobber}
            onChange={(e) => setSearchFilters({ ...searchFilters, to_jobber: e.target.value })}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded px-2 py-1.5 focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none transition-all placeholder:text-[#64748B]"
          />
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors" />
        </div>
        
        {(searchFilters.from_jobber || searchFilters.to_jobber || searchFilters.material) && (
          <button 
            onClick={() => setSearchFilters({ from_jobber: '', to_jobber: '', material: '' })}
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
              from_jobber: masters.jobbers.map(j => j.name), 
              to_jobber: masters.jobbers.map(j => j.name) 
            }}
            onSave={handleUpdate}
            onDelete={handleDelete}
            onAddNewOption={handleAddNewOption}
          />
        )}
      </div>
    </div>
  );
}
