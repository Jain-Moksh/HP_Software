import { useState, useEffect } from 'react';

const EditMasterModal = ({ isOpen, onClose, onConfirm, title, initialName }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(initialName || '');
    }
  }, [isOpen, initialName]);
  
  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim()) {
      alert('Name cannot be empty');
      return;
    }
    onConfirm(name.trim());
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] w-full max-w-sm p-6 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/><path d="m15 5 3 3"/></svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#0F172A] leading-tight">
              {title || 'Edit Name'}
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5 font-medium">Update the name in the system.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5 ml-1">
              New Name
            </label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter new name"
              autoFocus
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave();
                }
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-3 text-sm font-bold text-[#64748B] bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-xl transition-all active:scale-95"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="px-4 py-3 text-sm font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditMasterModal;
