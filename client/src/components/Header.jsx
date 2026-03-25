export default function Header({ 
  title = "Accounting in Hemant Plast", 
  subtitle = "Financial Management System",
  actions = null 
}) {
  return (
    <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-[#E2E8F0] flex-shrink-0">
      {/* Left-aligned title block */}
      <div className="flex flex-col items-start justify-center">
        <h1 className="text-base font-semibold text-[#0F172A] mr-4">
          {title}
        </h1>
        <p className="text-[10px] text-[#64748B] tracking-wide uppercase font-medium mt-0.5">
          {subtitle}
        </p>
      </div>

      {/* Right-aligned actions block */}
      <div className="flex items-center gap-2">
        {actions}
      </div>
    </header>
  );
}
