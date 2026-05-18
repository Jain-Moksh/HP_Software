import { useState, useRef, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ArrowLeft, RefreshCw, AlertTriangle, Upload, CheckCircle2, X } from 'lucide-react';
import API_BASE_URL from '../config';

export default function SystemRestore() {
  const navigate = useNavigate();
  const { setHeaderActions } = useOutletContext();

  const [selectedFile, setSelectedFile] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const fileInputRef = useRef(null);

  // Clear header actions
  useEffect(() => {
    setHeaderActions?.(null);
    return () => setHeaderActions?.(null);
  }, [setHeaderActions]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.name.endsWith('.sql') || file.name.endsWith('.backup')) {
        setSelectedFile(file);
      } else {
        alert('Invalid file format. Please upload a .sql or .backup file.');
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.name.endsWith('.sql') || file.name.endsWith('.backup')) {
        setSelectedFile(file);
      } else {
        alert('Invalid file format. Please upload a .sql or .backup file.');
      }
    }
  };

  const handleRestore = async () => {
    if (!selectedFile) return;
    
    const confirmRestore = window.confirm(
      "CRITICAL WARNING:\n\n" +
      "This operation will PERMANENTLY OVERWRITE all current database records including all masters, transactions, transfers, and adjustments.\n\n" +
      "This action CANNOT BE UNDONE. Ensure you have backed up your current database before proceeding.\n\n" +
      "Are you absolutely sure you want to overwrite your entire database?"
    );

    if (!confirmRestore) return;

    try {
      setRestoring(true);
      const sqlText = await selectedFile.text();

      const resp = await fetch(`${API_BASE_URL}/utility/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sqlText })
      });

      const data = await resp.json();
      if (resp.ok && data.success) {
        alert('Database restored successfully! The system will now reload.');
        setSelectedFile(null);
        navigate('/material-in');
        window.location.reload();
      } else {
        alert(data.error || 'Failed to restore database from backup file.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while uploading or running the restoration script.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC]">
      {/* ── Page Toolbar ── */}
      <div className="flex-none bg-white border-b border-[#E2E8F0] px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/utility')}
            className="p-2 hover:bg-[#F1F5F9] rounded-lg text-[#64748B] hover:text-[#0F172A] transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
              System Restore
            </h1>
            <p className="text-xs text-[#64748B]">Recover database from backup files</p>
          </div>
        </div>
      </div>

      {/* ── Main Restoration Form ── */}
      <div className="flex-1 p-6 overflow-y-auto flex items-center justify-center">
        <div className="w-full max-w-2xl bg-white p-8 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center shadow-sm">
              <RefreshCw size={22} className={restoring ? 'animate-spin' : ''} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#0F172A]">Restore System</h3>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mt-0.5">Overwrite existing data from backup</p>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3 text-xs leading-relaxed text-[#B91C1C]">
            <AlertTriangle size={20} className="text-[#EF4444] shrink-0" />
            <p>
              <strong className="font-extrabold uppercase tracking-tighter">WARNING</strong>: Restoring data will <strong className="font-extrabold text-[#EF4444]">PERMANENTLY OVERWRITE</strong> all current system records. This action cannot be undone. Ensure you have a current backup before proceeding.
            </p>
          </div>

          {/* Drag & Drop File Container */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => !restoring && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer ${
              selectedFile 
                ? 'border-[#10B981] bg-[#ECFDF5]/20' 
                : 'border-[#CBD5E1] hover:border-[#2563EB] hover:bg-[#F8FAFC]'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".sql,.backup"
              className="hidden"
              disabled={restoring}
            />

            {selectedFile ? (
              <>
                <CheckCircle2 size={40} className="text-[#10B981]" />
                <div className="text-center">
                  <span className="text-sm font-bold text-[#0F172A] block truncate max-w-md">
                    {selectedFile.name}
                  </span>
                  <span className="text-xs font-semibold text-[#64748B] block mt-0.5">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  className="p-1 hover:bg-slate-200 rounded-full text-[#64748B] transition-colors"
                  disabled={restoring}
                  title="Clear Selected File"
                >
                  <X size={16} />
                </button>
              </>
            ) : (
              <>
                <Upload size={40} className="text-[#94A3B8]" />
                <div className="text-center">
                  <span className="text-sm font-bold text-[#475569] hover:text-[#2563EB]">
                    Click to select backup file
                  </span>
                  <span className="text-xs font-semibold text-[#94A3B8] block mt-0.5">
                    Supported formats: .sql, .backup
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Start Restoration Button */}
          <button
            onClick={handleRestore}
            disabled={!selectedFile || restoring}
            className={`w-full py-4 px-6 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors ${
              !selectedFile 
                ? 'bg-[#F1F5F9] text-[#94A3B8] cursor-not-allowed border border-[#E2E8F0]'
                : restoring
                  ? 'bg-[#93C5FD] text-white cursor-wait'
                  : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-lg shadow-blue-100'
            }`}
          >
            <RefreshCw size={18} className={restoring ? 'animate-spin' : ''} />
            {restoring ? 'Restoring System Data...' : 'Start Restoration'}
          </button>
        </div>
      </div>
    </div>
  );
}
