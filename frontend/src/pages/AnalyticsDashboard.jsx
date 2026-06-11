import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiService from '../services/api';
import AnalyticsCards from '../components/AnalyticsCards';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, BarChart, Bar, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { ArrowLeft, BarChart3, Globe, Monitor, Compass, Share2, ShieldAlert } from 'lucide-react';

const COLORS = ['#2563eb', '#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];

export default function AnalyticsDashboard() {
  const { urlId } = useParams();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await apiService.analytics.get(urlId);
        if (response.data.success) {
          setAnalyticsData(response.data);
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to capture analytics mapping data.');
      } finally {
        setLoading(false);
      }
    };

    if (urlId) fetchMetrics();
  }, [urlId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-500 dark:text-slate-400">
        <div className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-brand-600 rounded-full mb-4"></div>
        <p className="text-sm font-medium">Assembling data visualizer layouts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-2xl inline-block mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Metrics Retrieval Failure</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">{error}</p>
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white text-sm font-medium rounded-xl">
          <ArrowLeft className="h-4 w-4" /> Back to Workspace
        </Link>
      </div>
    );
  }

  const { summary, breakdowns } = analyticsData || {};

  // Custom visualizer mapping layer for Recharts alignment metrics requirements
  const mapToChartData = (dataArray) => {
    if (!dataArray || dataArray.length === 0) return [{ name: 'No Tracking Data', count: 0 }];
    return dataArray.map(item => ({
      name: item._id || 'Unknown/Direct',
      count: item.count
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors">
      {/* Structural Header Section */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link to="/dashboard" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline mb-1">
            <ArrowLeft className="h-3 w-3" /> Back to Link Management Workspace
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-brand-600" />
            Performance Tracking Stream
          </h1>
        </div>
      </div>

      {/* Global Highlights Statistical Metric Cards */}
      <AnalyticsCards summary={summary} />

      {/* Primary Timeline Hit Stream Metric Grid Panel Block */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 mb-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Chronological Engagement Activity</h3>
          <p className="text-xs text-slate-400">Aggregated tracking frequencies computed daily over the last 30 operational cycles.</p>
        </div>
        <div className="h-72 w-full text-xs">
          {breakdowns?.history?.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400">No time-series routing events logged yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={breakdowns.history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="_id" tickLine={false} axisLine={false} stroke="#94a3b8" />
                <YAxis tickLine={false} axisLine={false} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderRadius: '12px', border: 'none', color: '#fff' }}
                  labelClassName="font-bold text-slate-400 mb-1"
                />
                <Area type="monotone" dataKey="clicks" name="Routing Clicks" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorClicks)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Categorized Granular Secondary Tracking Breakdown Grid Clusters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Geolocation Metric Distribution Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4 text-indigo-500" /> Geographic Origin Mapping
          </h3>
          <div className="h-64 text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mapToChartData(breakdowns?.countries)} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis type="number" tickLine={false} axisLine={false} stroke="#94a3b8" />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} stroke="#94a3b8" width={60} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderRadius: '8px', border: 'none', color: '#fff' }} />
                <Bar dataKey="count" name="Clicks" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Referrer Matrix Traffic Source Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Share2 className="h-4 w-4 text-emerald-500" /> Inbound Origin Channels
          </h3>
          <div className="h-64 text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mapToChartData(breakdowns?.referrers)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#94a3b8" />
                <YAxis tickLine={false} axisLine={false} stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderRadius: '8px', border: 'none', color: '#fff' }} />
                <Bar dataKey="count" name="Clicks" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hardware Platform Segment Allocation Wheel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Monitor className="h-4 w-4 text-brand-500" /> Hardware Platform Mix
          </h3>
          <div className="h-60 flex flex-col sm:flex-row items-center justify-around gap-4 text-xs">
            <div className="w-full h-48 sm:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mapToChartData(breakdowns?.devices)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {mapToChartData(breakdowns?.devices).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderRadius: '8px', border: 'none', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full sm:w-1/2 space-y-2 max-h-44 overflow-y-auto">
              {mapToChartData(breakdowns?.devices).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-1.5 border-b border-slate-50 dark:border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{item.name}</span>
                  </div>
                  <span className="font-mono text-slate-500">{item.count} hits</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Client Engine Software Application Mapping */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Compass className="h-4 w-4 text-amber-500" /> Client Browser Vectors
          </h3>
          <div className="h-60 flex flex-col sm:flex-row items-center justify-around gap-4 text-xs">
            <div className="w-full h-48 sm:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mapToChartData(breakdowns?.browsers)}
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius={75}
                    dataKey="count"
                  >
                    {mapToChartData(breakdowns?.browsers).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderRadius: '8px', border: 'none', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full sm:w-1/2 space-y-2 max-h-44 overflow-y-auto">
              {mapToChartData(breakdowns?.browsers).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-1.5 border-b border-slate-50 dark:border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[(idx + 2) % COLORS.length] }}></div>
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{item.name}</span>
                  </div>
                  <span className="font-mono text-slate-500">{item.count} hits</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}