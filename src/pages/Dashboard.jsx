import { Package, Users, DollarSign, ArrowRightLeft, TrendingUp } from 'lucide-react';

const STAT_CARDS = [
  { title: 'Total Materials', value: '248',   icon: Package,         color: 'text-blue-600',   bg: 'bg-blue-50'   },
  { title: 'Total Vendors',   value: '36',    icon: Users,           color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { title: 'Monthly Expenses',value: '₹1.84L', icon: DollarSign,     color: 'text-emerald-600',bg: 'bg-emerald-50'},
  { title: 'Total Transactions',value:'1,240', icon: ArrowRightLeft, color: 'text-violet-600', bg: 'bg-violet-50' },
];

const RECENT_ROWS = [
  { id:1, material:'HDPE Granules',  type:'Raw',      amount:'₹8,500',  date:'2024-01-05', status:'Completed' },
  { id:2, material:'NBR Rubber',     type:'Raw',      amount:'₹12,000', date:'2024-01-08', status:'Pending'   },
  { id:3, material:'PVC Pipes',      type:'Finished', amount:'₹6,500',  date:'2024-01-12', status:'Completed' },
  { id:4, material:'Aluminium Sheet',type:'Raw',      amount:'₹21,000', date:'2024-01-15', status:'Completed' },
  { id:5, material:'PP Granules',    type:'Semi',     amount:'₹7,200',  date:'2024-01-19', status:'Pending'   },
];

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {STAT_CARDS.map(({ title, value, icon: Icon, color, bg }) => (
          <div
            key={title}
            className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-sm flex items-start gap-4"
          >
            <div className={`${bg} ${color} w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-xs text-[#64748B] font-medium mb-1">{title}</p>
              <p className="text-2xl font-bold text-[#0F172A] leading-none">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Materials */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm overflow-hidden">
        {/* Section header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-[#2563EB]" />
            <h2 className="text-sm font-semibold text-[#0F172A]">Recent Materials</h2>
          </div>
          <span className="text-xs text-[#64748B]">Last 5 entries</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                {['#','Material','Type','Amount','Date','Status'].map(h => (
                  <th
                    key={h}
                    className="px-5 py-2.5 text-left text-xs font-semibold text-[#64748B] tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RECENT_ROWS.map((row, idx) => (
                <tr
                  key={row.id}
                  className="border-b border-[#E2E8F0] last:border-b-0 hover:bg-[#F8FAFC] transition-colors"
                >
                  <td className="px-5 py-2.5 text-xs text-[#64748B] font-mono">{row.id}</td>
                  <td className="px-5 py-2.5 font-medium text-[#0F172A]">{row.material}</td>
                  <td className="px-5 py-2.5 text-[#64748B]">{row.type}</td>
                  <td className="px-5 py-2.5 font-mono font-semibold text-[#0F172A]">{row.amount}</td>
                  <td className="px-5 py-2.5 font-mono text-xs text-[#64748B]">{row.date}</td>
                  <td className="px-5 py-2.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        row.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
