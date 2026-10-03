import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, FileText, Eye, EyeOff, Save, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PageItem } from '@/types';

export default function AdminPages() {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PageItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', slug: '', content: '', meta_description: '', is_published: true, page_order: 0 });

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    const { data } = await supabase.from('pages').select('*').order('page_order', { ascending: true });
    setPages((data as PageItem[]) || []);
    setLoading(false);
  };

  const startEdit = (page: PageItem) => {
    setEditing(page);
    setForm({
      title: page.title,
      slug: page.slug,
      content: page.content,
      meta_description: page.meta_description || '',
      is_published: page.is_published,
      page_order: page.page_order,
    });
    setCreating(false);
  };

  const startCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm({ title: '', slug: '', content: '<h1>New Page</h1><p>Write your content here...</p>', meta_description: '', is_published: true, page_order: pages.length });
  };

  const cancel = () => {
    setEditing(null);
    setCreating(false);
  };

  const handleSave = async () => {
    if (!form.title || !form.slug) return;

    if (editing) {
      await supabase.from('pages').update({
        title: form.title,
        slug: form.slug,
        content: form.content,
        meta_description: form.meta_description || null,
        is_published: form.is_published,
        page_order: form.page_order,
        updated_at: new Date().toISOString(),
      }).eq('id', editing.id);
    } else {
      await supabase.from('pages').insert({
        title: form.title,
        slug: form.slug,
        content: form.content,
        meta_description: form.meta_description || null,
        is_published: form.is_published,
        page_order: form.page_order,
      });
    }

    setEditing(null);
    setCreating(false);
    loadPages();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this page?')) return;
    await supabase.from('pages').delete().eq('id', id);
    setPages(pages.filter((p) => p.id !== id));
  };

  const togglePublish = async (page: PageItem) => {
    await supabase.from('pages').update({ is_published: !page.is_published }).eq('id', page.id);
    loadPages();
  };

  if (editing || creating) {
    return (
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">{editing ? 'Edit Page' : 'New Page'}</h1>
          <div className="flex gap-2">
            <button onClick={cancel} className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 flex items-center gap-2">
              <X className="w-4 h-4" /> Cancel
            </button>
            <button onClick={handleSave} className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold rounded-lg flex items-center gap-2">
              <Save className="w-4 h-4" /> Save
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Slug (URL)</label>
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-') })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Meta Description</label>
            <input
              value={form.meta_description}
              onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Content (HTML)</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={14}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 font-mono"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} className="w-4 h-4 rounded" />
              Published
            </label>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Order</label>
              <input type="number" value={form.page_order} onChange={(e) => setForm({ ...form, page_order: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pages</h1>
          <p className="text-slate-500 text-sm mt-1">Create and manage website pages</p>
        </div>
        <button onClick={startCreate} className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" /> New Page
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-6 h-6 text-sky-500 animate-spin" />
          </div>
        ) : pages.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>No pages yet. Create your first page.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pages.map((page) => (
              <div key={page.id} className="flex items-center justify-between p-4 hover:bg-slate-50">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{page.title}</span>
                    {page.is_published ? (
                      <span className="text-xs text-emerald-600 flex items-center gap-1"><Eye className="w-3 h-3" /> Published</span>
                    ) : (
                      <span className="text-xs text-slate-400 flex items-center gap-1"><EyeOff className="w-3 h-3" /> Draft</span>
                    )}
                  </div>
                  <div className="text-sm text-slate-500 font-mono">/{page.slug}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => togglePublish(page)} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md" title="Toggle publish">
                    {page.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button onClick={() => startEdit(page)} className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-md" title="Edit">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(page.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
