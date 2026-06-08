import { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';

/**
 * DateField – Custom date input component
 *
 * Props:
 *   value    – ISO date string (YYYY-MM-DD) or empty
 *   onChange  – fn(field, isoValue) called when date changes
 *   field    – field key passed back to onChange
 *   onKeyDown – optional keyboard handler
 *   className – optional extra classes
 */
export default function DateField({ value, onChange, field, onKeyDown, className = '' }) {
  const [display, setDisplay] = useState('');
  const hiddenDateRef = useRef(null);
  const currentYear = new Date().getFullYear();

  // Sync display from parent ISO value
  useEffect(() => {
    if (!value) {
      setDisplay('');
      return;
    }
    const dateOnly = value.includes('T') ? value.split('T')[0] : value;
    const parts = dateOnly.split('-');
    if (parts.length === 3) {
      const [, m, d] = parts;
      setDisplay(`${d}/${m}`);
    }
  }, [value]);

  // ── Auto-format while typing ──────────────────────────────────────────
  const handleChange = (e) => {
    let raw = e.target.value;

    // Strip non-digits and non-slashes
    raw = raw.replace(/[^\d/]/g, '');

    // Prevent more than 5 chars (DD/MM)
    if (raw.replace('/', '').length > 4) return;

    // Auto-insert slash after 2 digits
    const digits = raw.replace(/\//g, '');
    if (digits.length >= 2 && !raw.includes('/')) {
      raw = digits.slice(0, 2) + '/' + digits.slice(2);
    }

    // Cap at DD/MM format length
    if (raw.length > 5) raw = raw.slice(0, 5);

    setDisplay(raw);
  };

  // ── Parse and validate on blur ────────────────────────────────────────
  const commitValue = () => {
    if (!display || display.trim() === '') {
      onChange(field, '');
      return;
    }

    const parts = display.split('/');
    if (parts.length !== 2) return;

    const dayStr = parts[0].padStart(2, '0');
    const monStr = parts[1].padStart(2, '0');
    const day = parseInt(dayStr, 10);
    const mon = parseInt(monStr, 10);

    // Validate ranges
    if (isNaN(day) || isNaN(mon) || day < 1 || day > 31 || mon < 1 || mon > 12) {
      return; // reject silently
    }

    // Format & push
    const iso = `${currentYear}-${monStr}-${dayStr}`;
    setDisplay(`${dayStr}/${monStr}`);
    onChange(field, iso);
  };

  const handleBlur = () => commitValue();

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      commitValue();
    }
    if (onKeyDown) onKeyDown(e);
  };

  // ── Calendar icon click → open hidden native picker ───────────────────
  const openCalendar = (e) => {
    e.stopPropagation();
    if (hiddenDateRef.current) {
      hiddenDateRef.current.showPicker?.();
    }
  };

  const handleCalendarChange = (e) => {
    const picked = e.target.value; // YYYY-MM-DD
    if (!picked) return;
    const [, m, d] = picked.split('-');
    // Force current year regardless of what was picked
    const iso = `${currentYear}-${m}-${d}`;
    setDisplay(`${d}/${m}`);
    onChange(field, iso);
  };

  return (
    <div className="relative flex items-center" onClick={e => e.stopPropagation()}>
      {/* Visible text input */}
      <input
        type="text"
        value={display}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="DD/MM"
        className={`w-full bg-[#EFF6FF] border border-[#93C5FD] rounded px-1.5 py-0.5 text-xs text-[#0F172A] outline-none focus:ring-1 focus:ring-[#2563EB] placeholder:text-[#94A3B8] text-center pr-6 ${className}`}
      />

      {/* Calendar icon */}
      <button
        type="button"
        onClick={openCalendar}
        className="absolute right-1 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#2563EB] transition-colors"
        title="Open calendar"
      >
        <Calendar size={12} />
      </button>

      {/* Hidden native date picker */}
      <input
        ref={hiddenDateRef}
        type="date"
        onChange={handleCalendarChange}
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
        tabIndex={-1}
      />
    </div>
  );
}
