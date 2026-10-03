import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Package, CheckCircle2, Clock, TrendingUp, Plus, Truck, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DeliveryStatus, STATUS_LABELS, STATUS_COLORS } from '@/types';
import { useSite } from '@/context/SiteContext';

interface DashboardStats {
  total: number;
  processing: number;
  dispatched: number;
  in_transit: number;
  delivered: number;
  on_hold: number;
}

export default function DashboardOverview() {
  const { settings } = useSite();
  const [stats, setStats] = useState<DashboardStats>({ total: 0, processing: 0, dispatched: 0, in_transit: 0, delivered: 0, on_hold: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(true);

  const tz = settings?.timezone || 'UTC';

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { timeZone: tz });
    } catch {
      return new Date(dateStr).toLocaleDateString();
    }
  };

  useEffect(() => {
    (async () => {
      const { count } = await supabase.from('invoices').select('*', { count: 'exact', head: true });
      const { data: recentData } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      const { count: processingCount } = await supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'processing');
      const { count: dispatchedCount } = await supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'dispatched');
      const { count: inTransitCount } = await supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'in_transit');
      const { count: deliveredCount } = await supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'delivered');
      const { count: onHoldCount } = await supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'on_hold');

      const { count: msgCount } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('status', 'received');

      setStats({
        total: count || 0,
        processing: processingCount || 0,
        dispatched: dispatchedCount || 0,
        in_transit: inTransitCount || 0,
        delivered: deliveredCount || 0,
        on_hold: onHoldCount || 0,
      });
      setRecent(recentData || []);
      setUnreadMessages(msgCount || 0);
      setLoading(false);
    })();
  }, []);

  const cards = [
    { label: 'Total Invoices', value: stats.total, icon: FileText, textColor: 'text-sky-600', bgColor: 'bg-sky-50' },
    { label: 'Processing', value: stats.processing, icon: Clock, textColor: 'text-amber-600', bgColor: 'bg-amber-50' },
    { label: 'In Transit', value: stats.in_transit, icon: Truck, textColor: 'text-cyan-600', bgColor: 'bg-cyan-50' },
    { label: 'Delivered', value: stats.delivered, icon: CheckCircle2, textColor: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  ];

  const deliveryRate = stats.total > 0 ? ((stats.delivered / stats.total) * 100).toFixed(1) : '0.0';

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Overview of your courier operations</p>
        </div>
        <Link
          to="/admin/invoices/new"
          className="px-4 py-2 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <Plus className="w-4 h-4" /> New Invoice
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-5 border border-slate-200 animate-pulse h-28" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {cards.map((card) => (
              <div key={card.label} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className={`inline-flex p-2.5 rounded-lg ${card.bgColor} ${card.textColor} mb-3`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <div className="text-2xl font-bold text-slate-900">{card.value}</div>
                <div className="text-sm text-slate-500">{card.label}</div>
              </div>
            ))}
          </div>

          {/* Secondary stats row */}
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">{deliveryRate}%</div>
                <div className="text-sm text-slate-500">Delivery Rate</div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="bg-blue-50 text-blue-600 p-2.5 rounded-lg">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">{stats.dispatched}</div>
                <div className="text-sm text-slate-500">Dispatched</div>
              </div>
            </div>
            <Link to="/admin/messages" className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4 hover:border-sky-300 transition-colors">
              <div className="bg-violet-50 text-violet-600 p-2.5 rounded-lg">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">{unreadMessages}</div>
                <div className="text-sm text-slate-500">Unread Messages</div>
              </div>
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Recent Invoices</h2>
              <Link to="/admin/invoices" className="text-sm hover:underline" style={{ color: 'var(--color-primary)' }}>View all</Link>
            </div>
            {recent.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Package className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>No invoices yet. Create your first invoice to get started.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recent.map((inv) => (
                  <Link
                    key={inv.id}
                    to={`/admin/invoices/${inv.id}`}
                    className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="font-mono text-sm font-medium text-slate-900">{inv.tracking_code}</div>
                      <div className="text-sm text-slate-500 truncate">
                        {inv.sender_name} → {inv.receiver_name} · {formatDate(inv.created_at)}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border shrink-0 ml-4 ${STATUS_COLORS[inv.status as DeliveryStatus]}`}>
                      {STATUS_LABELS[inv.status as DeliveryStatus]}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
