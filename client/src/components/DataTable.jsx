import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Pencil, Save, Trash2 } from 'lucide-react';
import DateField from './DateField';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  if (typeof dateStr === 'string') {
    if (dateStr.includes('T')) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      }
    }
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

// ─── shared input style ───────────────────────────────────────────────────────
const inputCls =
  'w-full bg-[#EFF6FF] border border-[#93C5FD] rounded px-1.5 py-0.5 text-xs text-[#0F172A] outline-none focus:ring-1 focus:ring-[#2563EB] placeholder:text-[#94A3B8]';

// ─── helper components (outside to prevent remounting) ───────────────────────
const ViewText = ({ value, type, field }) => (
  <span 
    className={`block text-center ${field === 'remark' ? 'whitespace-pre-wrap break-words' : 'truncate'}`} 
    title={value}
  >
    {type === 'date' ? formatDate(value) : value}
  </span>
);

const EditText = ({ field, value, onChange, onKeyDown, cls = '', autoFocus = false }) => {
  if (field === 'remark') {
    return (
      <textarea
        value={value}
        onChange={e => onChange(field, e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onKeyDown(e);
          }
        }}
        className={`${inputCls} text-center ${cls} resize-y min-h-[32px]`}
        onClick={e => e.stopPropagation()}
        autoFocus={autoFocus}
        rows={1}
      />
    );
  }
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(field, e.target.value)}
      onKeyDown={onKeyDown}
      className={`${inputCls} text-center ${cls}`}
      onClick={e => e.stopPropagation()}
      autoFocus={autoFocus}
    />
  );
};

