import { useState, useEffect } from 'react';
import { Save, Loader2, CheckCircle2, Plus, Trash2, Link2, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SiteSettings, ServiceItem, StatItem, WhyChooseItem } from '@/types';
import { useSite, AVAILABLE_FONTS, COMMON_TIMEZONES } from '@/context/SiteContext';
import FileUpload from '@/components/admin/FileUpload';

export default function AdminSettings() {
  const { settings, refresh } = useSite();
  const [form, setForm] = useState<Partial<SiteSettings>>({});
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [whyChoose, setWhyChoose] = useState<WhyChooseItem[]>([]);
  const [aboutFeatures, setAboutFeatures] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoMode, setLogoMode] = useState<'upload' | 'url'>('upload');
  const [heroMode, setHeroMode] = useState<'upload' | 'url'>('upload');
  const [aboutImgMode, setAboutImgMode] = useState<'upload' | 'url'>('upload');

  useEffect(() => {
    if (settings) {
      setForm(settings);
      setServices(settings.services_json || []);
      setStats(settings.stats_json || []);
      setWhyChoose(settings.why_choose_json || []);
      setAboutFeatures(settings.about_features_json || []);
    }
  }, [settings]);

  const update = (key: keyof SiteSettings, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (!form.id) return;
    setSaving(true);
    await supabase.from('site_settings').update({
      company_name: form.company_name,
      logo_url: form.logo_url,
      tagline: form.tagline,
      phone: form.phone,
      email: form.email,
      address: form.address,
      about_text: form.about_text,
      about_image_url: form.about_image_url,
      about_badge_value: form.about_badge_value,
      about_badge_label: form.about_badge_label,
      facebook_url: form.facebook_url,
      twitter_url: form.twitter_url,
      instagram_url: form.instagram_url,
      linkedin_url: form.linkedin_url,
      whatsapp_url: form.whatsapp_url,
      tiktok_url: form.tiktok_url,
      youtube_url: form.youtube_url,
      primary_color: form.primary_color,
      secondary_color: form.secondary_color,
      accent_color: form.accent_color,
      hero_title: form.hero_title,
      hero_subtitle: form.hero_subtitle,
      hero_image_url: form.hero_image_url,
      services_title: form.services_title,
      services_subtitle: form.services_subtitle,
      why_choose_title: form.why_choose_title,
      why_choose_subtitle: form.why_choose_subtitle,
      why_choose_json: whyChoose as any,
      contact_title: form.contact_title,
      contact_subtitle: form.contact_subtitle,
      contact_info_text: form.contact_info_text,
      hero_badge_text: form.hero_badge_text,
      about_features_json: aboutFeatures as any,
      services_json: services as any,
      stats_json: stats as any,
      footer_text: form.footer_text,
      font_family: form.font_family,
      timezone: form.timezone,
      updated_at: new Date().toISOString(),
    }).eq('id', form.id);
    await refresh();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const inputClass = 'w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400';
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1';
  const sectionClass = 'bg-white rounded-xl border border-slate-200 shadow-sm p-6';
  const headingClass = 'font-bold text-slate-900 mb-4';

  const updateService = (idx: number, key: keyof ServiceItem, value: string) => {
    setServices(services.map((s, i) => i === idx ? { ...s, [key]: value } : s));
  };
  const addService = () => setServices([...services, { icon: 'Package', title: 'New Service', description: 'Description here' }]);
  const removeService = (idx: number) => setServices(services.filter((_, i) => i !== idx));

  const updateStat = (idx: number, key: keyof StatItem, value: string) => {
    setStats(stats.map((s, i) => i === idx ? { ...s, [key]: value } : s));
  };
  const addStat = () => setStats([...stats, { label: 'New Stat', value: '0' }]);
  const removeStat = (idx: number) => setStats(stats.filter((_, i) => i !== idx));

  const updateWhyChoose = (idx: number, key: keyof WhyChooseItem, value: string) => {
    setWhyChoose(whyChoose.map((w, i) => i === idx ? { ...w, [key]: value } : w));
  };
  const addWhyChoose = () => setWhyChoose([...whyChoose, { icon: 'Star', title: 'New Feature', description: 'Description here' }]);
  const removeWhyChoose = (idx: number) => setWhyChoose(whyChoose.filter((_, i) => i !== idx));

  const updateAboutFeature = (idx: number, value: string) => {
    setAboutFeatures(aboutFeatures.map((f, i) => i === idx ? value : f));
  };
  const addAboutFeature = () => setAboutFeatures([...aboutFeatures, 'New feature']);
  const removeAboutFeature = (idx: number) => setAboutFeatures(aboutFeatures.filter((_, i) => i !== idx));

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Site Settings</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your company details, branding, website content, fonts, and timezone</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-6 text-sm text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Settings saved successfully!
        </div>
      )}

      <div className="space-y-6">
        {/* Appearance: Font & Timezone */}
        <div className={sectionClass}>
          <h2 className={headingClass}>Appearance</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Font Family</label>
              <select className={inputClass} value={form.font_family || 'Alice'} onChange={(e) => update('font_family', e.target.value)}>
                {AVAILABLE_FONTS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1">Applied across the entire website. Default: Alice.</p>
            </div>
            <div>
              <label className={labelClass}>Timezone</label>
              <select className={inputClass} value={form.timezone || 'UTC'} onChange={(e) => update('timezone', e.target.value)}>
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1">Controls how dates and times are displayed in the admin panel.</p>
            </div>
          </div>
        </div>

        {/* Company Info */}
        <div className={sectionClass}>
          <h2 className={headingClass}>Company Information</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Company Name</label>
              <input className={inputClass} value={form.company_name || ''} onChange={(e) => update('company_name', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Tagline</label>
              <input className={inputClass} value={form.tagline || ''} onChange={(e) => update('tagline', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input className={inputClass} value={form.phone || ''} onChange={(e) => update('phone', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input className={inputClass} value={form.email || ''} onChange={(e) => update('email', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Address</label>
              <input className={inputClass} value={form.address || ''} onChange={(e) => update('address', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Company Logo</label>
              <div className="flex gap-2 mb-3">
                <button type="button" onClick={() => setLogoMode('upload')} className={`px-3 py-1.5 text-sm font-medium rounded-lg flex items-center gap-1.5 ${logoMode === 'upload' ? 'bg-sky-50 text-sky-600' : 'text-slate-500 hover:bg-slate-100'}`}>
                  <Upload className="w-3.5 h-3.5" /> Upload
                </button>
                <button type="button" onClick={() => setLogoMode('url')} className={`px-3 py-1.5 text-sm font-medium rounded-lg flex items-center gap-1.5 ${logoMode === 'url' ? 'bg-sky-50 text-sky-600' : 'text-slate-500 hover:bg-slate-100'}`}>
                  <Link2 className="w-3.5 h-3.5" /> URL
                </button>
              </div>
              {logoMode === 'upload' ? (
                <FileUpload value={form.logo_url || null} onChange={(url) => update('logo_url', url)} folder="logos" className="max-w-xs" />
              ) : (
                <input className={inputClass} value={form.logo_url || ''} onChange={(e) => update('logo_url', e.target.value)} placeholder="https://..." />
              )}
            </div>
            <div>
              <label className={labelClass}>Footer Text</label>
              <input className={inputClass} value={form.footer_text || ''} onChange={(e) => update('footer_text', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className={sectionClass}>
          <h2 className={headingClass}>Hero Section</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass}>Hero Title</label>
              <input className={inputClass} value={form.hero_title || ''} onChange={(e) => update('hero_title', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Hero Subtitle</label>
              <textarea className={inputClass} rows={2} value={form.hero_subtitle || ''} onChange={(e) => update('hero_subtitle', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Hero Badge Text</label>
              <input className={inputClass} value={form.hero_badge_text || ''} onChange={(e) => update('hero_badge_text', e.target.value)} placeholder="Fastest Delivery Network" />
              <p className="text-xs text-slate-400 mt-1">The small badge shown above the hero title.</p>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Hero Image</label>
              <div className="flex gap-2 mb-3">
                <button type="button" onClick={() => setHeroMode('upload')} className={`px-3 py-1.5 text-sm font-medium rounded-lg flex items-center gap-1.5 ${heroMode === 'upload' ? 'bg-sky-50 text-sky-600' : 'text-slate-500 hover:bg-slate-100'}`}>
                  <Upload className="w-3.5 h-3.5" /> Upload
                </button>
                <button type="button" onClick={() => setHeroMode('url')} className={`px-3 py-1.5 text-sm font-medium rounded-lg flex items-center gap-1.5 ${heroMode === 'url' ? 'bg-sky-50 text-sky-600' : 'text-slate-500 hover:bg-slate-100'}`}>
                  <Link2 className="w-3.5 h-3.5" /> URL
                </button>
              </div>
              {heroMode === 'upload' ? (
                <FileUpload value={form.hero_image_url || null} onChange={(url) => update('hero_image_url', url)} folder="hero" />
              ) : (
                <input className={inputClass} value={form.hero_image_url || ''} onChange={(e) => update('hero_image_url', e.target.value)} placeholder="https://..." />
              )}
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className={sectionClass}>
          <h2 className={headingClass}>About Section</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass}>About Text</label>
              <textarea className={inputClass} rows={4} value={form.about_text || ''} onChange={(e) => update('about_text', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>About Image</label>
              <div className="flex gap-2 mb-3">
                <button type="button" onClick={() => setAboutImgMode('upload')} className={`px-3 py-1.5 text-sm font-medium rounded-lg flex items-center gap-1.5 ${aboutImgMode === 'upload' ? 'bg-sky-50 text-sky-600' : 'text-slate-500 hover:bg-slate-100'}`}>
                  <Upload className="w-3.5 h-3.5" /> Upload
                </button>
                <button type="button" onClick={() => setAboutImgMode('url')} className={`px-3 py-1.5 text-sm font-medium rounded-lg flex items-center gap-1.5 ${aboutImgMode === 'url' ? 'bg-sky-50 text-sky-600' : 'text-slate-500 hover:bg-slate-100'}`}>
                  <Link2 className="w-3.5 h-3.5" /> URL
                </button>
              </div>
              {aboutImgMode === 'upload' ? (
                <FileUpload value={form.about_image_url || null} onChange={(url) => update('about_image_url', url)} folder="about" />
              ) : (
                <input className={inputClass} value={form.about_image_url || ''} onChange={(e) => update('about_image_url', e.target.value)} placeholder="https://..." />
              )}
            </div>
            <div>
              <label className={labelClass}>Badge Value</label>
              <input className={inputClass} value={form.about_badge_value || ''} onChange={(e) => update('about_badge_value', e.target.value)} placeholder="99.8%" />
            </div>
            <div>
              <label className={labelClass}>Badge Label</label>
              <input className={inputClass} value={form.about_badge_label || ''} onChange={(e) => update('about_badge_label', e.target.value)} placeholder="On-time Delivery" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>About Features</label>
              <p className="text-xs text-slate-400 mb-2">Checklist items shown under the About text on the homepage.</p>
              <div className="space-y-2">
                {aboutFeatures.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input className={inputClass} value={feature} onChange={(e) => updateAboutFeature(idx, e.target.value)} />
                    <button onClick={() => removeAboutFeature(idx)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={addAboutFeature} className="mt-2 px-3 py-1.5 bg-sky-50 text-sky-600 text-sm font-semibold rounded-lg flex items-center gap-1 hover:bg-sky-100">
                <Plus className="w-4 h-4" /> Add Feature
              </button>
            </div>
          </div>
        </div>

        {/* Services Section */}
        <div className={sectionClass}>
          <h2 className={headingClass}>Services Section</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelClass}>Section Title</label>
              <input className={inputClass} value={form.services_title || ''} onChange={(e) => update('services_title', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Section Subtitle</label>
              <input className={inputClass} value={form.services_subtitle || ''} onChange={(e) => update('services_subtitle', e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700 text-sm">Service Items</h3>
            <button onClick={addService} className="px-3 py-1.5 bg-sky-50 text-sky-600 text-sm font-semibold rounded-lg flex items-center gap-1 hover:bg-sky-100">
              <Plus className="w-4 h-4" /> Add Service
            </button>
          </div>
          <div className="space-y-4">
            {services.map((service, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg p-4">
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-500">Icon</label>
                    <select className={inputClass} value={service.icon} onChange={(e) => updateService(idx, 'icon', e.target.value)}>
                      <option>Truck</option><option>Globe</option><option>Shield</option>
                      <option>Package</option><option>MapPin</option><option>Headphones</option>
                      <option>Clock</option><option>Star</option><option>Zap</option>
                      <option>CheckCircle2</option><option>Send</option><option>MessageSquare</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Title</label>
                    <input className={inputClass} value={service.title} onChange={(e) => updateService(idx, 'title', e.target.value)} />
                  </div>
                  <div className="flex items-end">
                    <button onClick={() => removeService(idx)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="sm:col-span-3">
                    <label className="text-xs text-slate-500">Description</label>
                    <input className={inputClass} value={service.description} onChange={(e) => updateService(idx, 'description', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Why Choose Us Section */}
        <div className={sectionClass}>
          <h2 className={headingClass}>Why Choose Us Section</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelClass}>Section Title</label>
              <input className={inputClass} value={form.why_choose_title || ''} onChange={(e) => update('why_choose_title', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Section Subtitle</label>
              <input className={inputClass} value={form.why_choose_subtitle || ''} onChange={(e) => update('why_choose_subtitle', e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700 text-sm">Feature Cards</h3>
            <button onClick={addWhyChoose} className="px-3 py-1.5 bg-sky-50 text-sky-600 text-sm font-semibold rounded-lg flex items-center gap-1 hover:bg-sky-100">
              <Plus className="w-4 h-4" /> Add Feature
            </button>
          </div>
          <div className="space-y-4">
            {whyChoose.map((item, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg p-4">
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-500">Icon</label>
                    <select className={inputClass} value={item.icon} onChange={(e) => updateWhyChoose(idx, 'icon', e.target.value)}>
                      <option>Clock</option><option>Shield</option><option>Star</option>
                      <option>Zap</option><option>Truck</option><option>Globe</option>
                      <option>Package</option><option>MapPin</option><option>Headphones</option>
                      <option>CheckCircle2</option><option>Send</option><option>MessageSquare</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Title</label>
                    <input className={inputClass} value={item.title} onChange={(e) => updateWhyChoose(idx, 'title', e.target.value)} />
                  </div>
                  <div className="flex items-end">
                    <button onClick={() => removeWhyChoose(idx)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="sm:col-span-3">
                    <label className="text-xs text-slate-500">Description</label>
                    <input className={inputClass} value={item.description} onChange={(e) => updateWhyChoose(idx, 'description', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <div className={sectionClass}>
          <h2 className={headingClass}>Contact Section</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass}>Contact Info Text</label>
              <textarea className={inputClass} rows={2} value={form.contact_info_text || ''} onChange={(e) => update('contact_info_text', e.target.value)} />
              <p className="text-xs text-slate-400 mt-1">The description shown in the contact info card next to the form.</p>
            </div>
            <div>
              <label className={labelClass}>Section Title</label>
              <input className={inputClass} value={form.contact_title || ''} onChange={(e) => update('contact_title', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Section Subtitle</label>
              <input className={inputClass} value={form.contact_subtitle || ''} onChange={(e) => update('contact_subtitle', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className={sectionClass}>
          <h2 className={headingClass}>Social Media Links</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Facebook URL</label>
              <input className={inputClass} value={form.facebook_url || ''} onChange={(e) => update('facebook_url', e.target.value)} placeholder="https://facebook.com/..." />
            </div>
            <div>
              <label className={labelClass}>Twitter / X URL</label>
              <input className={inputClass} value={form.twitter_url || ''} onChange={(e) => update('twitter_url', e.target.value)} placeholder="https://twitter.com/..." />
            </div>
            <div>
              <label className={labelClass}>Instagram URL</label>
              <input className={inputClass} value={form.instagram_url || ''} onChange={(e) => update('instagram_url', e.target.value)} placeholder="https://instagram.com/..." />
            </div>
            <div>
              <label className={labelClass}>LinkedIn URL</label>
              <input className={inputClass} value={form.linkedin_url || ''} onChange={(e) => update('linkedin_url', e.target.value)} placeholder="https://linkedin.com/..." />
            </div>
            <div>
              <label className={labelClass}>WhatsApp URL</label>
              <input className={inputClass} value={form.whatsapp_url || ''} onChange={(e) => update('whatsapp_url', e.target.value)} placeholder="https://wa.me/..." />
            </div>
            <div>
              <label className={labelClass}>YouTube URL</label>
              <input className={inputClass} value={form.youtube_url || ''} onChange={(e) => update('youtube_url', e.target.value)} placeholder="https://youtube.com/..." />
            </div>
            <div>
              <label className={labelClass}>TikTok URL</label>
              <input className={inputClass} value={form.tiktok_url || ''} onChange={(e) => update('tiktok_url', e.target.value)} placeholder="https://tiktok.com/..." />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className={sectionClass}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={headingClass}>Statistics Counters</h2>
            <button onClick={addStat} className="px-3 py-1.5 bg-sky-50 text-sky-600 text-sm font-semibold rounded-lg flex items-center gap-1 hover:bg-sky-100">
              <Plus className="w-4 h-4" /> Add Stat
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {stats.map((stat, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg p-4 flex items-end gap-3">
                <div className="flex-1">
                  <label className="text-xs text-slate-500">Label</label>
                  <input className={inputClass} value={stat.label} onChange={(e) => updateStat(idx, 'label', e.target.value)} />
                </div>
                <div className="w-24">
                  <label className="text-xs text-slate-500">Value</label>
                  <input className={inputClass} value={stat.value} onChange={(e) => updateStat(idx, 'value', e.target.value)} />
                </div>
                <button onClick={() => removeStat(idx)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Brand Colors */}
        <div className={sectionClass}>
          <h2 className={headingClass}>Brand Colors</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Primary</label>
              <div className="flex gap-2">
                <input type="color" value={form.primary_color || '#0ea5e9'} onChange={(e) => update('primary_color', e.target.value)} className="w-12 h-10 rounded cursor-pointer border border-slate-300" />
                <input className={inputClass} value={form.primary_color || ''} onChange={(e) => update('primary_color', e.target.value)} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Secondary</label>
              <div className="flex gap-2">
                <input type="color" value={form.secondary_color || '#0f172a'} onChange={(e) => update('secondary_color', e.target.value)} className="w-12 h-10 rounded cursor-pointer border border-slate-300" />
                <input className={inputClass} value={form.secondary_color || ''} onChange={(e) => update('secondary_color', e.target.value)} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Accent</label>
              <div className="flex gap-2">
                <input type="color" value={form.accent_color || '#f59e0b'} onChange={(e) => update('accent_color', e.target.value)} className="w-12 h-10 rounded cursor-pointer border border-slate-300" />
                <input className={inputClass} value={form.accent_color || ''} onChange={(e) => update('accent_color', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save All Changes
          </button>
        </div>
      </div>
    </div>
  );
}
