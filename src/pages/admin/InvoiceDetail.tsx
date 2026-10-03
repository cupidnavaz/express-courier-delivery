import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Download, Share2, Mail, Loader2, Package, Truck,
  CheckCircle2, Clock, AlertCircle, MapPin, User, Calendar,
  Plus, History, Printer, Trash2, Edit3, Save, X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  Invoice, InvoiceStatusHistory, DeliveryStatus,
  STATUS_LABELS, STATUS_COLORS, STATUS_ORDER,
} from '@/types';
import { useSite } from '@/context/SiteContext';

const STATUS_ICONS: Record<DeliveryStatus, React.ComponentType<{ className?: string }>> = {
  processing: Clock,
  dispatched: Truck,
  in_transit: Package,
  on_hold: AlertCircle,
  delivered: CheckCircle2,
};

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings } = useSite();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [history, setHistory] = useState<InvoiceStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<DeliveryStatus>('processing');
  const [statusNote, setStatusNote] = useState('');
  const [statusLocation, setStatusLocation] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState('');
  const [editingHistory, setEditingHistory] = useState<InvoiceStatusHistory | null>(null);
  const [editHistoryStatus, setEditHistoryStatus] = useState<DeliveryStatus>('processing');
  const [editHistoryNote, setEditHistoryNote] = useState('');
  const [editHistoryLocation, setEditHistoryLocation] = useState('');
  const [savingHistory, setSavingHistory] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const tz = settings?.timezone || 'UTC';

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { timeZone: tz });
    } catch {
      return new Date(dateStr).toLocaleDateString();
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('en-US', { timeZone: tz });
    } catch {
      return new Date(dateStr).toLocaleString();
    }
  };

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: invData } = await supabase.from('invoices').select('*').eq('id', id).maybeSingle();
      if (invData) {
        setInvoice(invData as Invoice);
        const QRCode = (await import('qrcode')).default;
        const qr = await QRCode.toDataURL(invData.tracking_code, { width: 200, margin: 1 });
        setQrDataUrl(qr);

        const { data: histData } = await supabase
          .from('invoice_status_history')
          .select('*')
          .eq('invoice_id', id)
          .order('created_at', { ascending: true });
        setHistory((histData as InvoiceStatusHistory[]) || []);
      }
      setLoading(false);
    })();
  }, [id]);

  const handleAddStatus = async () => {
    if (!invoice) return;
    setSavingStatus(true);
    await supabase.from('invoice_status_history').insert({
      invoice_id: invoice.id,
      status: newStatus,
      notes: statusNote || null,
      location: statusLocation || null,
    });
    await supabase.from('invoices').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', invoice.id);

    setInvoice({ ...invoice, status: newStatus });
    const { data: histData } = await supabase
      .from('invoice_status_history')
      .select('*')
      .eq('invoice_id', id)
      .order('created_at', { ascending: true });
    setHistory((histData as InvoiceStatusHistory[]) || []);

    setShowStatusModal(false);
    setStatusNote('');
    setStatusLocation('');
    setSavingStatus(false);
  };

  const handleDownloadPDF = async () => {
    if (!invoice || !qrDataUrl) return;

    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header bar
    doc.setFillColor(14, 165, 233);
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(settings?.company_name || 'Express Courier Services', 14, 13);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(settings?.tagline || '', 14, 20);
    doc.text(settings?.phone || '', 14, 26);

    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('DELIVERY INVOICE', pageWidth - 14, 18, { align: 'right' });

    // Tracking code box
    doc.setFillColor(241, 245, 249);
    doc.rect(14, 38, pageWidth - 28, 20, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('TRACKING CODE', 20, 45);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.tracking_code, 20, 53);

    // QR code
    doc.addImage(qrDataUrl, 'PNG', pageWidth - 44, 38, 26, 26);

    let y = 70;

    // Status
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Status:', 14, y);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(STATUS_LABELS[invoice.status].toUpperCase(), 35, y);
    y += 10;

    // Sender / Receiver
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('FROM (SENDER)', 14, y);
    doc.text('TO (RECEIVER)', pageWidth / 2 + 7, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const senderLines = [
      invoice.sender_name,
      invoice.sender_phone,
      invoice.sender_email || '',
      invoice.sender_address,
    ].filter(Boolean);
    const receiverLines = [
      invoice.receiver_name,
      invoice.receiver_phone,
      invoice.receiver_email || '',
      invoice.receiver_address,
    ].filter(Boolean);

    senderLines.forEach((line) => { doc.text(line, 14, y); y += 5; });
    let yRight = y - senderLines.length * 5;
    receiverLines.forEach((line) => { doc.text(line, pageWidth / 2 + 7, yRight); yRight += 5; });

    y = Math.max(y, yRight) + 8;
    doc.line(14, y - 4, pageWidth - 14, y - 4);

    // Package details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('PACKAGE DETAILS', 14, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const packageLines: [string, string][] = [
      ['Description', invoice.package_description],
      ['Type', invoice.package_type || 'N/A'],
      ['Weight', invoice.package_weight ? `${invoice.package_weight} kg` : 'N/A'],
      ['Dimensions', invoice.package_dimensions || 'N/A'],
      ['Shipping Method', invoice.shipping_method],
      ['Estimated Delivery', invoice.estimated_delivery_date ? formatDate(invoice.estimated_delivery_date) : 'TBD'],
    ];
    packageLines.forEach(([label, value]) => {
      doc.setTextColor(100, 116, 139);
      doc.text(label + ':', 14, y);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(value, 70, y);
      doc.setFont('helvetica', 'normal');
      y += 5;
    });

    y += 4;
    doc.line(14, y, pageWidth - 14, y);
    y += 8;

    // Cost
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Total Cost:', 14, y);
    doc.text(`${invoice.currency} ${invoice.total_cost.toFixed(2)}`, pageWidth - 14, y, { align: 'right' });
    y += 10;

    // Notes
    if (invoice.notes) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text('Notes:', 14, y);
      doc.text(doc.splitTextToSize(invoice.notes, pageWidth - 28), 14, y + 5);
    }

    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.text(`${settings?.address || ''}  |  ${settings?.email || ''}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text(`Invoice created: ${formatDate(invoice.created_at)}`, pageWidth / 2, pageHeight - 5, { align: 'center' });

    doc.save(`Invoice-${invoice.tracking_code}.pdf`);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/track?code=${invoice?.tracking_code}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Track your package', url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setEmailStatus('Tracking link copied to clipboard!');
      setTimeout(() => setEmailStatus(''), 3000);
    }
  };

  const handleEmail = async () => {
    if (!invoice?.receiver_email) {
      setEmailStatus('No receiver email on this invoice.');
      setTimeout(() => setEmailStatus(''), 3000);
      return;
    }
    setEmailSending(true);
    setEmailStatus('');

    const subject = `Your Delivery Invoice - ${invoice.tracking_code}`;
    const body = `Dear ${invoice.receiver_name},\n\nYour package has been registered with ${settings?.company_name}.\n\nTracking Code: ${invoice.tracking_code}\nStatus: ${STATUS_LABELS[invoice.status]}\n\nTrack your package here: ${window.location.origin}/track?code=${invoice.tracking_code}\n\nPackage Details:\n- Description: ${invoice.package_description}\n- Shipping Method: ${invoice.shipping_method}\n- Estimated Delivery: ${invoice.estimated_delivery_date ? formatDate(invoice.estimated_delivery_date) : 'TBD'}\n\nThank you for choosing ${settings?.company_name}.\n\n${settings?.phone}\n${settings?.email}`;

    window.location.href = `mailto:${invoice.receiver_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setEmailSending(false);
    setEmailStatus('Email client opened.');
    setTimeout(() => setEmailStatus(''), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDeleteHistory = async (historyId: string) => {
    if (!invoice || !confirm('Delete this status update from the history?')) return;
    await supabase.from('invoice_status_history').delete().eq('id', historyId);
    const { data: histData } = await supabase
      .from('invoice_status_history')
      .select('*')
      .eq('invoice_id', id)
      .order('created_at', { ascending: true });
    setHistory((histData as InvoiceStatusHistory[]) || []);
  };

  const handleEditHistory = (item: InvoiceStatusHistory) => {
    setEditingHistory(item);
    setEditHistoryStatus(item.status);
    setEditHistoryNote(item.notes || '');
    setEditHistoryLocation(item.location || '');
  };

  const handleSaveHistory = async () => {
    if (!editingHistory) return;
    setSavingHistory(true);
    await supabase.from('invoice_status_history').update({
      status: editHistoryStatus,
      notes: editHistoryNote || null,
      location: editHistoryLocation || null,
    }).eq('id', editingHistory.id);
    const { data: histData } = await supabase
      .from('invoice_status_history')
      .select('*')
      .eq('invoice_id', id)
      .order('created_at', { ascending: true });
    setHistory((histData as InvoiceStatusHistory[]) || []);
    setEditingHistory(null);
    setSavingHistory(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
      </div>
    );
  }

  if (!invoice) {
    return <div className="text-center py-20 text-slate-400">Invoice not found.</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <button onClick={() => navigate('/admin/invoices')} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-slate-900 truncate">Invoice {invoice.tracking_code}</h1>
          <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[invoice.status]}`}>
            {STATUS_LABELS[invoice.status]}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={handleDownloadPDF} className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors">
          <Download className="w-4 h-4" /> Download PDF
        </button>
        <button onClick={handleShare} className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors">
          <Share2 className="w-4 h-4" /> Share
        </button>
        <button onClick={handleEmail} disabled={emailSending} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors">
          {emailSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />} Email Receiver
        </button>
        <button onClick={handlePrint} className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors">
          <Printer className="w-4 h-4" /> Print
        </button>
        <button onClick={() => navigate(`/admin/invoices/${invoice.id}/edit`)} className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors">
          <Edit3 className="w-4 h-4" /> Edit Invoice
        </button>
        <button onClick={() => { setNewStatus(invoice.status); setShowStatusModal(true); }} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors">
          <Truck className="w-4 h-4" /> Update Status
        </button>
      </div>

      {emailStatus && (
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 mb-4 text-sm text-sky-700">{emailStatus}</div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Invoice Card */}
        <div ref={invoiceRef} className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-sky-500 to-sky-600 text-white p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="text-lg font-bold">{settings?.company_name}</div>
                <div className="text-sm text-sky-100">{settings?.tagline}</div>
                <div className="text-xs text-sky-200 mt-2">{settings?.phone}</div>
              </div>
              {qrDataUrl && (
                <div className="bg-white p-2 rounded-lg">
                  <img src={qrDataUrl} alt="QR Code" className="w-24 h-24" />
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            <div className="bg-slate-50 rounded-lg p-4 mb-6 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">Tracking Code</div>
                <div className="text-lg font-bold font-mono text-slate-900">{invoice.tracking_code}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500 uppercase tracking-wide">Date</div>
                <div className="text-sm font-medium text-slate-700">{formatDate(invoice.created_at)}</div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-sky-500" />
                  <span className="font-semibold text-slate-900 text-sm">FROM (SENDER)</span>
                </div>
                <div className="space-y-1 text-sm text-slate-600">
                  <div className="font-medium text-slate-900">{invoice.sender_name}</div>
                  <div>{invoice.sender_phone}</div>
                  {invoice.sender_email && <div>{invoice.sender_email}</div>}
                  <div>{invoice.sender_address}</div>
                </div>
              </div>
              <div className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-amber-500" />
                  <span className="font-semibold text-slate-900 text-sm">TO (RECEIVER)</span>
                </div>
                <div className="space-y-1 text-sm text-slate-600">
                  <div className="font-medium text-slate-900">{invoice.receiver_name}</div>
                  <div>{invoice.receiver_phone}</div>
                  {invoice.receiver_email && <div>{invoice.receiver_email}</div>}
                  <div>{invoice.receiver_address}</div>
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-emerald-500" />
                <span className="font-semibold text-slate-900 text-sm">PACKAGE DETAILS</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-500">Description:</span> <span className="font-medium text-slate-900">{invoice.package_description}</span></div>
                <div><span className="text-slate-500">Type:</span> <span className="font-medium text-slate-900">{invoice.package_type || 'N/A'}</span></div>
                <div><span className="text-slate-500">Weight:</span> <span className="font-medium text-slate-900">{invoice.package_weight ? `${invoice.package_weight} kg` : 'N/A'}</span></div>
                <div><span className="text-slate-500">Dimensions:</span> <span className="font-medium text-slate-900">{invoice.package_dimensions || 'N/A'}</span></div>
                <div><span className="text-slate-500">Shipping Method:</span> <span className="font-medium text-slate-900">{invoice.shipping_method}</span></div>
                <div><span className="text-slate-500">Est. Delivery:</span> <span className="font-medium text-slate-900">{invoice.estimated_delivery_date ? formatDate(invoice.estimated_delivery_date) : 'TBD'}</span></div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
              <span className="font-semibold text-slate-900">Total Cost</span>
              <span className="text-2xl font-bold text-sky-600">{invoice.currency} {invoice.total_cost.toFixed(2)}</span>
            </div>

            {invoice.notes && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <strong>Notes:</strong> {invoice.notes}
              </div>
            )}
          </div>
        </div>

        {/* Status Timeline */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-slate-700" />
            <h2 className="font-bold text-slate-900">Status Timeline</h2>
          </div>

          {history.length > 0 ? (
            <div className="space-y-0 mb-6">
              {history.map((item, idx) => {
                const Icon = STATUS_ICONS[item.status] || Clock;
                const isLast = idx === history.length - 1;
                return (
                  <div key={item.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`p-1.5 rounded-full ${STATUS_COLORS[item.status].replace('border', 'border-0')}`}>
                        <Icon className={`w-3 h-3 ${item.status === 'processing' ? 'animate-spin' : ''}`} />
                      </div>
                      {!isLast && <div className="w-0.5 flex-1 bg-slate-200 my-1" />}
                    </div>
                    <div className={`flex-1 ${isLast ? '' : 'pb-4'}`}>
                      <div className="font-semibold text-sm text-slate-900">{STATUS_LABELS[item.status]}</div>
                      <div className="text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</div>
                      {item.location && <div className="text-xs text-slate-600 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{item.location}</div>}
                      {item.notes && <div className="text-xs text-slate-600 mt-1">{item.notes}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400 mb-6">No status updates yet.</p>
          )}

          <button
            onClick={() => { setNewStatus(invoice.status); setShowStatusModal(true); }}
            className="w-full px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Status Update
          </button>

          {/* Status Quick Update */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="text-xs text-slate-500 mb-2">Quick update:</div>
            <div className="flex flex-wrap gap-2">
              {STATUS_ORDER.map((s) => (
                <button
                  key={s}
                  onClick={async () => {
                    if (s === invoice.status) return;
                    setSavingStatus(true);
                    await supabase.from('invoice_status_history').insert({
                      invoice_id: invoice.id,
                      status: s,
                      notes: `Status updated to ${STATUS_LABELS[s]}.`,
                    });
                    await supabase.from('invoices').update({ status: s, updated_at: new Date().toISOString() }).eq('id', invoice.id);
                    setInvoice({ ...invoice, status: s });
                    const { data: histData } = await supabase.from('invoice_status_history').select('*').eq('invoice_id', id).order('created_at', { ascending: true });
                    setHistory((histData as InvoiceStatusHistory[]) || []);
                    setSavingStatus(false);
                  }}
                  disabled={savingStatus || s === invoice.status}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    s === invoice.status
                      ? STATUS_COLORS[s] + ' opacity-60'
                      : 'border-slate-200 text-slate-600 hover:border-sky-300 hover:text-sky-600'
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowStatusModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Update Delivery Status</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as DeliveryStatus)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                >
                  {STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                <input
                  value={statusLocation}
                  onChange={(e) => setStatusLocation(e.target.value)}
                  placeholder="e.g. New York Sorting Center"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={3}
                  placeholder="Additional details about this status update..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAddStatus}
                  disabled={savingStatus}
                  className="flex-1 px-4 py-2 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2"
                >
                  {savingStatus && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Update
                </button>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit History Modal */}
      {editingHistory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditingHistory(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Edit Status Update</h2>
              <button onClick={() => setEditingHistory(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={editHistoryStatus}
                  onChange={(e) => setEditHistoryStatus(e.target.value as DeliveryStatus)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                >
                  {STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                <input
                  value={editHistoryLocation}
                  onChange={(e) => setEditHistoryLocation(e.target.value)}
                  placeholder="e.g. New York Sorting Center"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={editHistoryNote}
                  onChange={(e) => setEditHistoryNote(e.target.value)}
                  rows={3}
                  placeholder="Additional details about this status update..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSaveHistory}
                  disabled={savingHistory}
                  className="flex-1 px-4 py-2 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2"
                >
                  {savingHistory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingHistory(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
