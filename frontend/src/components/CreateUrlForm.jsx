import React, { useState } from 'react';
import apiService from '../services/api';
import { Link2, Sparkles, Calendar, Key, Copy, Check, QrCode, ArrowRight, AlertCircle } from 'lucide-react';

export default function CreateUrlForm({ onUrlCreated }) {
  const [formData, setFormData] = useState({
    originalUrl: '',
    customCode: '',
    expiresAt: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(''); // Reset error message on typing
  };

  const validateForm = () => {
    if (!formData.originalUrl.trim()) {
      setError('Destination URL is required.');
      return false;
    }
    
    // Quick regex validator for protocol attachment enforcement
    if (!/^https?:\/\//i.test(formData.originalUrl)) {
      setError('URL must start with http:// or https://');
      return false;
    }

    if (formData.expiresAt) {
      const selectedDate = new Date(formData.expiresAt);
      if (selectedDate <= new Date()) {
        setError('Expiration date must be scheduled in the future.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccessData(null);
    setCopied(false);

    try {
      // Clean request payload construction
      const payload = {
        originalUrl: formData.originalUrl.trim(),
        ...(formData.customCode.trim() && { customCode: formData.customCode.trim() }),
        ...(formData.expiresAt && { expiresAt: new Date(formData.expiresAt).toISOString() })
      };

      const response = await apiService.urls.create(payload);
      
      if (response.data.success) {
        const newLink = response.data.data;
        setSuccessData(newLink);
        
        // Reset form inputs except the destination URL for user continuity reference
        setFormData({ originalUrl: '', customCode: '', expiresAt: '' });
        
        // Notify parent dashboard component to silently refresh background records list
        if (onUrlCreated) onUrlCreated(newLink);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to shrink target URL. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    const absoluteUrl = `${import.meta.env.VITE_SHORT_URL_BASE || window.location.origin}/${text}`;
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-6 mb-8 transition-colors">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-white flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-500 fill-brand-500/10" />
          Shorten a Long Link
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Create instantly trackable, highly performant short links with advanced custom metrics rules.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Destination URL Field */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Destination URL *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Link2 className="h-5 w-5" />
            </div>
            <input
              type="text"
              name="originalUrl"
              placeholder="https://your-extremely-long-destination-link.com/path"
              value={formData.originalUrl}
              onChange={handleChange}
              disabled={loading}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-900 dark:text-white placeholder-slate-400 disabled:opacity-60 transition-all"
            />
          </div>
        </div>

        {/* Optional Settings Fields Panel Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Custom Code <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Key className="h-4 w-4" />
              </div>
              <input
                type="text"
                name="customCode"
                placeholder="promo2026"
                value={formData.customCode}
                onChange={handleChange}
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-900 dark:text-white placeholder-slate-400 disabled:opacity-60 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Expiration Link Target <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Calendar className="h-4 w-4" />
              </div>
              <input
                type="datetime-local"
                name="expiresAt"
                value={formData.expiresAt}
                onChange={handleChange}
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-900 dark:text-white placeholder-slate-400 disabled:opacity-60 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Action Controls & Error Banners */}
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 rounded-xl text-sm animate-fade-in">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm rounded-xl shadow-sm shadow-brand-500/10 hover:shadow-brand-500/20 transition-all disabled:opacity-60 group"
          >
            {loading ? 'Shrinking Link...' : 'Shorten Link'}
            <ArrowRight className="h-4 w-4 transform group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </form>

      {/* Dynamic Link Optimization Feedback Widget Panel */}
      {successData && (
        <div className="mt-6 border-t border-dashed border-slate-200 dark:border-slate-800 pt-6 animate-fade-in">
          <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-200/60 dark:border-emerald-900/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 min-w-0 flex-1">
              <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-600 dark:text-emerald-400 block">
                Link Shortened Successfully
              </span>
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {`${import.meta.env.VITE_SHORT_URL_BASE || window.location.origin}/${successData.shortCode}`}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                Points to: {successData.originalUrl}
              </p>
            </div>
            
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
              <button
                onClick={() => setShowQr(!showQr)}
                className={`p-2.5 rounded-xl border text-sm font-medium transition-colors ${
                  showQr 
                    ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white' 
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
                title="View QR Code Asset"
              >
                <QrCode className="h-4 w-4" />
              </button>
              <button
                onClick={() => copyToClipboard(successData.shortCode)}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors w-full sm:w-auto"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span className="text-emerald-500">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {showQr && successData.qrCode && (
            <div className="mt-4 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950/30 border border-slate-200/60 dark:border-slate-800/60 rounded-xl p-6 text-center animate-slide-down">
              <img 
                src={successData.qrCode} 
                alt="Short URL QR Code Data Link" 
                className="w-40 h-40 object-contain bg-white rounded-lg p-2 shadow-sm border border-slate-100" 
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 max-w-xs">
                Scan or download this QR code to route offline audiences straight to your target destination URL.
              </p>
              <a 
                href={successData.qrCode} 
                download={`qr-${successData.shortCode}.png`}
                className="text-xs text-brand-600 dark:text-brand-400 font-medium mt-2 hover:underline"
              >
                Download PNG
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}