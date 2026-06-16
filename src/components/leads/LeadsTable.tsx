'use client';

// ============================================================
// LeadsTable — Sortable, searchable table of captured leads
// ============================================================

import { useState } from 'react';

interface Lead {
  id: string;
  pageName: string;
  senderPsid: string;
  name: string;
  phone: string;
  email: string;
  eventDate: string;
  budget: string;
  guestCount: string;
  eventType: string;
  captured: boolean;
  lastActive: string;
  lastMessage: string;
}

interface Props {
  leads: Lead[];
}

export function LeadsTable({ leads }: Props) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'hot' | 'cold'>('all');
  const [sort, setSort] = useState<'name' | 'lastActive' | 'budget'>('lastActive');

  let filtered = leads;

  // Filter
  if (filter === 'hot') {
    filtered = filtered.filter((l) => l.captured);
  } else if (filter === 'cold') {
    filtered = filtered.filter((l) => !l.captured);
  }

  // Search
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.pageName.toLowerCase().includes(q)
    );
  }

  // Sort
  filtered = [...filtered].sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name);
    if (sort === 'lastActive')
      return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
    if (sort === 'budget') return (b.budget || '').localeCompare(a.budget || '');
    return 0;
  });

  if (leads.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-3">📋</p>
        <p className="text-gray-500 text-sm">No leads captured yet.</p>
        <p className="text-xs text-gray-400 mt-1">
          Leads appear here when customers share their contact info during conversations.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, or page..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50"
          />
          <svg
            className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <div className="flex gap-2">
          {(['all', 'hot', 'cold'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                filter === f
                  ? 'bg-gradient-to-r from-[#ff6b6b] to-[#ffa94d] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'All' : f === 'hot' ? '🔥 Hot' : '❄️ Cold'}
            </button>
          ))}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="px-3 py-2 rounded-lg border border-orange-200 text-xs text-gray-600 bg-white"
          >
            <option value="lastActive">Recent</option>
            <option value="name">Name</option>
            <option value="budget">Budget</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-orange-100 text-left">
              <th className="py-2 px-3 text-gray-500 font-medium text-xs">Status</th>
              <th className="py-2 px-3 text-gray-500 font-medium text-xs">Name</th>
              <th className="py-2 px-3 text-gray-500 font-medium text-xs">Phone</th>
              <th className="py-2 px-3 text-gray-500 font-medium text-xs hidden md:table-cell">Event</th>
              <th className="py-2 px-3 text-gray-500 font-medium text-xs hidden md:table-cell">Budget</th>
              <th className="py-2 px-3 text-gray-500 font-medium text-xs hidden lg:table-cell">Page</th>
              <th className="py-2 px-3 text-gray-500 font-medium text-xs hidden lg:table-cell">Last Active</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((lead) => (
              <tr
                key={lead.id}
                className="border-b border-orange-50 hover:bg-orange-50/30 transition-colors"
              >
                <td className="py-3 px-3">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      lead.captured ? 'bg-green-400' : 'bg-gray-300'
                    }`}
                    title={lead.captured ? 'Hot lead' : 'Basic info only'}
                  />
                </td>
                <td className="py-3 px-3">
                  <p className="font-medium text-gray-800">{lead.name}</p>
                  {lead.guestCount !== '—' && (
                    <p className="text-xs text-gray-400">{lead.guestCount} guests</p>
                  )}
                </td>
                <td className="py-3 px-3">
                  {lead.phone !== '—' ? (
                    <a
                      href={`tel:${lead.phone}`}
                      className="text-[#ff6b6b] hover:underline"
                    >
                      {lead.phone}
                    </a>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                  {lead.email !== '—' && (
                    <p className="text-xs text-gray-400">{lead.email}</p>
                  )}
                </td>
                <td className="py-3 px-3 hidden md:table-cell">
                  <span className="text-gray-600">
                    {lead.eventDate !== '—' ? lead.eventDate : '—'}
                  </span>
                  {lead.eventType !== '—' && (
                    <p className="text-xs text-gray-400 capitalize">{lead.eventType}</p>
                  )}
                </td>
                <td className="py-3 px-3 hidden md:table-cell">
                  {lead.budget !== '—' ? (
                    <span className="font-medium text-green-600">{lead.budget}</span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="py-3 px-3 hidden lg:table-cell text-gray-500 text-xs">
                  {lead.pageName}
                </td>
                <td className="py-3 px-3 hidden lg:table-cell text-gray-400 text-xs">
                  {new Date(lead.lastActive).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-sm text-gray-400 py-8">
          No leads match your search.
        </p>
      )}

      <p className="text-xs text-gray-400 mt-4">
        Showing {filtered.length} of {leads.length} leads
      </p>
    </div>
  );
}
