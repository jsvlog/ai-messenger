'use client';

// ============================================================
// LeadsExportButton — Client-side CSV export (isolated from server)
// ============================================================

interface Lead {
  name: string;
  phone: string;
  email: string;
  eventDate: string;
  budget: string;
  guestCount: string;
  eventType: string;
  pageName: string;
  lastMessage: string;
  captured: boolean;
}

export function LeadsExportButton({ leads }: { leads: Lead[] }) {
  const handleExportCSV = () => {
    const headers = ['Name', 'Phone', 'Email', 'Event Date', 'Budget', 'Guests', 'Event Type', 'Page', 'Status'];
    const rows = leads.map((l) =>
      [
        `"${l.name.replace(/"/g, '""')}"`,
        l.phone,
        l.email,
        l.eventDate,
        l.budget,
        l.guestCount,
        `"${l.eventType.replace(/"/g, '""')}"`,
        `"${l.pageName.replace(/"/g, '""')}"`,
        l.captured ? 'Hot' : 'Cold',
      ].join(',')
    );
    const csv = ['\ufeff' + headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (leads.length === 0) return null;

  return (
    <button
      onClick={handleExportCSV}
      className="text-xs px-4 py-2 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 hover:shadow-md transition-all font-medium"
    >
      📥 Export CSV ({leads.length})
    </button>
  );
}
