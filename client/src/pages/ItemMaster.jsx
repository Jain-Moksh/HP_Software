import { useState, useEffect, useCallback, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Plus,
  RefreshCw,
  Search,
  RotateCcw,
  X,
  Save
} from 'lucide-react';
import DataTable from '../components/DataTable';
import API_BASE_URL from '../config';

const COLUMNS = [
  { key: 'item_name',    label: 'Item Name',     type: 'text', autoFocus: true, minWidth: '160px' },
  { key: 'description',  label: 'Description',   type: 'text', minWidth: '200px' },
  { key: 'job_rate',     label: 'Job Rate',      type: 'number', prefix: '₹', minWidth: '100px' },
  { key: 'weight_type1', label: 'Weight Type 1', type: 'number', minWidth: '120px' },
  { key: 'weight_type2', label: 'Weight Type 2', type: 'number', minWidth: '120px' },
];

const INITIAL_ROW = {
  item_name: '',
  description: '',
  job_rate: '',
  weight_type1: '',
  weight_type2: ''
};

const TOOLBAR_ICONS = [
  { id: 'new',     icon: Plus,      label: 'New Item' },
  { id: 'refresh', icon: RefreshCw, label: 'Refresh'  },
];

export default function ItemMaster() {
  const { setHeaderActions } = useOutletContext();
  const [data, setData] = useState([]);
  const [showEntryRow, setShowEntryRow] = useState(false);
  const [searchFilters, setSearchFilters] = useState({ item_name: '', description: '' });
  const [newRow, setNewRow] = useState(INITIAL_ROW);
  const [loading, setLoading] = useState(true);

  // Filter items based on quick filters
  const filteredData = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    return list.filter(item => {
      const matchName = (item.item_name || '').toLowerCase().includes(searchFilters.item_name.toLowerCase());
      const matchDesc = (item.description || '').toLowerCase().includes(searchFilters.description.toLowerCase());
      return matchName && matchDesc;
    });
  }, [data, searchFilters]);

  // Fetch items master data
  const fetchData = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/items`);
      if (resp.ok) {
        const json = await resp.json();
        if (Array.isArray(json)) {
          setData(json);
        } else {
          console.error('Fetch items: response is not an array:', json);
          setData([]);
        }
      } else {
        console.error('Fetch items: server returned error status:', resp.status);
        setData([]);
      }
    } catch (err) {
      console.error('Fetch items error:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToolbarClick = useCallback((id) => {
    if (id === 'new') setShowEntryRow(true);
    if (id === 'refresh') {
      fetchData();
    }
  }, [fetchData]);

  // Register header toolbar icons
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
  }, [setHeaderActions, handleToolbarClick]);

  const handleInputChange = (field, value) => {
    setNewRow(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      if (!newRow.item_name.trim()) {
        alert('Item Name is required');
        return;
      }

      const entryToSave = {
        item_name: newRow.item_name.trim(),
        description: newRow.description.trim(),
        job_rate: Number(newRow.job_rate) || 0,
        weight_type1: Number(newRow.weight_type1) || 0,
        weight_type2: Number(newRow.weight_type2) || 0
      };

      const resp = await fetch(`${API_BASE_URL}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryToSave),
      });

      if (resp.ok) {
        setNewRow(INITIAL_ROW);
        fetchData();
      } else {
        const error = await resp.json();
        alert(error.error || 'Failed to save item.');
      }
    } catch (err) {
      console.error('Save item error:', err);
      alert('Error connecting to server.');
    }
  };

  const handleUpdate = async (updatedRow) => {
    try {
      if (!updatedRow.item_name.trim()) {
        alert('Item Name is required');
        fetchData();
        return;
      }

      const payload = {
        item_name: updatedRow.item_name.trim(),
        description: updatedRow.description.trim(),
        job_rate: Number(updatedRow.job_rate) || 0,
        weight_type1: Number(updatedRow.weight_type1) || 0,
        weight_type2: Number(updatedRow.weight_type2) || 0
      };

      const resp = await fetch(`${API_BASE_URL}/items/${updatedRow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const error = await resp.json();
        alert(error.error || 'Failed to update item.');
        fetchData();
      }
    } catch (err) {
      console.error('Update item error:', err);
      alert('Error connecting to server.');
      fetchData();
    }
  };

  const handleDelete = async (id, password) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/items/${id}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'x-delete-password': password
        },
        body: JSON.stringify({ password }) // supports both header and body password verification
      });

      if (resp.ok) {
        fetchData();
      } else {
        const error = await resp.json();
        alert(error.error || error.message || 'Failed to delete item.');
      }
    } catch (err) {
      console.error('Delete item error:', err);
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
      {/* New Entry Table Section */}
      {showEntryRow && (
        <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="bg-[#334155] text-white px-4 py-2 text-xs font-semibold tracking-wide">
              Create New Item Master Entry
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
                        {col.key === 'description' ? (
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
                <Save size={14} /> Save Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Filters Bar */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm px-4 py-2.5 flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-2 text-[#64748B]">
          <Search size={14} className="text-[#2563EB]" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Item Filters</span>
        </div>
        
        <div className="flex-1 min-w-[200px] relative group">
          <input
            type="text"
            placeholder="Filter by Item Name..."
            value={searchFilters.item_name}
            onChange={(e) => setSearchFilters({ ...searchFilters, item_name: e.target.value })}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded px-2 py-1.5 focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none transition-all placeholder:text-[#64748B]"
          />
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors" />
        </div>

        <div className="flex-1 min-w-[200px] relative group">
          <input
            type="text"
            placeholder="Filter by Description..."
            value={searchFilters.description}
            onChange={(e) => setSearchFilters({ ...searchFilters, description: e.target.value })}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded px-2 py-1.5 focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none transition-all placeholder:text-[#64748B]"
          />
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors" />
        </div>
        
        {(searchFilters.item_name || searchFilters.description) && (
          <button 
            onClick={() => setSearchFilters({ item_name: '', description: '' })}
            className="text-[10px] font-bold text-[#E11D48] hover:text-[#9F1239] transition-colors uppercase tracking-tight"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Items DataTable (hideFilters true for master list display) */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full text-xs text-[#64748B]">Loading items...</div>
        ) : (
          <DataTable
            columns={COLUMNS}
            initialData={filteredData}
            onSave={handleUpdate}
            onDelete={handleDelete}
            hideFilters={true}
          />
        )}
      </div>
    </div>
  );
}
