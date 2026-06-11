import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';
import CreateUrlForm from '../components/CreateUrlForm';
import UrlTable from '../components/UrlTable';
import { RefreshCw, Link2, MousePointerClick, ShieldAlert, Layers } from 'lucide-react';

export default function Dashboard() {
  const [urls, setUrls] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Table control states
  const [currentPage, setCurrentPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortConfig, setSortConfig] = useState('newest');

  // Fetch data layer encapsulated in a memoized callback to prevent excessive loop triggers
  const fetchUrlRegistry = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.urls.getAll({
        page: currentPage,
        limit: 10,
        search: searchKeyword,
        sort: sortConfig
      });
      
      if (response.data.success) {
        setUrls(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to sync with link schema metrics.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchKeyword, sortConfig]);

  // Synchronize data states across dependencies updates
  useEffect(() => {
    fetchUrlRegistry();
  }, [fetchUrlRegistry]);

  // Handle addition of a single new link asset gracefully
  const handleUrlCreated = () => {
    // Force rewind to page 1 if searching/sorting might otherwise mask the newly made item
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchUrlRegistry();
    }
  };

  const handlePageChange = (targetPage) => {
    setCurrentPage(targetPage);
  };

  const handleSearchChange = (keyword) => {
    setSearchKeyword(keyword);
    setCurrentPage(1); // Drop index alignment pointer down to structural baseline
  };

  const handleSortChange = (sortOption) => {
    setSortConfig(sortOption);
    setCurrentPage(1);
  };

  // Derive mini summary aggregates on current visible viewport layout
  const aggregateTotalClicks = urls.reduce((sum, item) => sum + item.clicks, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all">
      {/* Top Banner Context Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
            Link Space Manager
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Deploy short paths, review dynamic QR links, and verify traffic routing arrays.
          </p>
        </div>
        
        <button
          onClick={fetchUrlRegistry}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 rounded-xl text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Workspace</span>
        </button>
      </div>

      {/* Mini Performance High-Level Row Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-4 rounded-xl flex items-center gap-3.5 shadow-sm transition-colors">
          <div className="p-2.5 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
            <Link2 className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">Total Active Links</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">{pagination?.totalResults || 0}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-4 rounded-xl flex items-center gap-3.5 shadow-sm transition-colors">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <MousePointerClick className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">Page Context Hits</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">{aggregateTotalClicks.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-4 rounded-xl flex items-center gap-3.5 shadow-sm transition-colors">
          <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">Index Boundaries</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              {pagination?.totalPages || 0} Page{pagination?.totalPages > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Creation Node Control Interface Entry Component */}
      <CreateUrlForm onUrlCreated={handleUrlCreated} />

      {/* Primary Error Response Channel */}
      {error && (
        <div className="flex items-start gap-2.5 p-3.5 mb-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 rounded-xl text-sm animate-fade-in">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Interactive Operational Structural Layout Table List Data Grid Node Component */}
      <UrlTable
        urls={urls}
        pagination={pagination}
        onPageChange={handlePageChange}
        onSearchChange={handleSearchChange}
        onSortChange={handleSortChange}
        onRefresh={fetchUrlRegistry}
      />
    </div>
  );
}