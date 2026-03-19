export default function Header() {
  return (
    <header className="h-16 flex items-center justify-center px-6 bg-white border-b border-[#E2E8F0] flex-shrink-0">
      {/* Center title block */}
      <div className="flex flex-col items-center justify-center text-center">
        <h1 className="text-base font-semibold text-[#0F172A] leading-tight">
          Accounting in Hemant Plast
        </h1>
        <p className="text-xs text-[#64748B] mt-0.5">Financial Management System</p>
      </div>
    </header>
  );
}
