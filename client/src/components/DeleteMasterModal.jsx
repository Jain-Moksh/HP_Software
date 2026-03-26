import { useState } from 'react';

const DeleteMasterModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  const [password, setPassword] = useState('');
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] w-full max-w-sm p-6 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#0F172A] leading-tight">
              {title || 'Confirm Deletion'}
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5 font-medium">This action cannot be undone.</p>
          </div>
        </div>

        <p className="text-sm text-[#475569] mb-6 leading-relaxed">
          {message || 'Entering the master delete password will permanently remove this record and all associated transactions.'}
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5 ml-1">
              Security Password
            </label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password to confirm"
              autoFocus
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onConfirm(password);
                  setPassword('');
                }
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => {
                onClose();
                setPassword('');
              }}
              className="px-4 py-3 text-sm font-bold text-[#64748B] bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-xl transition-all active:scale-95"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                onConfirm(password);
                setPassword('');
              }}
              className="px-4 py-3 text-sm font-bold text-white bg-[#EF4444] hover:bg-[#DC2626] rounded-xl shadow-lg shadow-red-200 transition-all active:scale-95"
            >
              Delete All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteMasterModal;
