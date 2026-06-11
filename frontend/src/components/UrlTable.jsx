import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import { 
  ExternalLink, BarChart3, Copy, Check, Trash2, Edit2, 
  Search, ArrowUpDown, ChevronLeft, ChevronRight, X, Calendar 
} from 'lucide-react';

export default function UrlTable({ 
  urls, 
  pagination, 
  onPageChange, 
  onSearchChange, 
  onSortChange, 
  onRefresh 
}) {
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Inline edit state tracking matrices
  const [editingId, setEditingId] = useState(null);
  const [editUrlValue, setEditUrlValue] = useState('');
  const [editError, setEditError] = useState('');
  const [updating, setUpdating] = useState(false);

  const handleCopy = async (id, shortCode) => {
    const absoluteUrl = `${import.meta.env.VITE_SHORT_URL_BASE || window.location.origin}/${shortCode}`;
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const startEditing = (urlItem) => {
    setEditingId(urlItem._id);
    setEditUrlValue(urlItem.originalUrl);
    setEditError('');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditUrlValue('');
    setEditError('');
  };

  const saveEdit = async (id) => {
    if (!editUrlValue.trim() || !/^https?:\/\//i.test(editUrlValue)) {
      setEditError('Provide a valid URL starting with http:// or https://');
      return;
    }

    setUpdating(true);
    setEditError('');
    try {
      const response = await apiService.urls.update(id, { originalUrl: editUrlValue.trim() });
      if (response.data.success) {
        setEditingId(null);
        onRefresh();
      }
    } catch (err) {
      setEditError(err.response?.data?.error || 'Failed to modify target url.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you certain you want to purge this link map and all associated performance analytics data?')) {
      return;
    }
    try {
      const response = await apiService.urls.delete(id);
      if (response.data.success) {
        onRefresh();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to process deletion request.');
    }
  };

  const triggerSearchSubmit = (e) => {
    e.preventDefault();
    onSearchChange(searchTerm);
  };

  return (
    <div className="w-full space-y-4">
      {/* Search Filter and Structural Options Control Matrix Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-colors">
        <form onSubmit={triggerSearchSubmit} className="relative w-full sm:max-w-xs flex items-center">
          <input
            type="text"
            placeholder="Search destination URLs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-900 dark:text-white transition-all"
          />
          <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
          {searchTerm && (
            <button
              type="button"
              onClick={() => { setSearchTerm(''); onSearchChange(''); }}
              className="absolute right-2.5 p-1 rounded-md text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 shrink-0">
            <ArrowUpDown className="h-3.5 w-3.5" /> Sort by
          </span>
          <select
            onChange={(e) => onSortChange(e.target.value)}
            className="text-sm bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
          >
            <option value="newest">Newest First</option>
            <option value="clicks">Highest Clicks</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Main Structural Responsive Data Grid Node */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 transition-colors">
                <th className="py-3 px-4">Short Link</th>
                <th className="py-3 px-4">Original Destination</th>
                <th className="py-3 px-4 text-center">Clicks</th>
                <th className="py-3 px-4">Status / TTL</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm text-slate-700 dark:text-slate-300 transition-colors">
              {urls.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400 dark:text-slate-500">
                    No matching tracked short code map nodes found in this layout viewport context.
                  </td>
                </tr>
              ) : (
                urls.map((item) => {
                  const isExpired = item.expiresAt && new Date(item.expiresAt) <= new Date();
                  return (
                    <tr key={item._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-950/20 group/row transition-colors">
                      {/* Short Link Cell */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>/{item.shortCode}</span>
                          <button
                            onClick={() => handleCopy(item._id, item.shortCode)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md bg-slate-50 dark:bg-slate-950/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all opacity-0 group-hover/row:opacity-100 focus:opacity-100"
                            title="Copy short link"
                          >
                            {copiedId === item._id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Original Target Routing Destination Cell */}
                      <td className="py-3.5 px-4 max-w-xs md:max-w-md min-w-[200px]">
                        {editingId === item._id ? (
                          <div className="space-y-1.5">
                            <input
                              type="text"
                              value={editUrlValue}
                              onChange={(e) => setEditUrlValue(e.target.value)}
                              disabled={updating}
                              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 text-slate-900 dark:text-white"
                            />
                            {editError && <p className="text-[11px] text-rose-500 font-medium">{editError}</p>}
                            <div className="flex gap-2 justify-start">
                              <button
                                onClick={() => saveEdit(item._id)}
                                disabled={updating}
                                className="px-2.5 py-1 text-[11px] bg-brand-600 hover:bg-brand-700 text-white font-medium rounded"
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEditing}
                                disabled={updating}
                                className="px-2.5 py-1 text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 group/link">
                            <p className="truncate text-slate-500 dark:text-slate-400" title={item.originalUrl}>
                              {item.originalUrl}
                            </p>
                            <a
                              href={item.originalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-400 hover:text-brand-500 shrink-0 opacity-0 group-hover/link:opacity-100 focus:opacity-100 transition-opacity"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        )}
                      </td>

                      {/* Hits Count Total Metric Output Cell */}
                      <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-950 dark:text-slate-100">
                        {item.clicks.toLocaleString()}
                      </td>

                      {/* Link Lifetime Index Status Cell */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isExpired ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400">
                            Expired
                          </span>
                        ) : item.expiresAt ? (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400" title={`Expires: ${new Date(item.expiresAt).toLocaleString()}`}>
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {new Date(item.expiresAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
                            Infinite
                          </span>
                        )}
                      </td>

                      {/* Management Action Modals Entry Interceptors */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigate(`/analytics/${item._id}`)}
                            className="p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 dark:text-slate-400 dark:hover:text-brand-400 dark:hover:bg-brand-500/10 rounded-lg transition-colors"
                            title="Analyze Performance Metrics"
                          >
                            <BarChart3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => startEditing(item)}
                            disabled={editingId === item._id}
                            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-30"
                            title="Edit Target Address"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/20 rounded-lg transition-colors"
                            title="Delete Short Code Map Node"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Server Side Pagination Nav Control Node Footer Bar */}
        {pagination && pagination.totalPages > 1 && (
          <div className="bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800/80 px-4 py-3 flex items-center justify-between transition-colors">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Showing page <strong className="text-slate-900 dark:text-white">{pagination.page}</strong> of{' '}
              <strong className="text-slate-900 dark:text-white">{pagination.totalPages}</strong> ({pagination.totalResults} total map items)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}