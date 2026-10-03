import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Save, X, ArrowUp, ArrowDown, Loader2, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { FooterLink } from '@/types';

export default function AdminFooter() {
  const [links, setLinks] = useState<FooterLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FooterLink | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ label: '', url: '', link_order: 0, column_name: 'Company', is_external: false });

  useEffect(() => { loadLinks(); }, []);

  const loadLinks = async () => {
    const { data } = await supabase.from('footer_links').select('*').order('column_name', { ascending: true }).order('link_order', { ascending: true });
    setLinks((data as FooterLink[]) || []);
    setLoading(false);
  };

  const columns = links.reduce<Record<string, FooterLink[]>>((acc, link) => {
    if (!acc[link.column_name]) acc[link.column_name] = [];
    acc[link.column_name].push(link);
    return acc;
  }, {});

  const startEdit = (link: FooterLink) => {
    setEditing(link);
    setForm({ label: link.label, url: link.url, link_order: link.link_order, column_name: link.column_name, is_external: link.is_external });
    setCreating(false);
  };

  const startCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm({ label: '', url: '/', link_order: 0, column_name: 'Company', is_external: false });
  };

  const cancel = () => { setEditing(null); setCreating(false); };

  const handleSave = async () => {
    if (!form.label || !form.url) return;
    if (editing) {
      await supabase.from('footer_links').update(form).eq('id', editing.id);
    } else {
      await supabase.from('footer_links').insert(form);
    }
    cancel();
    loadLinks();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this link?')) return;
    await supabase.from('footer_links').delete().eq('id', id);
    setLinks(links.filter((l) => l.id !== id));
  };

  const moveLink = async (colLinks: FooterLink[], link: FooterLink, dir: -1 | 1) => {
    const idx = colLinks.indexOf(link);
    const target = colLinks[idx + dir];
    if (!target) return;
    await supabase.from('footer_links').update({ link_order: target.link_order }).eq('id', link.id);
    await supabase.from('footer_links').update({ link_order: link.link_order }).eq('id', target.id);
    loadLinks();
  };

  const inputClass = 'w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Footer Links</h1>
          <p className="text-slate-500 text-sm mt-1">Manage footer navigation grouped by columns</p>
        </div>
        {!editing && !creating && (
          <button onClick={startCreate} className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors">
            <Plus className="w-4 h-4" /> Add Link
          </button>
        )}
      </div>

      {(editing || creating) && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900">{editing ? 'Edit Link' : 'New Link'}</h2>
            <button onClick={cancel} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Label</label>
              <input className={inputClass} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">URL</label>
              <input className={inputClass} value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Column Name</label>
              <input className={inputClass} value={form.column_name} onChange={(e) => setForm({ ...form, column_name: e.target.value })} placeholder="Company, Services, Support..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Order</label>
              <input type="number" className={inputClass} value={form.link_order} onChange={(e) => setForm({ ...form, link_order: parseInt(e.target.value) || 0 })} />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={form.is_external} onChange={(e) => setForm({ ...form, is_external: e.target.checked })} className="w-4 h-4" />
              External Link
            </label>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold rounded-lg flex items-center gap-2">
              <Save className="w-4 h-4" /> Save
            </button>
            <button onClick={cancel} className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 flex justify-center">
          <Loader2 className="w-6 h-6 text-sky-500 animate-spin" />
        </div>
      ) : links.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center text-slate-400">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>No footer links yet.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(columns).map(([colName, colLinks]) => (
            <div key={colName} className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 font-bold text-slate-900">{colName}</div>
              <div className="divide-y divide-slate-100">
                {colLinks.map((link, idx) => (
                  <div key={link.id} className="flex items-center justify-between p-3 hover:bg-slate-50">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => moveLink(colLinks, link, -1)} disabled={idx === 0} className="text-slate-400 hover:text-sky-600 disabled:opacity-30">
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button onClick={() => moveLink(colLinks, link, 1)} disabled={idx === colLinks.length - 1} className="text-slate-400 hover:text-sky-600 disabled:opacity-30">
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">{link.label}</div>
                        <div className="text-xs text-slate-500 font-mono truncate">{link.url}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => startEdit(link)} className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-md"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(link.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
