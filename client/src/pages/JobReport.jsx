import { ClipboardList, ChevronRight } from 'lucide-react';

const JOBBERS = [
  { id: 1, name: "Rakesh Job" },
  { id: 2, name: "Kishore Mfg" },
  { id: 3, name: "Suresh Works" },
  { id: 4, name: "Manish Tools" },
  { id: 5, name: "Aryan Fab" },
  { id: 6, name: "Ideal Engineering" },
];

export default function JobReport({ onViewReport }) {
  return (
    <div className="p-6 flex flex-col h-full bg-[#F8FAFC]">
      {/* Page header */}
      <div className="flex items-start justify-between mb-8 flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A]">Job Reports</h2>
          <p className="text-sm text-[#64748B] mt-1">Select a jobber to view their detailed material transaction report</p>
        </div>
        <div className="p-2.5 bg-white border border-[#E2E8F0] rounded-lg shadow-sm text-[#2563EB]">
          <ClipboardList size={20} />
        </div>
      </div>

      {/* Grid of Jobbers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {JOBBERS.map((jobber) => (
          <button
            key={jobber.id}
            onClick={() => onViewReport(jobber)}
            className="group bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm hover:shadow-md hover:border-[#2563EB] transition-all duration-200 text-left relative overflow-hidden"
          >
            {/* Hover accent */}
            <div className="absolute top-0 left-0 w-1 h-full bg-[#2563EB] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-200" />
            
            <div className="flex flex-col h-full justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
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
        ))}
      </div>
    </div>
  );
}
