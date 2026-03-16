import { useState, useEffect, useRef, useCallback } from 'react';
import { Pencil, Save, Trash2 } from 'lucide-react';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// ─── calculation helper ──────────────────────────────────────────────────────
const calculateAmount = (type1, type2, rate, isBilled) => {
  const t1 = Number(type1) || 0;
  const t2 = Number(type2) || 0;
  const r = Number(rate) || 0;
  let total = (t1 + t2) * r;
  if (isBilled) {
    total = total + 0.18 * total;
  }
  return Math.round(total);
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
            _year: year
        };
        // Calculate amount dynamically for mock data
        entry.amount = calculateAmount(entry.type1, entry.type2, entry.rate, entry.b);
        data.push(entry);
    }
  };

  createEntries(0, 2026, 30, 'HDPE Granules'); // Jan
  createEntries(1, 2026, 20, 'NBR Rubber');    // Feb
  createEntries(2, 2026, 25, 'PVC Pipes');     // Mar

  return data;
};

const ALL_DATA = generateMockData();

// ─── formatters ──────────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}-${m}-${y}`;
};

// ─── stub: replace with real API call when backend is ready ───────────────────
async function saveToBackend(row) {
  console.log('[DB] Saving row:', row);
}

// ─── shared input style ───────────────────────────────────────────────────────
const inputCls =
  'w-full bg-[#EFF6FF] border border-[#93C5FD] rounded px-1.5 py-0.5 text-xs text-[#0F172A] outline-none focus:ring-1 focus:ring-[#2563EB] placeholder:text-[#94A3B8]';

// ─── helper components (outside to prevent remounting) ───────────────────────
const ViewText = ({ value, cls = '' }) => <span className={cls}>{value}</span>;

