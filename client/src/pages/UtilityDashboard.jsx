import { useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Database, RefreshCw } from 'lucide-react';

export default function UtilityDashboard() {
  const navigate = useNavigate();
  const { setHeaderActions } = useOutletContext();

  // Clear header actions for this page (no dynamic toolbars)
  useEffect(() => {
    setHeaderActions?.(null);
  }, [setHeaderActions]);

  const cards = [
    {
      title: 'Database Backup',
      desc: 'Create manual snapshots or configure automatic background backups for data protection.',
      icon: Database,
      iconColor: 'text-[#2563EB]',
      bgColor: 'bg-[#EFF6FF]',
      action: () => navigate('/utility/backup'),
      status: 'active'
    },
    {
      title: 'System Restore',
      desc: 'Recover your entire system state from a previously saved .sql or .backup file.',
      icon: RefreshCw,
      iconColor: 'text-[#EF4444]',
      bgColor: 'bg-[#FEF2F2]',
      action: () => navigate('/utility/restore'),
      status: 'active'
    }
  ];

  return (
    <div className="p-6 flex flex-col h-full bg-[#F8FAFC] overflow-y-auto">
      <div className="max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          const isActive = card.status === 'active';
          
          return (
            <div
              key={idx}
              onClick={isActive ? card.action : undefined}
              className={`bg-white p-8 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between min-h-[260px] relative overflow-hidden transition-all duration-300 ${
                isActive 
                  ? 'cursor-pointer hover:shadow-md hover:border-[#2563EB] group hover:-translate-y-1' 
                  : 'opacity-70 select-none'
              }`}
            >
              {/* Top Accent line on Hover */}
              {isActive && (
                <div className="absolute top-0 left-0 w-full h-1 bg-[#2563EB] transform -translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              )}

              <div className="flex flex-col gap-5">
                {/* Colored Icon Circle */}
                <div className={`w-14 h-14 rounded-2xl ${card.bgColor} ${card.iconColor} flex items-center justify-center shadow-sm`}>
                  <Icon size={24} />
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-[#0F172A] flex items-center gap-2">
                    {card.title}
                    {card.status === 'soon' && (
                      <span className="text-[9px] font-bold bg-[#F1F5F9] text-[#64748B] px-2 py-0.5 rounded border border-[#E2E8F0] uppercase tracking-wider">
                        Coming Soon
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-[#64748B] mt-2 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              </div>

              {isActive && (
                <div className="mt-8 flex items-center">
                  <span className="text-xs font-bold text-[#2563EB] group-hover:underline flex items-center gap-1">
                    Manage Tool &rarr;
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
