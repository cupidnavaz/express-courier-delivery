import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Loader2, User, MapPin, Package, Truck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DeliveryStatus } from '@/types';
import { useSite } from '@/context/SiteContext';

function generateTrackingCode(): string {
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ECS-${ymd}-${rand}`;
}

export default function InvoiceCreate() {
  const navigate = useNavigate();
  const { settings } = useSite();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    sender_name: '',
    sender_phone: '',
    sender_email: '',
    sender_address: '',
    receiver_name: '',
    receiver_phone: '',
    receiver_email: '',
    receiver_address: '',
    package_description: '',
    package_weight: '',
    package_type: 'Standard Package',
    package_dimensions: '',
    shipping_method: 'Standard',
    total_cost: '',
    currency: 'USD',
    estimated_delivery_date: '',
    notes: '',
  });

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (!form.sender_name || !form.sender_phone || !form.sender_address ||
        !form.receiver_name || !form.receiver_phone || !form.receiver_address ||
        !form.package_description) {
      setError('Please fill in all required fields.');
      setSaving(false);
      return;
    }

    const trackingCode = generateTrackingCode();

    const { data, error: insertError } = await supabase
      .from('invoices')
      .insert({
        tracking_code: trackingCode,
        barcode_value: trackingCode,
        sender_name: form.sender_name,
        sender_phone: form.sender_phone,
        sender_email: form.sender_email || null,
        sender_address: form.sender_address,
        receiver_name: form.receiver_name,
        receiver_phone: form.receiver_phone,
        receiver_email: form.receiver_email || null,
        receiver_address: form.receiver_address,
        package_description: form.package_description,
        package_weight: form.package_weight || null,
        package_type: form.package_type,
        package_dimensions: form.package_dimensions || null,
        shipping_method: form.shipping_method,
        total_cost: parseFloat(form.total_cost) || 0,
        currency: form.currency,
        status: 'processing' as DeliveryStatus,
        estimated_delivery_date: form.estimated_delivery_date || null,
        notes: form.notes || null,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    // Create initial status history entry
    await supabase.from('invoice_status_history').insert({
      invoice_id: (data as any).id,
      status: 'processing',
      notes: 'Invoice created and order received.',
      location: settings?.address || 'Origin Facility',
    });

    navigate(`/admin/invoices/${(data as any).id}`);
  };

  const inputClass = 'w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400';
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1';

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/invoices')} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Create Delivery Invoice</h1>
          <p className="text-slate-500 text-sm mt-1">A tracking code and QR code will be auto-generated</p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 mb-6 text-sm text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sender Details */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-sky-50 text-sky-600 p-2 rounded-lg">
              <User className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-slate-900">Sender Details</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Name *</label>
              <input className={inputClass} value={form.sender_name} onChange={(e) => update('sender_name', e.target.value)} required />
            </div>
            <div>
              <label className={labelClass}>Phone *</label>
              <input className={inputClass} value={form.sender_phone} onChange={(e) => update('sender_phone', e.target.value)} required />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" className={inputClass} value={form.sender_email} onChange={(e) => update('sender_email', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Address *</label>
              <input className={inputClass} value={form.sender_address} onChange={(e) => update('sender_address', e.target.value)} required />
            </div>
          </div>
        </div>

        {/* Receiver Details */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-amber-50 text-amber-600 p-2 rounded-lg">
              <MapPin className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-slate-900">Receiver Details</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Name *</label>
              <input className={inputClass} value={form.receiver_name} onChange={(e) => update('receiver_name', e.target.value)} required />
            </div>
            <div>
              <label className={labelClass}>Phone *</label>
              <input className={inputClass} value={form.receiver_phone} onChange={(e) => update('receiver_phone', e.target.value)} required />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" className={inputClass} value={form.receiver_email} onChange={(e) => update('receiver_email', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Address *</label>
              <input className={inputClass} value={form.receiver_address} onChange={(e) => update('receiver_address', e.target.value)} required />
            </div>
          </div>
        </div>

        {/* Package Details */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg">
              <Package className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-slate-900">Package Details</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass}>Description *</label>
              <input className={inputClass} value={form.package_description} onChange={(e) => update('package_description', e.target.value)} required placeholder="e.g. Electronics, Documents, Gift..." />
            </div>
            <div>
              <label className={labelClass}>Weight (kg)</label>
              <input className={inputClass} value={form.package_weight} onChange={(e) => update('package_weight', e.target.value)} placeholder="e.g. 2.5" />
            </div>
            <div>
              <label className={labelClass}>Package Type</label>
              <select className={inputClass} value={form.package_type} onChange={(e) => update('package_type', e.target.value)}>
                <option>Standard Package</option>
                <option>Fragile</option>
                <option>Documents</option>
                <option>Electronics</option>
                <option>Food & Perishables</option>
                <option>Oversized</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Dimensions (LxWxH cm)</label>
              <input className={inputClass} value={form.package_dimensions} onChange={(e) => update('package_dimensions', e.target.value)} placeholder="e.g. 30x20x15" />
            </div>
            <div>
              <label className={labelClass}>Shipping Method</label>
              <select className={inputClass} value={form.shipping_method} onChange={(e) => update('shipping_method', e.target.value)}>
                <option>Standard</option>
                <option>Express</option>
                <option>Same-Day</option>
                <option>International</option>
                <option>Economy</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Total Cost</label>
              <input type="number" step="0.01" className={inputClass} value={form.total_cost} onChange={(e) => update('total_cost', e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className={labelClass}>Currency</label>
              <select className={inputClass} value={form.currency} onChange={(e) => update('currency', e.target.value)}>
                <option>USD</option>
                <option>EUR</option>
                <option>GBP</option>
                <option>CAD</option>
                <option>AUD</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Estimated Delivery Date</label>
              <input type="date" className={inputClass} value={form.estimated_delivery_date} onChange={(e) => update('estimated_delivery_date', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Notes</label>
              <textarea className={inputClass} rows={3} value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Additional delivery instructions..." />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Create Invoice
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/invoices')}
            className="px-6 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
