import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PageItem } from '@/types';
import { Loader2, FileText } from 'lucide-react';

export default function DynamicPage() {
  const { slug } = useParams();
  const [page, setPage] = useState<PageItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    supabase
      .from('pages')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle()
      .then(({ data }) => {
        setPage(data as PageItem | null);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400">
        <FileText className="w-12 h-12 mb-4" />
        <p className="text-lg">Page not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">{page.title}</h1>
      <div
        className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-p:text-slate-600 prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-2"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </div>
  );
}
