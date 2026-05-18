import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Package, PackageOpen, ClipboardList, Menu, ChevronRight, RefreshCw, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'materials', label: 'Material-In', icon: Package, path: '/material-in' },
  { id: 'material-transfer', label: 'Material Transfer', icon: RefreshCw, path: '/material-transfer' },
  { id: 'material-out', label: 'Material-Out', icon: PackageOpen, path: '/material-out' },
  { id: 'job-report', label: 'Job Report', icon: ClipboardList, path: '/job-report' },
  { id: 'seller-report', label: 'Seller Report', icon: ClipboardList, path: '/seller-report' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`h-screen flex flex-col bg-[#1E293B] text-white transition-all duration-300 ease-in-out flex-shrink-0 ${
        collapsed ? 'w-[70px]' : 'w-[240px]'
      }`}
    >
      {/* Top logo + toggle */}
      <div className="flex items-center h-16 px-3 border-b border-white/10 flex-shrink-0">
        {/* Logo box */}
        <div className="flex items-center justify-center w-10 h-10 rounded-md bg-[#2563EB] font-bold text-white text-sm flex-shrink-0 select-none">
          HP
        </div>

        {/* Brand name */}
        {!collapsed && (
          <span className="ml-3 font-semibold text-sm leading-tight whitespace-nowrap overflow-hidden">
            Hemant Plast
          </span>
        )}

        {/* Hamburger toggle pushed to end */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`ml-auto p-1.5 rounded hover:bg-[#334155] transition-colors ${collapsed ? '' : ''}`}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {NAV_ITEMS.map(({ id, label, icon: Icon, path }) => {
          return (
            <NavLink
              key={id}
              to={path}
              title={collapsed ? label : undefined}
              className={({ isActive }) => 
                `w-full flex items-center gap-3 px-2.5 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#2563EB] text-white'
                    : 'text-slate-300 hover:bg-[#334155] hover:text-white'
                }`
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Utility Link */}
      <div className="px-2 py-2 border-t border-white/10 flex-shrink-0">
        <NavLink
          to="/utility"
          title={collapsed ? "Utility" : undefined}
          className={({ isActive }) => 
            `w-full flex items-center gap-3 px-2.5 py-2.5 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'bg-[#2563EB] text-white'
                : 'text-slate-300 hover:bg-[#334155] hover:text-white'
            }`
          }
        >
          <Settings size={18} className="flex-shrink-0" />
          {!collapsed && <span className="truncate">Utility</span>}
        </NavLink>
      </div>

      {/* Footer hint */}
      {!collapsed && (
        <div className="px-4 py-2 text-[10px] text-slate-500 select-none uppercase tracking-wider font-semibold">
          Accounting System
        </div>
      )}
    </aside>
  );
}
