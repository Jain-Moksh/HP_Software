import { useState, useEffect } from 'react';
import { ClipboardList, ChevronRight, Trash2 } from 'lucide-react';
import DeleteMasterModal from '../components/DeleteMasterModal';

export default function JobReport({ onViewReport, setHeaderActions }) {
  const [jobbers, setJobbers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Clear header actions for this page (no toolbar needed)
  useEffect(() => {
    setHeaderActions?.(null);
  }, [setHeaderActions]);

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, jobberId: null, jobberName: '' });

  const fetchJobbers = async () => {
    try {
      const resp = await fetch('http://localhost:5000/api/jobbers');
      const json = await resp.json();
      setJobbers(json);
    } catch (err) {
      console.error('Failed to fetch jobbers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobbers();
  }, []);

  const handleDeleteJobber = async (password) => {
    try {
      const resp = await fetch(`http://localhost:5000/api/jobbers/${deleteModal.jobberId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      const data = await resp.json();
      if (resp.ok) {
        setDeleteModal({ isOpen: false, jobberId: null, jobberName: '' });
        fetchJobbers(); // Refresh list
      } else {
        alert(data.error || 'Failed to delete jobber');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('An error occurred while deleting');
    }
  };
  return (
    <div className="p-6 flex flex-col h-full bg-[#F8FAFC]">
      {/* Redundant Page header removed - now in global Header */}

      {loading ? (
        <div className="flex items-center justify-center p-12 text-sm text-[#64748B]">Loading jobbers...</div>
      ) : jobbers.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-[#E2E8F0]">
          <p className="text-sm text-[#64748B]">No jobbers found in the database.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {jobbers.map((jobber) => (
            <div key={jobber.id} className="relative group">
              <button
                onClick={() => onViewReport(jobber)}
                className="w-full bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm hover:shadow-md hover:border-[#2563EB] transition-all duration-200 text-left relative overflow-hidden"
              >
                {/* Hover accent */}
                <div className="absolute top-0 left-0 w-1 h-full bg-[#2563EB] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-200" />
                
                <div className="flex flex-col h-full justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors pr-8">
                      {jobber.name}
                    </h3>
                    <p className="text-xs text-[#64748B] mt-1 uppercase tracking-wider font-semibold">
                      Jobber Unit
                    </p>
                  </div>

                  <div className="mt-8 flex items-center justify-between">
                    <span className="text-xs font-medium text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-full">
                       View Report
                    </span>
                    <ChevronRight size={16} className="text-[#94A3B8] group-hover:text-[#2563EB] group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </button>

              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteModal({ isOpen: true, jobberId: jobber.id, jobberName: jobber.name });
                }}
                className="absolute top-4 right-4 p-2 text-[#94A3B8] hover:text-[#EF4444] hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 z-10"
                title="Delete Jobber"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <DeleteMasterModal 
        isOpen={deleteModal.isOpen}
        title={`Delete ${deleteModal.jobberName}?`}
        message={`This will permanently delete this jobber and all their material-in, material-out transactions and adjustments.`}
        onClose={() => setDeleteModal({ isOpen: false, jobberId: null, jobberName: '' })}
        onConfirm={handleDeleteJobber}
      />
    </div>
  );
}