const EditNum = ({ field, value, onChange, onKeyDown, cls = '', disabled = false, placeholder = '' }) => (
  <input
    type="number"
    value={value}
    onChange={e => onChange(field, e.target.value)}
    onKeyDown={onKeyDown}
    disabled={disabled}
    placeholder={placeholder}
    className={`${inputCls} text-center ${cls} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    onClick={e => e.stopPropagation()}
  />
);

const DeleteConfirmModal = ({ isOpen, onCancel, onConfirm }) => {
  const [password, setPassword] = useState('');
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl border border-[#E2E8F0] w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-bold text-[#0F172A] mb-2 flex items-center gap-2">
           Delete Record
        </h3>
        <p className="text-sm text-[#64748B] mb-5">
          Please enter the secure password to confirm deletion.
        </p>
        <input 
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          autoFocus
          className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-4 py-2.5 text-sm mb-6 outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
        />
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2.5 text-sm font-semibold text-[#64748B] bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              onConfirm(password);
              setPassword('');
            }}
            className="px-4 py-2.5 text-sm font-semibold text-white bg-[#EF4444] hover:bg-[#DC2626] rounded-lg shadow-sm shadow-red-200 transition-colors"
          >
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export const EditCombobox = ({ field, value, options, onChange, onAddNew, onAddNewOption, onKeyDown }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [typed, setTyped] = useState(value || '');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Sync internal state if prop changes (e.g. after save)
  useEffect(() => {
    setTyped(value || '');
  }, [value]);

  // Filter options based on typed text
  const filtered = options.filter(opt =>
    opt.toLowerCase().includes(typed.trim().toLowerCase())
  );

  const exactMatch = options.find(opt => opt.toLowerCase() === typed.toLowerCase());
  const showAdd = typed.trim() !== '' && !exactMatch;

  const handleSelect = (val) => {
    onChange(field, val);
    setTyped(val);
    setIsOpen(false);
  };

  const handleAddNew = () => {
    const newVal = typed.trim();
    if (newVal) {
      if (onAddNewOption) {
        onAddNewOption(field, newVal);
      } else if (onAddNew) {
        onAddNew(field, newVal);
      }
      onChange(field, newVal);
    }
    setIsOpen(false);
  };

  const handleLocalKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex(prev => Math.min(prev + 1, filtered.length + (showAdd ? 0 : -1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      if (isOpen) {
        if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
          handleSelect(filtered[highlightedIndex]);
          e.stopPropagation();
        } else if (showAdd && highlightedIndex === filtered.length) {
          handleAddNew();
          e.stopPropagation();
        } else {
            onKeyDown(e);
        }
      } else {
        onKeyDown(e);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      onKeyDown(e);
    } else {
      setIsOpen(true);
    }
  };

  // portal positioning logic
  const updateCoords = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom,
        left: rect.left,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('scroll', updateCoords, true);
      window.addEventListener('resize', updateCoords);
    }
    return () => {
      window.removeEventListener('scroll', updateCoords, true);
      window.removeEventListener('resize', updateCoords);
    };
  }, [isOpen]);

  // Close list on click outside
  useEffect(() => {
    const clickHandler = (e) => {
      const insideWrapper = wrapperRef.current && wrapperRef.current.contains(e.target);
      const insideDropdown = dropdownRef.current && dropdownRef.current.contains(e.target);
      if (!insideWrapper && !insideDropdown) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', clickHandler);
    return () => document.removeEventListener('mousedown', clickHandler);
  }, []);

  return (
    <div className="relative w-full" ref={wrapperRef} onClick={e => e.stopPropagation()}>
      <input
        ref={inputRef}
        type="text"
        value={typed}
        onChange={e => { 
          const newVal = e.target.value;
          setTyped(newVal); 
          onChange(field, newVal); // Update parent state immediately
          setIsOpen(true); 
          setHighlightedIndex(-1); 
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleLocalKeyDown}
        className={`${inputCls} text-center`}
        placeholder="Type to search..."
      />
      
      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed z-[9999] bg-white border border-[#93C5FD] rounded shadow-xl max-h-48 overflow-y-auto ring-1 ring-black ring-opacity-5"
          style={{
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`
          }}
        >
          {filtered.map((opt, i) => (
            <div
              key={opt}
              onClick={() => handleSelect(opt)}
              onMouseEnter={() => setHighlightedIndex(i)}
              className={`px-3 py-2 text-xs cursor-pointer transition-colors text-center ${
                i === highlightedIndex ? 'bg-[#EFF6FF] text-[#2563EB]' : 'text-[#475569]'
              }`}
            >
              {opt}
            </div>
          ))}
          {showAdd && (
            <div
              onClick={handleAddNew}
              onMouseEnter={() => setHighlightedIndex(filtered.length)}
              className={`px-3 py-2 text-xs cursor-pointer font-bold border-t border-[#F1F5F9] text-center ${
                highlightedIndex === filtered.length ? 'bg-[#EFF6FF] text-[#2563EB]' : 'text-[#2563EB]'
              }`}
            >
              + Add New "{typed}"
            </div>
          )}
          {filtered.length === 0 && !showAdd && (
            <div className="px-3 py-2 text-xs text-[#94A3B8] italic text-center">No results found</div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DataTable – reusable table component
//
// Props:
//   columns        – array of { key, label, type, prefix, autoFocus, minWidth }
//   initialData    – array of row objects (must have id, _month, _year)
//   onSave         – async fn(row) called on save
//   comboboxFields – optional { fieldKey: [initial options] }
//   calculateFields – optional fn(row) => row  (recalculate computed fields)
//   checkboxRecalcFields – optional string[] of checkbox keys that trigger recalc
// ─────────────────────────────────────────────────────────────────────────────
export default function DataTable({
  columns = [],
  initialData = [],
  onSave,
  onDelete,
  onAddNewOption, // New prop
  comboboxFields: comboboxFieldsProp,
  calculateFields,
  checkboxRecalcFields = [],
  hideFilters = false, // If true, suppresses internal month/year pagination
}) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  // Stabilize comboboxFields reference — a plain {} default would be a new
  // object on every render, causing the comboOptions useEffect to loop.
  const comboboxFields = useMemo(
    () => comboboxFieldsProp || {},
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(comboboxFieldsProp)]
  );

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [activeMonth, setActiveMonth]   = useState(currentMonth);
  const [rows, setRows]                 = useState(initialData);
  const [editingId, setEditingId]       = useState(null);

  // Helper to generate a globally unique ID for UI state (solves collisions between IN and ADJ tables)
  const getUniqueId = (r) => (r.tx_type ? `${r.tx_type}-${r.id}` : r.id);
  const [draft, setDraft]               = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, rowId: null, tx_type: null }); // Added deleteModal state

  // Sync rows when initialData changes externally (e.g. after a new entry save)
  useEffect(() => {
    setRows(initialData);
    
    // Auto-edit draft rows (like the new adjustment row)
    const draftRow = initialData.find(r => r.isDraft);
    if (draftRow) {
      setEditingId(getUniqueId(draftRow));
      setDraft({ ...draftRow });
    }
  }, [initialData]);

  // ── dynamic combobox options ────────────────────────────────────────────
  const [comboOptions, setComboOptions] = useState({});

  useEffect(() => {
    const nextOptions = {};
    for (const key of Object.keys(comboboxFields)) {
      const fromProps = comboboxFields[key] || [];
      const fromData = [...new Set(rows.map(r => r[key]).filter(Boolean))];
      nextOptions[key] = [...new Set([...fromProps, ...fromData])].sort();
    }
    setComboOptions(nextOptions);
  }, [comboboxFields, rows]);

  const addOption = (field, newValue) => {
    setComboOptions(prev => ({
      ...prev,
      [field]: [...new Set([...(prev[field] || []), newValue])].sort(),
    }));
  };

  const editRowRef = useRef(null);

  // ── filter visible months ──────────────────────────────────────────────
  const visibleMonths = (selectedYear === currentYear)
    ? MONTHS.slice(0, currentMonth + 1)
    : MONTHS;

  // ── year options ───────────────────────────────────────────────────────
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // ── filtered data for display ─────────────────────────────────────────
  const filteredRows = hideFilters 
    ? rows 
    : rows.filter(r => r.isTotal || (r._month === activeMonth && r._year === selectedYear));

  // ── save handler ──────────────────────────────────────────────────────
  const saveRow = async (row) => {
    if (onSave) await onSave(row);
    else console.log('[DB] Saving row:', row);
  };

  // ── checkbox toggle helper ────────────────────────────────────────────
  const toggleCheckbox = (row, field) => {
    if (editingId === getUniqueId(row)) {
      setField(field, !draft[field]);
    } else {
      let updatedRow = { ...row, [field]: !row[field] };
      if (calculateFields && checkboxRecalcFields.includes(field)) {
        updatedRow = calculateFields(updatedRow, field);
      }
      setRows(prev => prev.map(r => getUniqueId(r) === getUniqueId(row) ? updatedRow : r));
      saveRow(updatedRow);
    }
  };

  // ── start editing ─────────────────────────────────────────────────────
  const startEdit = (row) => {
    setEditingId(getUniqueId(row));
    setDraft({ ...row });
  };

  // ── commit changes ────────────────────────────────────────────────────
  const commitEdit = useCallback(() => {
    if (!draft) return;
    let saved = { ...draft };
    // coerce numeric columns
    columns.forEach(col => {
      if (col.type === 'number' || col.type === 'computed') {
        saved[col.key] = Number(saved[col.key]) || 0;
      }
    });
    setRows(prev => prev.map(r => getUniqueId(r) === getUniqueId(saved) ? saved : r));
    if (onSave) {
      onSave(saved);
    }
    setEditingId(null);
    setDraft(null);
  }, [draft, columns, calculateFields, onSave]);

  const handleDeleteRequest = (e, row) => {
    e.stopPropagation();
    setDeleteModal({ isOpen: true, rowId: row.id, tx_type: row.tx_type });
  };

  const confirmDelete = (password) => {
    if (onDelete) {
      onDelete(deleteModal.rowId, password, deleteModal.tx_type);
    }
    setDeleteModal({ isOpen: false, rowId: null, tx_type: null });
  };

  // ── keyboard shortcuts ────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      commitEdit();
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setDraft(null);
    }
  };

  // ── click-outside to save ─────────────────────────────────────────────
  useEffect(() => {
    if (!editingId) return;
    const handler = (e) => {
      if (editRowRef.current && !editRowRef.current.contains(e.target)) {
        commitEdit();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [editingId, commitEdit]);

  // ── draft field update helper ─────────────────────────────────────────
  const setField = (field, value) => {
    setDraft(prev => {
      let next = { ...prev, [field]: value };

      // Mutual exclusion logic for type1 and type2 removed to allow both
      

      if (calculateFields) {
        const recalced = calculateFields(next, field);
        return recalced;
      }
      return next;
    });
  };

  // ── header labels: # + Actions + dynamic columns ─────────────────────
  const headerLabels = ['#', 'Actions', ...columns.map(c => c.label)];

  // ── render a single cell based on column type ─────────────────────────
  const renderCell = (col, row, isEditing, idx) => {
    // Hide inputs for non-adjustment fields if it's an adjustment row
    const isAdjRow = row.tx_type === 'OUT_ADJ';
    const adjFieldsToHide = ['type1', 'type2', 'material', 'rate', 'vendor', 'seller'];
    
    if (isAdjRow && adjFieldsToHide.includes(col.key)) {
      return (
        <td key={col.key} className="px-3 py-1.5 border-r border-[#E2E8F0] text-center text-slate-400">
          ---
        </td>
      );
    }

    const value = isEditing ? draft[col.key] : row[col.key];

    // Support custom render function for non-editing mode
    if (!isEditing && col.render) {
      return (
        <td key={col.key} className={`px-3 py-1.5 border-r border-[#E2E8F0] text-center`} style={col.minWidth ? { minWidth: col.minWidth } : {}}>
          {col.render(value, row)}
        </td>
      );
    }

    switch (col.type) {
      case 'checkbox':
        return (
          <td key={col.key} className={`px-3 py-1.5 text-center ${idx < columns.length - 1 ? 'border-r border-[#E2E8F0]' : ''}`}>
            {value === '---' ? (
              <span className="text-slate-400">---</span>
            ) : (
              <input
                type="checkbox"
                checked={isEditing ? draft[col.key] : row[col.key]}
                onChange={() => toggleCheckbox(row, col.key)}
                className="accent-[#2563EB] w-3.5 h-3.5 cursor-pointer"
              />
            )}
          </td>
        );

      case 'date':
        return (
          <td key={col.key} className={`px-3 py-1.5 border-r border-[#E2E8F0] font-mono text-xs text-[#64748B] text-center w-[100px] whitespace-nowrap`} style={col.minWidth ? { minWidth: col.minWidth } : { minWidth: '100px' }}>
            {isEditing
              ? <DateField field={col.key} value={draft[col.key]} onChange={setField} onKeyDown={handleKeyDown} />
              : <ViewText value={formatDate(row[col.key])} field={col.key} />}
          </td>
        );

      case 'number':
        return (
          <td key={col.key} className="px-3 py-1.5 border-r border-[#E2E8F0] font-mono text-center text-[#0F172A]" style={col.minWidth ? { minWidth: col.minWidth } : { minWidth: '100px' }}>
            {isEditing
              ? <EditNum 
                  field={col.key} 
                  value={draft[col.key]} 
                  onChange={setField} 
                  onKeyDown={handleKeyDown} 
                />
              : <ViewText value={
                  (value === '---') ? '---' : 
                  (col.prefix ? `${col.prefix}${value}` : value)
                } type={col.type} field={col.key} />}
          </td>
        );

      case 'computed':
        return (
          <td key={col.key} className="px-3 py-1.5 border-r border-[#E2E8F0] font-mono font-semibold text-center text-[#0F172A]" style={col.minWidth ? { minWidth: col.minWidth } : { minWidth: '120px' }}>
            {isEditing
              ? <EditNum field={col.key} value={draft[col.key]} onChange={setField} onKeyDown={handleKeyDown} />
              : <ViewText value={
                  (value === '---') ? '---' : 
                  (value === undefined || value === null || value === '') 
                    ? '' 
                    : col.prefix 
                      ? `${col.prefix}${Number(value).toLocaleString()}` 
                      : Number(value).toLocaleString()
                } field={col.key} />}
          </td>
        );

      case 'combobox':
        return (
          <td key={col.key} className="px-3 py-1.5 border-r border-[#E2E8F0] text-[#64748B] text-center" style={col.minWidth ? { minWidth: col.minWidth } : { minWidth: '120px' }}>
            {isEditing ? (
              <EditCombobox
                field={col.key}
                value={draft[col.key]}
                options={comboOptions[col.key] || []}
                onChange={setField}
                onAddNew={addOption}
                onAddNewOption={onAddNewOption}
                onKeyDown={handleKeyDown}
              />
            ) : (
              <ViewText value={row[col.key]} field={col.key} />
            )}
          </td>
        );

      case 'stacked-number':
        return (
          <td key={col.key} className="px-3 py-1.5 border-r border-[#E2E8F0] font-mono text-center text-[#0F172A]" style={col.minWidth ? { minWidth: col.minWidth } : { minWidth: '100px' }}>
            {isEditing ? (
              <div className="flex flex-col gap-1.5">
                <EditNum 
                  field={col.key} 
                  value={draft[col.key]} 
                  onChange={setField} 
                  onKeyDown={handleKeyDown} 
                  cls="placeholder:text-gray-400 placeholder:text-[10px]"
                  placeholder="kg"
                />
                {col.subKey && (
                  <EditNum 
                    field={col.subKey} 
                    value={draft[col.subKey]} 
                    onChange={setField} 
                    onKeyDown={handleKeyDown} 
                    cls="placeholder:text-gray-400 placeholder:text-[10px]"
                    placeholder="pcs"
                  />
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-1 items-center justify-center">
                <ViewText value={
                  (row[col.key] === '---') ? '---' : 
                  (col.prefix ? `${col.prefix}${row[col.key]}` : (Number(row[col.key]) ? `${row[col.key]}kg` : ''))
                } field={col.key} />
                {col.subKey && Number(row[col.subKey]) > 0 && (
                  <div className="text-[10px] text-[#64748B] font-bold">
                    {row[col.subKey]}pcs
                  </div>
                )}
              </div>
            )}
          </td>
        );

      case 'text':
      default:
        const isRemark = col.key === 'remark';
        return (
          <td 
            key={col.key} 
            className={`px-3 py-1.5 border-r border-[#E2E8F0] font-medium text-center text-[#0F172A] ${isRemark ? 'max-w-[250px]' : 'max-w-[150px]'}`} 
            style={col.minWidth ? { minWidth: col.minWidth } : { minWidth: '140px' }}
          >
            {isEditing
              ? <EditText field={col.key} value={draft[col.key]} onChange={setField} onKeyDown={handleKeyDown} autoFocus={col.autoFocus} />
              : <ViewText value={row[col.key]} field={col.key} />}
          </td>
        );
    }
  };

  return (
    <div className="flex flex-col h-full">

      {/* ── table wrapper ── */}
      <div className="flex-1 overflow-auto border border-[#E2E8F0] rounded-lg">
        <table className="min-w-full text-sm border-collapse">

          {/* sticky header */}
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#334155] text-white">
              {headerLabels.map(col => (
                <th
                  key={col}
                  className="px-3 py-2 text-center text-xs font-semibold tracking-wide border-r border-[#475569] last:border-r-0 whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filteredRows.map((row, idx) => {
              const uniqueRowId = getUniqueId(row);
              const isEditing = editingId === uniqueRowId;
              const rowCls = `border-b border-[#E2E8F0] transition-colors ${
                row.isTotal
                  ? 'bg-slate-50 font-bold'
                  : isEditing
                    ? 'bg-[#EFF6FF] ring-2 ring-inset ring-[#93C5FD]'
                    : idx % 2 === 0
                      ? 'bg-white hover:bg-[#F1F5F9]'
                      : 'bg-[#F8FAFC] hover:bg-[#F1F5F9]'
              }`;

              return (
                <tr
                  key={uniqueRowId}
                  ref={isEditing ? editRowRef : null}
                  className={rowCls}
                >
                  {/* # */}
                  <td className="px-3 py-1.5 text-[#64748B] border-r border-[#E2E8F0] w-8 text-center font-mono text-xs">
                    {idx + 1}
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-1.5 border-r border-[#E2E8F0] whitespace-nowrap text-center w-[80px]">
                    {row.isTotal ? (
                      <span className="font-bold text-[#0F172A] text-xs">{row.actionLabel || 'TOTAL'}</span>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5">
                        {isEditing ? (
                          <button
                            title="Save"
                            onMouseDown={e => { e.stopPropagation(); commitEdit(); }}
                            className="w-6 h-6 flex items-center justify-center rounded bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors"
                          >
                            <Save size={13} />
                          </button>
                        ) : !row.readOnly ? (
                          <button
                            title="Edit"
                            onClick={() => startEdit(row)}
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-blue-50 text-[#2563EB] transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                        ) : null}

                        <button
                          title="Delete"
                          className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-red-500 transition-colors"
                          onClick={(e) => handleDeleteRequest(e, row)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </td>

                  {/* Dynamic columns */}
                  {columns.map((col, colIdx) => renderCell(col, row, isEditing, colIdx))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Month & Year pagination ── */}
      {!hideFilters && (
        <div className="mt-4 flex items-center justify-between gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-medium text-[#64748B] mr-1">Months:</span>
            <div className="flex items-center gap-1 bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#E2E8F0] mr-2">
              <span className="text-[10px] font-bold text-[#475569]">{filteredRows.length}</span>
              <span className="text-[10px] text-[#64748B]">Records</span>
            </div>
            {visibleMonths.map((month, idx) => (
              <button
                key={month}
                onClick={() => setActiveMonth(idx)}
                className={`px-3 py-1 text-xs rounded border transition-colors ${
                  activeMonth === idx
                    ? 'bg-[#2563EB] text-white border-[#2563EB] font-semibold'
                    : 'bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                }`}
              >
                {month}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#64748B]">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => {
                const yr = Number(e.target.value);
                setSelectedYear(yr);
                if (yr === currentYear && activeMonth > currentMonth) {
                  setActiveMonth(currentMonth);
                }
              }}
              className="text-xs bg-white border border-[#E2E8F0] rounded px-2 py-1 outline-none text-[#0F172A] focus:ring-1 focus:ring-[#2563EB]"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <DeleteConfirmModal 
        isOpen={deleteModal.isOpen} 
        onCancel={() => setDeleteModal({ isOpen: false, rowId: null })}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
