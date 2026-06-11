import React from 'react';
import { MousePointerClick, Users, Calendar, ShieldCheck, ShieldAlert } from 'lucide-react';

export default function AnalyticsCards({ summary }) {
  const { totalClicks = 0, uniqueVisitors = 0, creationDate, expiresAt } = summary || {};

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isExpired = expiresAt && new Date(expiresAt) <= new Date();

  const statsConfig = [
    {
      title: 'Total Engagement',
      value: totalClicks.toLocaleString(),
      description: 'Gross lifetime link routing hits',
      icon: MousePointerClick,
      color: 'text-brand-600 bg-brand-50 dark:text-brand-400 dark:bg-brand-500/10',
    },
    {
      title: 'Unique Network Nodes',
      value: uniqueVisitors.toLocaleString(),
      description: 'Anonymized distinct visitor traces',
      icon: Users,
      color: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10',
    },
    {
      title: 'Deployment Date',
      value: formatDate(creationDate),
      description: 'Timestamp mapping creation node',
      icon: Calendar,
      color: 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-500/10',
    },
    {
      title: 'System Lifecycle Status',
      value: isExpired ? 'Expired' : expiresAt ? formatDate(expiresAt) : 'Infinite TTL',
      description: isExpired ? 'Link routing offline' : 'Active destination lease map',
      icon: isExpired ? ShieldAlert : ShieldCheck,
      color: isExpired
        ? 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10'
        : 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statsConfig.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-sm flex items-start gap-4 transition-colors"
          >
            <div className={`p-3 rounded-xl shrink-0 ${card.color}`}>
              <IconComponent className="h-5 w-5" />
            </div>
            <div className="space-y-1 min-w-0">
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500 block uppercase tracking-wider">
                {card.title}
              </span>
              <h3 className="text-xl font-bold text-slate-950 dark:text-white truncate">
                {card.value}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {card.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}