const EditText = ({ field, value, onChange, onKeyDown, cls = '' }) => (
  <input
    type="text"
    value={value}
    onChange={e => onChange(field, e.target.value)}
    onKeyDown={onKeyDown}
    className={`${inputCls} text-center ${cls}`}
    onClick={e => e.stopPropagation()}
    autoFocus={field === 'material'} 
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
          e.stopPropagation(); // don't trigger row save yet if we're just selecting
        } else if (showAdd && highlightedIndex === filtered.length) {
          handleAddNew();
          e.stopPropagation();
        } else {
            // If nothing highlighted but text exists and matches something, select it maybe?
            // Or just let it through to row save
            onKeyDown(e);
        }
      } else {
        onKeyDown(e);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      onKeyDown(e);
    } else {
      // For other keys, just ensure we are "open" if typing
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

export default function MaterialTable() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-indexed

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [activeMonth, setActiveMonth]   = useState(currentMonth);
  const [rows, setRows]               = useState(ALL_DATA);
  const [editingId, setEditingId]     = useState(null);   // which row is in edit mode
  const [draft, setDraft]             = useState(null);   // working copy of the row

  // ── dynamic options list ────────────────────────────────────────────────
  const [sellers, setSellers]         = useState([...new Set(ALL_DATA.map(r => r.seller))].sort());
  const [jobbers, setJobbers]         = useState([...new Set(ALL_DATA.map(r => r.jobber))].sort());

  const addOption = (field, newValue) => {
    if (field === 'seller') {
      setSellers(prev => [...new Set([...prev, newValue])].sort());
    } else if (field === 'jobber') {
      setJobbers(prev => [...new Set([...prev, newValue])].sort());
    }
  };

  const editRowRef = useRef(null); // ref on the <tr> that's being edited

  // ── filter visible months ────────────────────────────────────────────────
  const visibleMonths = (selectedYear === currentYear)
    ? MONTHS.slice(0, currentMonth + 1)
    : MONTHS;

  // ── year options ────────────────────────────────────────────────────────
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // ── filtered data for display ──────────────────────────────────────────
  const filteredRows = rows.filter(r => r._month === activeMonth && r._year === selectedYear);

  // ── checkbox toggle helper ────────────────────────────────────────────────
  const toggleCheckbox = (row, field) => {
    if (editingId === row.id) {
      // In edit mode: update draft
      setField(field, !draft[field]);
    } else {
      // Not in edit mode: update state immediately
      const isBilled = field === 'b' ? !row.b : row.b;
      const amount = field === 'b' 
        ? calculateAmount(row.type1, row.type2, row.rate, isBilled)
        : row.amount;

      const updatedRow = { ...row, [field]: !row[field], amount };
      setRows(prev => prev.map(r => r.id === row.id ? updatedRow : r));
      saveToBackend(updatedRow);
    }
  };

  // ── start editing a row ───────────────────────────────────────────────────
  const startEdit = (row) => {
    setEditingId(row.id);
    setDraft({ ...row });
  };

  // ── commit changes ────────────────────────────────────────────────────────
  const commitEdit = useCallback(() => {
    if (!draft) return;
    const saved = {
      ...draft,
      type1:  Number(draft.type1)  || 0,
      type2:  Number(draft.type2)  || 0,
      rate:   Number(draft.rate)   || 0,
      amount: Number(draft.amount) || 0,
    };
    setRows(prev => prev.map(r => r.id === saved.id ? saved : r));
    saveToBackend(saved);
    setEditingId(null);
    setDraft(null);
  }, [draft]);

  // ── handle keyboard shortcuts ─────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      commitEdit();
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setDraft(null);
    }
  };

  // ── click-outside to save ─────────────────────────────────────────────────
  useEffect(() => {
    if (!editingId) return;

    const handler = (e) => {
      if (editRowRef.current && !editRowRef.current.contains(e.target)) {
        commitEdit();
      }
    };

    // use mousedown so it fires before React's synthetic onClick
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [editingId, commitEdit]);

  // ── draft field update helper ─────────────────────────────────────────────
  const setField = (field, value) => {
    setDraft(prev => {
      const next = { ...prev, [field]: value };
      // Recalculate amount if any dependent field changes
      if (['type1', 'type2', 'rate', 'b'].includes(field)) {
        next.amount = calculateAmount(next.type1, next.type2, next.rate, next.b);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full">

      {/* ── table wrapper ── */}
      <div className="flex-1 overflow-auto border border-[#E2E8F0] rounded-lg">
        <table className="min-w-full text-sm border-collapse">

          {/* sticky header */}
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#334155] text-white">
              {['#','Actions','Type 1','Type 2','Material','Rate','Seller','Jobber','Date','Amount','W','B','A'].map(col => (
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
                      {/* Pen → Save toggle */}
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

                      {/* Delete (always visible) */}
                      <button
                        title="Delete"
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-red-500 transition-colors"
                        onClick={() => setRows(prev => prev.filter(r => r.id !== row.id))}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>

                  {/* Type 1 – numeric */}
                  <td className="px-3 py-1.5 border-r border-[#E2E8F0] font-mono text-center text-[#0F172A] max-w-[72px]">
                    {isEditing ? <EditNum field="type1" value={draft.type1} onChange={setField} onKeyDown={handleKeyDown} /> : <ViewText value={row.type1} />}
                  </td>

                  {/* Type 2 – numeric */}
                  <td className="px-3 py-1.5 border-r border-[#E2E8F0] font-mono text-center text-[#0F172A] max-w-[72px]">
                    {isEditing ? <EditNum field="type2" value={draft.type2} onChange={setField} onKeyDown={handleKeyDown} /> : <ViewText value={row.type2} />}
                  </td>

                  {/* Material */}
                  <td className="px-3 py-1.5 border-r border-[#E2E8F0] font-medium text-center text-[#0F172A] min-w-[140px]">
                    {isEditing ? <EditText field="material" value={draft.material} onChange={setField} onKeyDown={handleKeyDown} /> : <ViewText value={row.material} />}
                  </td>

                  {/* Rate */}
                  <td className="px-3 py-1.5 border-r border-[#E2E8F0] font-mono text-center text-[#0F172A] max-w-[80px]">
                    {isEditing ? <EditNum field="rate" value={draft.rate} onChange={setField} onKeyDown={handleKeyDown} /> : <ViewText value={`₹${row.rate}`} />}
                  </td>

                  {/* Seller */}
                  <td className="px-3 py-1.5 border-r border-[#E2E8F0] text-[#64748B] min-w-[120px] text-center">
                    {isEditing ? (
                      <EditCombobox 
                        field="seller" 
                        value={draft.seller} 
                        options={sellers} 
                        onChange={setField} 
                        onAddNew={addOption}
                        onKeyDown={handleKeyDown} 
                      />
                    ) : (
                      <ViewText value={row.seller} text-center />
                    )}
                  </td>

                  {/* Jobber */}
                  <td className="px-3 py-1.5 border-r border-[#E2E8F0] text-[#64748B] min-w-[120px] text-center">
                    {isEditing ? (
                      <EditCombobox 
                        field="jobber" 
                        value={draft.jobber} 
                        options={jobbers} 
                        onChange={setField} 
                        onAddNew={addOption}
                        onKeyDown={handleKeyDown} 
                      />
                    ) : (
                      <ViewText value={row.jobber} text-center />
                    )}
                  </td>

                  {/* Date */}
                  <td className="px-3 py-1.5 border-r border-[#E2E8F0] font-mono text-xs text-[#64748B] min-w-[120px] text-center">
                    {isEditing ? <EditDate field="date" value={draft.date} onChange={setField} onKeyDown={handleKeyDown} /> : <ViewText value={formatDate(row.date)} text-center />}
                  </td>

                  {/* Amount */}
                  <td className="px-3 py-1.5 border-r border-[#E2E8F0] font-mono font-semibold text-center text-[#0F172A] max-w-[100px]">
                    {isEditing ? <EditNum field="amount" value={draft.amount} onChange={setField} onKeyDown={handleKeyDown} /> : <ViewText value={`₹${row.amount.toLocaleString()}`} />}
                  </td>

                  {/* W */}
                  <td className="px-3 py-1.5 border-r border-[#E2E8F0] text-center">
                    <input
                      type="checkbox"
                      checked={isEditing ? draft.w : row.w}
                      onChange={() => toggleCheckbox(row, 'w')}
                      className="accent-[#2563EB] w-3.5 h-3.5 cursor-pointer"
                    />
                  </td>

                  {/* B */}
                  <td className="px-3 py-1.5 border-r border-[#E2E8F0] text-center">
                    <input
                      type="checkbox"
                      checked={isEditing ? draft.b : row.b}
                      onChange={() => toggleCheckbox(row, 'b')}
                      className="accent-[#2563EB] w-3.5 h-3.5 cursor-pointer"
                    />
                  </td>

                  {/* A */}
                  <td className="px-3 py-1.5 text-center">
                    <input
                      type="checkbox"
                      checked={isEditing ? draft.a : row.a}
                      onChange={() => toggleCheckbox(row, 'a')}
                      className="accent-[#2563EB] w-3.5 h-3.5 cursor-pointer"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Month & Year pagination ── */}
      <div className="mt-4 flex items-center justify-between gap-1.5 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium text-[#64748B] mr-1">Month:</span>
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
              // reset month if it's beyond current month when selecting current year
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
