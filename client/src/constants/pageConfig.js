export const PAGE_CONFIG = {
  '/material-in': {
    title: 'Material In Records',
    subtitle: 'Manage and track all material entries'
  },
  '/material-transfer': {
    title: 'Material Transfer Records',
    subtitle: 'Track internal stock movements between jobbers'
  },
  '/material-out': {
    title: 'Material Out Records',
    subtitle: 'Track and manage material shipments'
  },
  '/job-report': {
    title: 'Jobber Reports',
    subtitle: 'Overview of all jobbers and stocks'
  },
  '/seller-report': {
    title: 'Seller Reports',
    subtitle: 'Overview of all sellers and balances'
  },
  '/utility': {
    title: 'UTILITY DASHBOARD',
    subtitle: 'SYSTEM TOOLS, CONFIGURATIONS AND MAINTENANCE'
  },
  '/utility/backup': {
    title: 'BACKUP MANAGEMENT',
    subtitle: 'MANUAL AND AUTOMATIC DATABASE PROTECTION'
  },
  '/utility/restore': {
    title: 'SYSTEM RESTORE',
    subtitle: 'RECOVER DATABASE FROM BACKUP FILES'
  },
};

export const getPageInfo = (pathname) => {
  // Handle exact matches
  if (PAGE_CONFIG[pathname]) {
    return PAGE_CONFIG[pathname];
  }

  // Handle detail pages (regex matching)
  if (pathname.startsWith('/job-report/')) {
    return { title: 'Job Report Detail', subtitle: 'Detailed transaction and stock history' };
  }
  if (pathname.startsWith('/seller-report/')) {
    return { title: 'Seller Report Detail', subtitle: 'Detailed seller transaction history' };
  }

  // Default
  return {
    title: 'Accounting in Hemant Plast',
    subtitle: 'Financial Management System'
  };
};
