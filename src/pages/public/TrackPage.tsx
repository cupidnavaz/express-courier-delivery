import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search, Package, MapPin, Clock, CheckCircle2, AlertCircle,
  Truck, PackageCheck, Loader2, XCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Invoice, InvoiceStatusHistory, DeliveryStatus, STATUS_LABELS, STATUS_COLORS } from '@/types';
import { useSite } from '@/context/SiteContext';

const STATUS_ICONS: Record<DeliveryStatus, React.ComponentType<{ className?: string }>> = {
  processing: Loader2,
  dispatched: Truck,
  in_transit: Package,
  on_hold: AlertCircle,
  delivered: CheckCircle2,
};

export default function TrackPage() {
  const [searchParams] = useSearchParams();
  const { settings } = useSite();
  const [input, setInput] = useState(searchParams.get('code') || '');
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [history, setHistory] = useState<InvoiceStatusHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const tz = settings?.timezone || 'UTC';
  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('en-US', { timeZone: tz }); }
    catch { return new Date(d).toLocaleDateString(); }
  };
  const formatDateTime = (d: string) => {
    try { return new Date(d).toLocaleString('en-US', { timeZone: tz }); }
    catch { return new Date(d).toLocaleString(); }
  };

  const doSearch = async (code: string) => {
    setLoading(true);
    setError('');
    setInvoice(null);
    setHistory([]);
    setSearched(true);

    const { data, error: queryError } = await supabase
      .from('invoices')
      .select('*')
      .eq('tracking_code', code.trim().toUpperCase())
      .maybeSingle();

    if (queryError) {
      setError('Unable to search. Please try again.');
    } else if (data) {
      setInvoice(data as Invoice);
      const { data: histData } = await supabase
        .from('invoice_status_history')
        .select('*')
        .eq('invoice_id', (data as Invoice).id)
        .order('created_at', { ascending: true });
      if (histData) setHistory(histData as InvoiceStatusHistory[]);
    } else {
      setError('No package found with that tracking number. Please check and try again.');
    }
    setLoading(false);
  };

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setInput(code);
      doSearch(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) doSearch(input);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-sky-100 rounded-2xl mb-4">
            <MapPin className="w-8 h-8 text-sky-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Track Your Package</h1>
          <p className="text-slate-500">Enter your tracking number below to see real-time delivery status.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. ECS-20241001-ABCD12"
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-3 disabled:bg-slate-300 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Track
          </button>
        </form>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
            <p className="text-rose-700 font-medium">{error}</p>
          </div>
        )}

        {invoice && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                <div>
                  <div className="text-sm text-slate-500 mb-1">Tracking Number</div>
                  <div className="text-xl font-bold text-slate-900 font-mono">{invoice.tracking_code}</div>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${STATUS_COLORS[invoice.status]}`}>
                  {STATUS_LABELS[invoice.status]}
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="text-slate-500 mb-1">Sender</div>
                  <div className="font-semibold text-slate-900">{invoice.sender_name}</div>
                  <div className="text-slate-600">{invoice.sender_address}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="text-slate-500 mb-1">Receiver</div>
                  <div className="font-semibold text-slate-900">{invoice.receiver_name}</div>
                  <div className="text-slate-600">{invoice.receiver_address}</div>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 text-sm mt-4">
                <div>
                  <div className="text-slate-500">Package</div>
                  <div className="font-medium text-slate-800">{invoice.package_description}</div>
                </div>
                <div>
                  <div className="text-slate-500">Shipping Method</div>
                  <div className="font-medium text-slate-800">{invoice.shipping_method}</div>
                </div>
                <div>
                  <div className="text-slate-500">Estimated Delivery</div>
                  <div className="font-medium text-slate-800">
                    {invoice.estimated_delivery_date
                      ? formatDate(invoice.estimated_delivery_date)
                      : 'TBD'}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-6">Delivery Timeline</h2>
              {history.length > 0 ? (
                <div className="space-y-0">
                  {history.map((item, idx) => {
                    const Icon = STATUS_ICONS[item.status] || Clock;
                    const isLast = idx === history.length - 1;
                    return (
                      <div key={item.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`p-2 rounded-full ${STATUS_COLORS[item.status].replace('border', 'border-0')}`}>
                            <Icon className={`w-4 h-4 ${item.status === 'processing' ? 'animate-spin' : ''}`} />
                          </div>
                          {!isLast && <div className="w-0.5 flex-1 bg-slate-200 my-1" />}
                        </div>
                        <div className={`flex-1 ${isLast ? '' : 'pb-6'}`}>
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="font-semibold text-slate-900">{STATUS_LABELS[item.status]}</span>
                            <span className="text-xs text-slate-500">
                              {formatDateTime(item.created_at)}
                            </span>
                          </div>
                          {item.location && (
                            <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                              <MapPin className="w-3 h-3" /> {item.location}
                            </div>
                          )}
                          {item.notes && (
                            <p className="text-sm text-slate-600 mt-1">{item.notes}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-3 text-slate-500">
                  <PackageCheck className="w-5 h-5" />
                  <span>Your package is being processed. Check back soon for updates.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {!error && !invoice && !loading && !searched && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center text-slate-400">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Enter a tracking number to track your package in real-time.</p>
          </div>
        )}

        {settings && (
          <div className="mt-8 text-center text-sm text-slate-400">
            Need help? Contact us at {settings.phone} or {settings.email}
          </div>
        )}
      </div>
    </div>
  );
}
