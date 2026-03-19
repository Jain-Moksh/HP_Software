import { useState, useEffect, useRef, useCallback } from 'react';
import { Pencil, Save, Trash2 } from 'lucide-react';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// ─── formatters ──────────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}-${m}-${y}`;
};

// ─── shared input style ───────────────────────────────────────────────────────
const inputCls =
  'w-full bg-[#EFF6FF] border border-[#93C5FD] rounded px-1.5 py-0.5 text-xs text-[#0F172A] outline-none focus:ring-1 focus:ring-[#2563EB] placeholder:text-[#94A3B8]';

// ─── helper components (outside to prevent remounting) ───────────────────────
const ViewText = ({ value, cls = '' }) => <span className={cls}>{value}</span>;

const EditText = ({ field, value, onChange, onKeyDown, cls = '', autoFocus = false }) => (
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

const EditNum = ({ field, value, onChange, onKeyDown, cls = '' }) => (
  <input
    type="number"
    value={value}
    onChange={e => onChange(field, e.target.value)}
    onKeyDown={onKeyDown}
    className={`${inputCls} text-center ${cls}`}
    onClick={e => e.stopPropagation()}
  />
);

const EditDate = ({ field, value, onChange, onKeyDown }) => (
  <input
    type="date"
    value={value}
    onChange={e => onChange(field, e.target.value)}
    onKeyDown={onKeyDown}
    className={`${inputCls} text-center`}
    onClick={e => e.stopPropagation()}
  />
);

const EditCombobox = ({ field, value, options, onChange, onAddNew, onKeyDown }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [typed, setTyped] = useState(value);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef(null);

  // Filter options based on typed text
  const filtered = options.filter(opt =>
    opt.toLowerCase().includes(typed.toLowerCase())
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
      onAddNew(field, newVal);
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

  // Close list on click outside
  useEffect(() => {
    const clickHandler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', clickHandler);
    return () => document.removeEventListener('mousedown', clickHandler);
  }, []);

  return (
    <div className="relative w-full" ref={wrapperRef} onClick={e => e.stopPropagation()}>
      <input
        type="text"
        value={typed}
        onChange={e => { setTyped(e.target.value); setIsOpen(true); setHighlightedIndex(-1); }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleLocalKeyDown}
        className={`${inputCls} text-center`}
        placeholder="Type to search..."
      />
      
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-[#93C5FD] rounded shadow-lg max-h-48 overflow-y-auto ring-1 ring-black ring-opacity-5">
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
        </div>
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
  comboboxFields = {},
  calculateFields,
  checkboxRecalcFields = [],
}) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [activeMonth, setActiveMonth]   = useState(currentMonth);
  const [rows, setRows]                 = useState(initialData);
  const [editingId, setEditingId]       = useState(null);
  const [draft, setDraft]               = useState(null);

  // Sync rows when initialData changes externally (e.g. after a new entry save)
  useEffect(() => {
    setRows(initialData);
  }, [initialData]);

  // ── dynamic combobox options ────────────────────────────────────────────
  const [comboOptions, setComboOptions] = useState(() => {
    const init = {};
    for (const key of Object.keys(comboboxFields)) {
      const fromProps = comboboxFields[key] || [];
      const fromData = [...new Set(initialData.map(r => r[key]).filter(Boolean))];
      init[key] = [...new Set([...fromProps, ...fromData])].sort();
    }
    return init;
  });

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
  const filteredRows = rows.filter(r => r._month === activeMonth && r._year === selectedYear);

  // ── save handler ──────────────────────────────────────────────────────
  const saveRow = async (row) => {
    if (onSave) await onSave(row);
    else console.log('[DB] Saving row:', row);
  };

  // ── checkbox toggle helper ────────────────────────────────────────────
  const toggleCheckbox = (row, field) => {
    if (editingId === row.id) {
      setField(field, !draft[field]);
    } else {
      let updatedRow = { ...row, [field]: !row[field] };
      if (calculateFields && checkboxRecalcFields.includes(field)) {
        updatedRow = calculateFields(updatedRow);
      }
      setRows(prev => prev.map(r => r.id === row.id ? updatedRow : r));
      saveRow(updatedRow);
    }
  };

  // ── start editing ─────────────────────────────────────────────────────
  const startEdit = (row) => {
    setEditingId(row.id);
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
    if (calculateFields) saved = calculateFields(saved);
    setRows(prev => prev.map(r => r.id === saved.id ? saved : r));
    saveRow(saved);
    setEditingId(null);
    setDraft(null);
  }, [draft, columns, calculateFields]);

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
      const next = { ...prev, [field]: value };
      if (calculateFields) {
        const recalced = calculateFields(next);
        return recalced;
      }
      return next;
    });
  };

  // ── header labels: # + Actions + dynamic columns ─────────────────────
  const headerLabels = ['#', 'Actions', ...columns.map(c => c.label)];

  // ── render a single cell based on column type ─────────────────────────
  const renderCell = (col, row, isEditing, idx) => {
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
            <input
              type="checkbox"
              checked={isEditing ? draft[col.key] : row[col.key]}
              onChange={() => toggleCheckbox(row, col.key)}
              className="accent-[#2563EB] w-3.5 h-3.5 cursor-pointer"
            />
          </td>
        );

      case 'date':
        return (
          <td key={col.key} className={`px-3 py-1.5 border-r border-[#E2E8F0] font-mono text-xs text-[#64748B] text-center`} style={col.minWidth ? { minWidth: col.minWidth } : { minWidth: '120px' }}>
            {isEditing
              ? <EditDate field={col.key} value={draft[col.key]} onChange={setField} onKeyDown={handleKeyDown} />
              : <ViewText value={formatDate(row[col.key])} />}
          </td>
        );

      case 'number':
        return (
          <td key={col.key} className="px-3 py-1.5 border-r border-[#E2E8F0] font-mono text-center text-[#0F172A]" style={col.minWidth ? { minWidth: col.minWidth } : { maxWidth: '80px' }}>
            {isEditing
              ? <EditNum field={col.key} value={draft[col.key]} onChange={setField} onKeyDown={handleKeyDown} />
              : <ViewText value={col.prefix ? `${col.prefix}${value}` : value} />}
          </td>
        );

      case 'computed':
        return (
          <td key={col.key} className="px-3 py-1.5 border-r border-[#E2E8F0] font-mono font-semibold text-center text-[#0F172A]" style={col.minWidth ? { minWidth: col.minWidth } : { maxWidth: '100px' }}>
            {isEditing
              ? <EditNum field={col.key} value={draft[col.key]} onChange={setField} onKeyDown={handleKeyDown} />
              : <ViewText value={col.prefix ? `${col.prefix}${Number(value).toLocaleString()}` : Number(value).toLocaleString()} />}
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
                onKeyDown={handleKeyDown}
              />
            ) : (
              <ViewText value={row[col.key]} />
            )}
          </td>
        );

      case 'text':
      default:
        return (
          <td key={col.key} className="px-3 py-1.5 border-r border-[#E2E8F0] font-medium text-center text-[#0F172A]" style={col.minWidth ? { minWidth: col.minWidth } : { minWidth: '140px' }}>
            {isEditing
              ? <EditText field={col.key} value={draft[col.key]} onChange={setField} onKeyDown={handleKeyDown} autoFocus={col.autoFocus} />
              : <ViewText value={row[col.key]} />}
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
              const isEditing = editingId === row.id;
              const rowCls = `border-b border-[#E2E8F0] transition-colors ${
                isEditing
                  ? 'bg-[#EFF6FF] ring-2 ring-inset ring-[#93C5FD]'
                  : idx % 2 === 0
                    ? 'bg-white hover:bg-[#F1F5F9]'
                    : 'bg-[#F8FAFC] hover:bg-[#F1F5F9]'
              }`;

              return (
                <tr
                  key={row.id}
                  ref={isEditing ? editRowRef : null}
                  className={rowCls}
                >
                  {/* # */}
                  <td className="px-3 py-1.5 text-[#64748B] border-r border-[#E2E8F0] w-8 text-center font-mono text-xs">
                    {idx + 1}
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-1.5 border-r border-[#E2E8F0] whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {isEditing ? (
                        <button
                          title="Save"
                          onMouseDown={e => { e.stopPropagation(); commitEdit(); }}
                          className="w-6 h-6 flex items-center justify-center rounded bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors"
                        >
                          <Save size={13} />
                        </button>
                      ) : (
                        <button
                          title="Edit"
                          onClick={() => startEdit(row)}
                          className="w-6 h-6 flex items-center justify-center rounded hover:bg-blue-50 text-[#2563EB] transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                      )}

                      <button
                        title="Delete"
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-red-500 transition-colors"
                        onClick={() => setRows(prev => prev.filter(r => r.id !== row.id))}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
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

        {/* Year Dropdown */}
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
    </div>
  );
}
