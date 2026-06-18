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
  Search,
} from 'lucide-react';
import DataTable, { EditCombobox } from '../components/DataTable';
import DateField from '../components/DateField';
import API_BASE_URL from '../config';

// ─── Material-Out column definitions ─────────────────────────────────────────
const COLUMNS = [
  { key: 'type1',    label: 'Type 1',    type: 'stacked-number', subKey: 'type1_b' },
  { key: 'type2',    label: 'Type 2',    type: 'stacked-number', subKey: 'type2_b' },
  { key: 'material', label: 'Material',  type: 'combobox', autoFocus: true, minWidth: '140px' },
  { key: 'rate',     label: 'Rate',      type: 'number', prefix: '₹' },
  { key: 'jobber',   label: 'Jobber',    type: 'combobox', minWidth: '120px' },
  { key: 'vendor',   label: 'Vendor',    type: 'combobox', minWidth: '120px' },
  { key: 'date',     label: 'Date',      type: 'date', minWidth: '100px' },
  { key: 'amount',   label: 'Amount',    type: 'computed', prefix: '₹' },
  { key: 'remark',   label: 'Remark',    type: 'text', minWidth: '160px' },
];

// ─── calculation helper ──────────────────────────────────────────────────────
const calculateAmount = (row, items = [], fieldChanged = null) => {
  let updated = { ...row };

  if (fieldChanged === 'type1_b' || fieldChanged === 'type2_b' || fieldChanged === 'material') {
    const matchedItem = (items || []).find(
      i => i.item_name.toLowerCase() === (updated.material || '').toLowerCase()
    );
    if (matchedItem) {
      if (fieldChanged === 'type1_b' || (fieldChanged === 'material' && updated.type1_b)) {
        if (updated.type1_b) {
          updated.type1 = (Number(updated.type1_b) * (Number(matchedItem.weight_type1) || 0)).toFixed(3).replace(/\.?0+$/, '');
        } else {
          updated.type1 = '';
        }
      }
      if (fieldChanged === 'type2_b' || (fieldChanged === 'material' && updated.type2_b)) {
        if (updated.type2_b) {
          updated.type2 = (Number(updated.type2_b) * (Number(matchedItem.weight_type2) || 0)).toFixed(3).replace(/\.?0+$/, '');
        } else {
          updated.type2 = '';
        }
      }
    }
  }

  const t1_kg = Number(updated.type1) || 0;
  const t1_pcs = Number(updated.type1_b) || 0;
  const t2_kg = Number(updated.type2) || 0;
  const t2_pcs = Number(updated.type2_b) || 0;

  const totalPcs = t1_pcs + t2_pcs;
  const totalKg = t1_kg + t2_kg;
  const r  = Number(updated.rate)  || 0;
  
  let total = 0;
  if (totalPcs > 0) {
    total = totalPcs * r;
  } else if (totalKg > 0) {
    total = totalKg * r;
  }

  if (updated.b) total = total + 0.18 * total;
  return { ...updated, amount: Math.round(total) };
};

