import { useState, useEffect, useRef } from 'react';
import {
  Mail, MessageSquare, Send, Inbox, Loader2, Search, Plus,
  ArrowLeft, Reply, Trash2, AlertCircle, CheckCircle2, X,
  Phone, User, Clock, Mailbox,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  Message, MessageChannel,
  MESSAGE_STATUS_LABELS, MESSAGE_STATUS_COLORS,
} from '@/types';
import { useSite } from '@/context/SiteContext';

export default function AdminMessages() {
  const { settings } = useSite();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [filterDirection, setFilterDirection] = useState<string>('all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState('');
  const [configWarning, setConfigWarning] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  const [compose, setCompose] = useState({
    channel: 'email' as MessageChannel,
    recipient_name: '',
    recipient_email: '',
    recipient_phone: '',
    subject: '',
    body: '',
  });

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });
    setMessages((data as Message[]) || []);
    setLoading(false);
  };

  const filtered = messages.filter((msg) => {
    const matchesSearch =
      !search ||
      msg.subject?.toLowerCase().includes(search.toLowerCase()) ||
      msg.body.toLowerCase().includes(search.toLowerCase()) ||
      msg.recipient_name?.toLowerCase().includes(search.toLowerCase()) ||
      msg.recipient_email?.toLowerCase().includes(search.toLowerCase());
    const matchesChannel = filterChannel === 'all' || msg.channel === filterChannel;
    const matchesDirection = filterDirection === 'all' || msg.direction === filterDirection;
    return matchesSearch && matchesChannel && matchesDirection;
  });

  const handleSend = async () => {
    setSending(true);
    setSendStatus('');
    setConfigWarning(false);

    if (compose.channel === 'email' && !compose.recipient_email) {
      setSendStatus('Please enter a recipient email address.');
      setSending(false);
      return;
    }
    if (compose.channel === 'whatsapp' && !compose.recipient_phone) {
      setSendStatus('Please enter a recipient phone number.');
      setSending(false);
      return;
    }
    if (!compose.body.trim()) {
      setSendStatus('Please enter a message.');
      setSending(false);
      return;
    }

    const brandName = settings?.company_name || 'Express Courier Services';
    const threadId = crypto.randomUUID();

    // Save message to database
    const { data: msgData, error: insertError } = await supabase
      .from('messages')
      .insert({
        channel: compose.channel,
        direction: 'outbound',
        recipient_email: compose.recipient_email || null,
        recipient_phone: compose.recipient_phone || null,
        recipient_name: compose.recipient_name || null,
        subject: compose.channel === 'email' ? (compose.subject || '(No Subject)') : null,
        body: compose.body,
        sender_brand_name: brandName,
        status: 'pending',
        thread_id: threadId,
      })
      .select()
      .single();

    if (insertError) {
      setSendStatus('Could not save message. Please try again.');
      setSending(false);
      return;
    }

    const messageRowId = (msgData as any).id;

    if (compose.channel === 'email') {
      // Send via edge function with branded sender name
      const htmlBody = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #0ea5e9; padding: 16px 20px; border-radius: 8px 8px 0 0;">
    <h2 style="color: white; margin: 0;">${brandName}</h2>
  </div>
  <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="color: #334155; line-height: 1.6; white-space: pre-wrap;">${compose.body.replace(/</g, '&lt;')}</p>
  </div>
  <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 16px;">
    <p>This message was sent from ${brandName}.</p>
    <p>Contact us: ${settings?.phone || ''} | ${settings?.email || ''}</p>
  </div>
</div>`;

      try {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            to: compose.recipient_email,
            subject: compose.subject || '(No Subject)',
            body: htmlBody,
            brandName: brandName,
            messageRowId: messageRowId,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          if (result.needsConfig) {
            setConfigWarning(true);
            setSendStatus('Message saved, but email sending is not configured yet. See note below.');
          } else {
            setSendStatus('Message saved, but email could not be sent. Please try again.');
          }
        } else {
          setSendStatus('Email sent successfully! The customer will see it from "' + brandName + '".');
        }
      } catch {
        setSendStatus('Message saved, but there was a network error sending the email.');
      }
    } else {
      // WhatsApp — generate a wa.me link and open it
      const phoneDigits = compose.recipient_phone.replace(/[^0-9]/g, '');
      const text = encodeURIComponent(compose.body);
      window.open(`https://wa.me/${phoneDigits}?text=${text}`, '_blank');
      await supabase.from('messages').update({ status: 'sent' }).eq('id', messageRowId);
      setSendStatus('WhatsApp message prepared. A chat window was opened to send your message.');
    }

    setSending(false);
    setCompose({
      channel: 'email',
      recipient_name: '',
      recipient_email: '',
      recipient_phone: '',
      subject: '',
      body: '',
    });
    setShowCompose(false);
    loadMessages();
    setTimeout(() => setSendStatus(''), 6000);
  };

  const handleReply = (parent: Message) => {
    setShowCompose(true);
    setCompose({
      channel: parent.channel,
      recipient_name: parent.recipient_name || '',
      recipient_email: parent.recipient_email || '',
      recipient_phone: parent.recipient_phone || '',
      subject: parent.subject ? `Re: ${parent.subject}` : '',
      body: '',
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this message?')) return;
    await supabase.from('messages').delete().eq('id', id);
    setMessages(messages.filter((m) => m.id !== id));
    if (selectedMessage?.id === id) setSelectedMessage(null);
  };

  const inputClass = 'w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400';
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1';

  const inboxCount = messages.filter((m) => m.direction === 'inbound').length;
  const sentCount = messages.filter((m) => m.direction === 'outbound').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
          <p className="text-slate-500 text-sm mt-1">Send and review messages to customers via email and WhatsApp</p>
        </div>
        <button
          onClick={() => { setShowCompose(true); setCompose({ channel: 'email', recipient_name: '', recipient_email: '', recipient_phone: '', subject: '', body: '' }); setSendStatus(''); setConfigWarning(false); }}
          className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Message
        </button>
      </div>

      {sendStatus && (
        <div className={`rounded-lg p-3 mb-6 text-sm flex items-center gap-2 ${
          sendStatus.includes('successfully') || sendStatus.includes('prepared')
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            : 'bg-amber-50 border border-amber-200 text-amber-700'
        }`}>
          {sendStatus.includes('successfully') ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {sendStatus}
        </div>
      )}

      {configWarning && (
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 mb-6 text-sm text-sky-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Email sending needs a one-time setup</p>
              <p className="text-sky-700">Your message is saved in the system. To send branded emails (where customers see your company name instead of an email address), a Resend API key needs to be added as an edge function secret named <code className="bg-sky-100 px-1 rounded">RESEND_API_KEY</code>. Until then, you can use WhatsApp sending and the mailto fallback. Get a free key at resend.com.</p>
            </div>
          </div>
        </div>
      )}

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCompose(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">New Message</h2>
              <button onClick={() => setShowCompose(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Channel Toggle */}
              <div>
                <label className={labelClass}>Send via</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCompose({ ...compose, channel: 'email' })}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                      compose.channel === 'email' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Mail className="w-4 h-4" /> Email
                  </button>
                  <button
                    onClick={() => setCompose({ ...compose, channel: 'whatsapp' })}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                      compose.channel === 'whatsapp' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" /> WhatsApp
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Recipient Name</label>
                  <input className={inputClass} value={compose.recipient_name} onChange={(e) => setCompose({ ...compose, recipient_name: e.target.value })} placeholder="John Doe" />
                </div>
                {compose.channel === 'email' ? (
                  <div>
                    <label className={labelClass}>Recipient Email *</label>
                    <input type="email" className={inputClass} value={compose.recipient_email} onChange={(e) => setCompose({ ...compose, recipient_email: e.target.value })} placeholder="customer@email.com" />
                  </div>
                ) : (
                  <div>
                    <label className={labelClass}>Recipient Phone *</label>
                    <input className={inputClass} value={compose.recipient_phone} onChange={(e) => setCompose({ ...compose, recipient_phone: e.target.value })} placeholder="+1234567890" />
                  </div>
                )}
              </div>

              {compose.channel === 'email' && (
                <div>
                  <label className={labelClass}>Subject</label>
                  <input className={inputClass} value={compose.subject} onChange={(e) => setCompose({ ...compose, subject: e.target.value })} placeholder="Message subject" />
                </div>
              )}

              <div>
                <label className={labelClass}>Message</label>
                <textarea
                  className={inputClass}
                  rows={6}
                  value={compose.body}
                  onChange={(e) => setCompose({ ...compose, body: e.target.value })}
                  placeholder="Type your message here..."
                />
              </div>

              {compose.channel === 'email' && (
                <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500">
                  <strong>Note:</strong> The email will be sent from "{settings?.company_name || 'Express Courier Services'}" — the customer sees your brand name, not a raw email address.
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="flex-1 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 text-white font-semibold rounded-lg flex items-center justify-center gap-2"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {compose.channel === 'email' ? 'Send Email' : 'Send via WhatsApp'}
                </button>
                <button
                  onClick={() => setShowCompose(false)}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <Inbox className="w-5 h-5 text-sky-500" />
            <div>
              <div className="text-xl font-bold text-slate-900">{inboxCount}</div>
              <div className="text-xs text-slate-500">Received</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-emerald-500" />
            <div>
              <div className="text-xl font-bold text-slate-900">{sentCount}</div>
              <div className="text-xs text-slate-500">Sent</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-violet-500" />
            <div>
              <div className="text-xl font-bold text-slate-900">{messages.filter((m) => m.channel === 'email').length}</div>
              <div className="text-xs text-slate-500">Emails</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-500" />
            <div>
              <div className="text-xl font-bold text-slate-900">{messages.filter((m) => m.channel === 'whatsapp').length}</div>
              <div className="text-xs text-slate-500">WhatsApp</div>
            </div>
          </div>
        </div>
      </div>

      {/* Message List + Detail View */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-3 border-b border-slate-100 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search messages..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>
            <div className="flex gap-2">
              <select value={filterChannel} onChange={(e) => setFilterChannel(e.target.value)} className="flex-1 px-2 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400">
                <option value="all">All Channels</option>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
              <select value={filterDirection} onChange={(e) => setFilterDirection(e.target.value)} className="flex-1 px-2 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400">
                <option value="all">All</option>
                <option value="outbound">Sent</option>
                <option value="inbound">Received</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="w-6 h-6 text-sky-500 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Mailbox className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No messages yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {filtered.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => setSelectedMessage(msg)}
                  className={`w-full text-left p-3 hover:bg-slate-50 transition-colors ${selectedMessage?.id === msg.id ? 'bg-sky-50' : ''}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {msg.channel === 'email' ? (
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    ) : (
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    )}
                    {msg.direction === 'inbound' ? (
                      <Inbox className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    ) : (
                      <Send className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span className="text-xs font-medium text-slate-700 truncate flex-1">
                      {msg.recipient_name || msg.recipient_email || msg.recipient_phone || 'Unknown'}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full border ${MESSAGE_STATUS_COLORS[msg.status]}`}>
                      {MESSAGE_STATUS_LABELS[msg.status]}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-slate-900 truncate pl-6">
                    {msg.subject || msg.body.slice(0, 40)}
                  </div>
                  <div className="text-xs text-slate-400 pl-6 mt-0.5">
                    {new Date(msg.created_at).toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm" ref={threadRef}>
          {selectedMessage ? (
            <div className="flex flex-col h-full">
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSelectedMessage(null)} className="lg:hidden p-1 text-slate-400 hover:bg-slate-100 rounded">
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${MESSAGE_STATUS_COLORS[selectedMessage.status]}`}>
                      {MESSAGE_STATUS_LABELS[selectedMessage.status]}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                      {selectedMessage.channel === 'email' ? 'Email' : 'WhatsApp'}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                      {selectedMessage.direction === 'outbound' ? 'Sent' : 'Received'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleReply(selectedMessage)} className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg" title="Reply">
                      <Reply className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(selectedMessage.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {selectedMessage.subject && (
                  <h2 className="text-xl font-bold text-slate-900 mb-3">{selectedMessage.subject}</h2>
                )}

                <div className="space-y-2 text-sm">
                  {selectedMessage.recipient_name && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <User className="w-4 h-4 text-slate-400" />
                      <span>{selectedMessage.recipient_name}</span>
                    </div>
                  )}
                  {selectedMessage.recipient_email && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span>{selectedMessage.recipient_email}</span>
                    </div>
                  )}
                  {selectedMessage.recipient_phone && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>{selectedMessage.recipient_phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-500">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{new Date(selectedMessage.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Send className="w-4 h-4 text-slate-400" />
                    <span>From: {selectedMessage.sender_brand_name}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 flex-1">
                <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {selectedMessage.body}
                </div>
              </div>

              {/* Thread messages */}
              {messages.filter((m) => m.thread_id === selectedMessage.thread_id && m.id !== selectedMessage.id).length > 0 && (
                <div className="p-5 border-t border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Thread History</h3>
                  <div className="space-y-3">
                    {messages
                      .filter((m) => m.thread_id === selectedMessage.thread_id && m.id !== selectedMessage.id)
                      .map((m) => (
                        <div key={m.id} className={`rounded-lg p-3 text-sm ${m.direction === 'outbound' ? 'bg-sky-50 ml-8' : 'bg-violet-50 mr-8'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-slate-600">
                              {m.direction === 'outbound' ? 'You' : m.recipient_name || 'Customer'}
                            </span>
                            <span className="text-xs text-slate-400">{new Date(m.created_at).toLocaleString()}</span>
                          </div>
                          {m.subject && <div className="font-medium text-slate-900 mb-1">{m.subject}</div>}
                          <div className="text-slate-700 whitespace-pre-wrap">{m.body}</div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-slate-400">
              <Mail className="w-12 h-12 mb-4 opacity-40" />
              <p className="text-sm">Select a message to view its details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