const getInitialRow = () => {
  const d = new Date();
  return {
    type1: '',
    type1_b: '',
    type2: '',
    type2_b: '',
    material: '',
    rate: '',
    jobber: '',
    vendor: '',
    date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    remark: '',
    amount: 0
  };
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

export default function MaterialOut() {
  const { setHeaderActions } = useOutletContext();
  const [data, setData] = useState([]);
  const [showEntryRow, setShowEntryRow] = useState(false);

  const [masters, setMasters] = useState({ vendors: [], jobbers: [], items: [] });
  const [newRow, setNewRow] = useState(getInitialRow());
  const [loading, setLoading] = useState(true);
  const [searchFilters, setSearchFilters] = useState({ vendor: '', jobber: '', material: '' });

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchVendor   = (item.vendor || '').toLowerCase().includes(searchFilters.vendor.toLowerCase());
      const matchJobber   = (item.jobber || '').toLowerCase().includes(searchFilters.jobber.toLowerCase());
      const matchMaterial = (item.material || '').toLowerCase().includes(searchFilters.material.toLowerCase());
      return matchVendor && matchJobber && matchMaterial;
    });
  }, [data, searchFilters]);

  // New Item Modal State
  const [showItemModal, setShowItemModal] = useState(false);
  const [newItemForm, setNewItemForm] = useState({
    item_name: '',
    description: '',
    job_rate: '',
    weight_type1: '',
    weight_type2: ''
  });

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/transactions/out`);
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
      const [vRes, jRes, iRes] = await Promise.all([
        fetch(`${API_BASE_URL}/vendors`),
        fetch(`${API_BASE_URL}/jobbers`),
        fetch(`${API_BASE_URL}/items`)
      ]);
      const [vendors, jobbers, items] = await Promise.all([vRes.json(), jRes.json(), iRes.json()]);
      setMasters({ vendors, jobbers, items });
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
    if (field === 'material') {
      setMasters(prev => ({
        ...prev,
        items: [...(prev.items || []), { item_name: value, weight_type1: 0, weight_type2: 0 }]
      }));
    } else {
      await ensureMasterRecord(field, value);
    }
  };

  const handleSaveNewItem = async () => {
    try {
      if (!newItemForm.item_name.trim()) {
        alert('Item Name is required');
        return;
      }
      const entryToSave = {
        item_name: newItemForm.item_name.trim(),
        description: newItemForm.description.trim(),
        job_rate: Number(newItemForm.job_rate) || 0,
        weight_type1: Number(newItemForm.weight_type1) || 0,
        weight_type2: Number(newItemForm.weight_type2) || 0
      };
      const resp = await fetch(`${API_BASE_URL}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryToSave),
      });
      if (resp.ok) {
        await fetchMasters();
        setNewRow(prev => ({ ...prev, material: entryToSave.item_name, rate: entryToSave.job_rate }));
        setShowItemModal(false);
        setNewItemForm({ item_name: '', description: '', job_rate: '', weight_type1: '', weight_type2: '' });
      } else {
        const error = await resp.json();
        alert(error.error || 'Failed to save item.');
      }
    } catch (err) {
      console.error('Save item error:', err);
      alert('Error connecting to server.');
    }
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

    // Auto-fill rate from item master's job_rate when material is selected
    if (field === 'material') {
      const matchedItem = (masters.items || []).find(
        i => i.item_name.toLowerCase() === (value || '').toLowerCase()
      );
      if (matchedItem && matchedItem.job_rate) {
        updatedRow.rate = matchedItem.job_rate;
      }
    }

    if (
      field === 'type1' ||
      field === 'type1_b' ||
      field === 'type2' ||
      field === 'type2_b' ||
      field === 'rate' ||
      field === 'b' ||
      field === 'material'
    ) {
      updatedRow = calculateAmount(updatedRow, masters.items, field);
    }
    setNewRow(updatedRow);
  };

  const handleSave = async () => {
    try {
      if (!(newRow.type1 || newRow.type1_b || newRow.type2 || newRow.type2_b)) {
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

      const item = (masters.items || []).find(i => i.item_name.toLowerCase() === (newRow.material || '').toLowerCase());
      const w1 = item ? (Number(item.weight_type1) || 0) : 0;
      const w2 = item ? (Number(item.weight_type2) || 0) : 0;

      const entryToSave = {
        ...newRow,
        jobber_id: jobberId,
        vendor_id: vendorId,
        type1: Number(newRow.type1) || 0,
        type1_b: Number(newRow.type1_b) || 0,
        type2: Number(newRow.type2) || 0,
        type2_b: Number(newRow.type2_b) || 0,
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

  const handleRedo = () => setNewRow(getInitialRow());
  const handleCancel = () => {
    setShowEntryRow(false);
    setNewRow(getInitialRow());
  };

  return (
    <div className="p-6 flex flex-col h-full bg-[#F8FAFC]">
      {/* Table (takes remaining height) */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full text-xs text-[#64748B]">Loading data...</div>
        ) : (
          <DataTable
            columns={COLUMNS}
            initialData={filteredData}
            comboboxFields={{ 
              jobber: (masters.jobbers || []).map(j => j.name), 
              vendor: (masters.vendors || []).map(v => v.name),
              material: (masters.items || []).map(i => i.item_name)
            }}
            calculateFields={(row, field) => calculateAmount(row, masters.items, field)}
            checkboxRecalcFields={['b']}
            onSave={handleUpdate}
            onDelete={handleDelete}
            onAddNewOption={handleAddNewOption}
          >
            {/* New Entry Table Section */}
            {showEntryRow && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm overflow-hidden">
                  <div className="bg-[#334155] text-white px-4 py-2 text-xs font-semibold tracking-wide">
                    New Data Entry
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border-collapse text-center">
                      <thead>
                        <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                          {COLUMNS.map(col => (
                            <th key={col.key} className="px-3 py-2 text-[10px] font-bold text-[#64748B] uppercase tracking-wider border-r border-[#E2E8F0] last:border-r-0" style={{ minWidth: col.minWidth || '100px' }}>
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
                                <div className="flex flex-col items-center w-full">
                                  <div className="flex justify-center w-full">
                                    <EditCombobox
                                      field={col.key}
                                      value={newRow[col.key]}
                                      options={
                                        col.key === 'material'
                                          ? (masters.items || []).map(i => i.item_name)
                                          : (masters[col.key === 'jobber' ? 'jobbers' : 'vendors'] || []).map(m => m.name)
                                      }
                                      onChange={handleInputChange}
                                      onAddNewOption={handleAddNewOption}
                                      onKeyDown={() => {}}
                                    />
                                  </div>
                                  {col.key === 'material' && (
                                    <button
                                      onClick={() => setShowItemModal(true)}
                                      className="text-[10px] text-[#2563EB] hover:underline mt-1"
                                      type="button"
                                    >
                                      + New Item
                                    </button>
                                  )}
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
                              ) : col.key === 'type1' ? (
                                <div className="flex flex-col gap-1.5">
                                  <input
                                    type="number"
                                    value={newRow.type1}
                                    onChange={(e) => handleInputChange('type1', e.target.value)}
                                    placeholder="Type 1 (KG)"
                                    className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded px-2 py-1.5 text-xs text-[#0F172A] outline-none focus:ring-1 focus:ring-[#2563EB] transition-all text-center"
                                  />
                                  <input
                                    type="number"
                                    value={newRow.type1_b}
                                    onChange={(e) => handleInputChange('type1_b', e.target.value)}
                                    placeholder="Type 1 (Pcs)"
                                    className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded px-2 py-1.5 text-xs text-[#0F172A] outline-none focus:ring-1 focus:ring-[#2563EB] transition-all text-center"
                                  />
                                </div>
                              ) : col.key === 'type2' ? (
                                <div className="flex flex-col gap-1.5">
                                  <input
                                    type="number"
                                    value={newRow.type2}
                                    onChange={(e) => handleInputChange('type2', e.target.value)}
                                    placeholder="Type 2 (KG)"
                                    className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded px-2 py-1.5 text-xs text-[#0F172A] outline-none focus:ring-1 focus:ring-[#2563EB] transition-all text-center"
                                  />
                                  <input
                                    type="number"
                                    value={newRow.type2_b}
                                    onChange={(e) => handleInputChange('type2_b', e.target.value)}
                                    placeholder="Type 2 (Pcs)"
                                    className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded px-2 py-1.5 text-xs text-[#0F172A] outline-none focus:ring-1 focus:ring-[#2563EB] transition-all text-center"
                                  />
                                </div>
                              ) : (
                                <input
                                  type={col.type === 'number' ? 'number' : 'text'}
                                  value={newRow[col.key]}
                                  onChange={(e) => handleInputChange(col.key, e.target.value)}
                                  placeholder={col.label}
                                  className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded px-2 py-1.5 text-xs text-[#0F172A] outline-none focus:ring-1 focus:ring-[#2563EB] transition-all text-center"
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

            {/* Search & Filter Bar */}
            <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm px-4 py-2.5 flex flex-wrap items-center gap-4">
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
                  placeholder="Search Jobber..."
                  value={searchFilters.jobber}
                  onChange={(e) => setSearchFilters({ ...searchFilters, jobber: e.target.value })}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded px-2 py-1.5 focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none transition-all placeholder:text-[#64748B]"
                />
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors" />
              </div>

              <div className="flex-1 min-w-[180px] relative group">
                <input
                  type="text"
                  placeholder="Search Vendor..."
                  value={searchFilters.vendor}
                  onChange={(e) => setSearchFilters({ ...searchFilters, vendor: e.target.value })}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded px-2 py-1.5 focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none transition-all placeholder:text-[#64748B]"
                />
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors" />
              </div>
              
              {(searchFilters.vendor || searchFilters.jobber || searchFilters.material) && (
                <button 
                  onClick={() => setSearchFilters({ vendor: '', jobber: '', material: '' })}
                  className="text-[10px] font-bold text-[#E11D48] hover:text-[#9F1239] transition-colors uppercase tracking-tight"
                >
                  Clear All
                </button>
              )}
            </div>
          </DataTable>
        )}
      </div>

      {/* New Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-[400px] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#334155] text-white px-4 py-3 flex justify-between items-center">
              <h3 className="text-sm font-semibold tracking-wide">Add New Item</h3>
              <button onClick={() => setShowItemModal(false)} className="text-white hover:text-gray-300">
                <X size={16} />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">Item Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newItemForm.item_name}
                  onChange={e => setNewItemForm({ ...newItemForm, item_name: e.target.value })}
                  className="w-full border border-[#CBD5E1] rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  placeholder="E.g. Steel Rods"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">Description</label>
                <input
                  type="text"
                  value={newItemForm.description}
                  onChange={e => setNewItemForm({ ...newItemForm, description: e.target.value })}
                  className="w-full border border-[#CBD5E1] rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  placeholder="Optional description"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Job Rate</label>
                  <input
                    type="number"
                    value={newItemForm.job_rate}
                    onChange={e => setNewItemForm({ ...newItemForm, job_rate: e.target.value })}
                    className="w-full border border-[#CBD5E1] rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                    placeholder="0"
                  />
                </div>
                <div></div> {/* spacer */}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Weight Type 1 (KG)</label>
                  <input
                    type="number"
                    value={newItemForm.weight_type1}
                    onChange={e => setNewItemForm({ ...newItemForm, weight_type1: e.target.value })}
                    className="w-full border border-[#CBD5E1] rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Weight Type 2 (KG)</label>
                  <input
                    type="number"
                    value={newItemForm.weight_type2}
                    onChange={e => setNewItemForm({ ...newItemForm, weight_type2: e.target.value })}
                    className="w-full border border-[#CBD5E1] rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
            <div className="bg-[#F8FAFC] px-4 py-3 border-t border-[#E2E8F0] flex justify-end gap-2">
              <button
                onClick={() => setShowItemModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-[#64748B] hover:text-[#0F172A] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewItem}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded shadow-sm transition-colors"
              >
                <Save size={14} /> Save Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
