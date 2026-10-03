import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Truck, Globe, Shield, Package, MapPin, Headphones, Search,
  ArrowRight, CheckCircle2, Star, Clock, Zap, Send, Loader2, MessageSquare,
  Phone, Mail,
  type LucideIcon,
} from 'lucide-react';
import { useSite } from '@/context/SiteContext';
import { supabase } from '@/lib/supabase';

const ICON_MAP: Record<string, LucideIcon> = {
  Truck, Globe, Shield, Package, MapPin, Headphones, Clock, Star, Zap, Send, CheckCircle2, MessageSquare,
};

export default function HomePage() {
  const { settings } = useSite();
  const [trackInput, setTrackInput] = useState('');
  const navigate = useNavigate();

  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [contactSending, setContactSending] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [contactError, setContactError] = useState('');

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;
    setContactSending(true);
    setContactError('');

    const { error } = await supabase.from('messages').insert({
      channel: 'email',
      direction: 'inbound',
      recipient_name: contactForm.name,
      recipient_email: contactForm.email,
      recipient_phone: contactForm.phone || null,
      subject: `Contact form message from ${contactForm.name}`,
      body: contactForm.message,
      sender_brand_name: settings?.company_name || 'Express Courier Services',
      status: 'received',
    });

    if (error) {
      setContactError('Could not send your message. Please try again.');
    } else {
      setContactSent(true);
      setContactForm({ name: '', email: '', phone: '', message: '' });
      setTimeout(() => setContactSent(false), 5000);
    }
    setContactSending(false);
  };

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackInput.trim()) {
      navigate(`/track?code=${encodeURIComponent(trackInput.trim())}`);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-400 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-400 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
                <Zap className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                <span className="text-sm font-medium">{settings?.hero_badge_text || 'Fastest Delivery Network'}</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                {settings?.hero_title || 'Delivering Trust, Every Package, Every Time'}
              </h1>
              <p className="text-lg text-slate-300 mb-8 max-w-xl">
                {settings?.hero_subtitle}
              </p>

              <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3 max-w-lg">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={trackInput}
                    onChange={(e) => setTrackInput(e.target.value)}
                    placeholder="Enter tracking number..."
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  Track Now <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/20 to-amber-500/20 rounded-3xl blur-2xl" />
                <img
                  src={settings?.hero_image_url || 'https://images.pexels.com/photos/4364131/pexels-photo-4364131.jpeg?auto=compress&cs=tinysrgb&w=900'}
                  alt="Courier delivery"
                  className="relative rounded-3xl shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {settings?.stats_json && settings.stats_json.length > 0 && (
        <section className="bg-white py-12 border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {settings.stats_json.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl lg:text-4xl font-bold" style={{ color: 'var(--color-primary)' }}>{stat.value}</div>
                  <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Services Section */}
      {settings?.services_json && settings.services_json.length > 0 && (
        <section id="services" className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{settings?.services_title || 'Our Services'}</h2>
              <p className="text-slate-500 max-w-2xl mx-auto">
                {settings?.services_subtitle || 'Comprehensive courier and logistics solutions designed to meet all your delivery needs, from local parcels to international freight.'}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {settings.services_json.map((service, i) => {
                const Icon = ICON_MAP[service.icon] || Package;
                return (
                  <div
                    key={i}
                    className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl border border-slate-100 transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="p-3 rounded-xl w-fit transition-colors duration-300" style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 8%, transparent)' }}>
                      <Icon className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mt-4 mb-2">{service.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{service.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="relative">
                <img
                  src={settings?.about_image_url || 'https://images.pexels.com/photos/4364169/pexels-photo-4364169.jpeg?auto=compress&cs=tinysrgb&w=800'}
                  alt="About Express Courier"
                  className="rounded-2xl shadow-xl"
                />
                <div className="absolute -bottom-6 -right-6 text-white p-6 rounded-2xl shadow-lg hidden md:block" style={{ backgroundColor: 'var(--color-primary)' }}>
                  <div className="text-3xl font-bold">{settings?.about_badge_value || '99.8%'}</div>
                  <div className="text-sm" style={{ color: 'color-mix(in srgb, var(--color-primary) 60%, white)' }}>{settings?.about_badge_label || 'On-time Delivery'}</div>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                About {settings?.company_name}
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                {settings?.about_text}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(settings?.about_features_json || ['Real-time GPS tracking', 'Insured shipments', '24/7 customer support', '200+ countries covered']).map((feature, fi) => (
                  <div key={fi} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                    <span className="text-sm text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      {settings?.why_choose_json && settings.why_choose_json.length > 0 && (
        <section className="py-20 bg-slate-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{settings?.why_choose_title || 'Why Choose Us'}</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                {settings?.why_choose_subtitle || 'We deliver more than packages — we deliver reliability, speed, and peace of mind.'}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {settings.why_choose_json.map((item, i) => {
                const Icon = ICON_MAP[item.icon] || Clock;
                const colors = ['text-sky-400 bg-sky-500/20', 'text-amber-400 bg-amber-500/20', 'text-emerald-400 bg-emerald-500/20'];
                return (
                  <div key={i} className="text-center">
                    <div className={`p-4 rounded-2xl w-fit mx-auto mb-4 ${colors[i % colors.length]}`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-slate-400 text-sm">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Contact / CTA */}
      <section id="contact" className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{settings?.contact_title || 'Ready to Ship?'}</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              {settings?.contact_subtitle || 'Get in touch with our team to schedule a pickup, ask a question, or learn more about our delivery services.'}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Contact info */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 8%, transparent)', color: 'var(--color-primary)' }}>
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900">Send us a message</h3>
                </div>
                <p className="text-sm text-slate-500">{settings?.contact_info_text || 'Fill out the form and our team will get back to you as soon as possible. Your message goes directly to our admin dashboard.'}</p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-3">
                <a href={`tel:${settings?.phone}`} className="flex items-center gap-3 text-slate-700 hover:text-sky-600 transition-colors">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 8%, transparent)', color: 'var(--color-primary)' }}><Phone className="w-4 h-4" /></div>
                  <span className="text-sm font-medium">{settings?.phone}</span>
                </a>
                <a href={`mailto:${settings?.email}`} className="flex items-center gap-3 text-slate-700 hover:text-sky-600 transition-colors">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 8%, transparent)', color: 'var(--color-primary)' }}><Mail className="w-4 h-4" /></div>
                  <span className="text-sm font-medium">{settings?.email}</span>
                </a>
                <div className="flex items-center gap-3 text-slate-700">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 8%, transparent)', color: 'var(--color-primary)' }}><MapPin className="w-4 h-4" /></div>
                  <span className="text-sm font-medium">{settings?.address}</span>
                </div>
                <Link to="/track" className="flex items-center gap-3 text-slate-700 hover:text-sky-600 transition-colors">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 8%, transparent)', color: 'var(--color-primary)' }}><Search className="w-4 h-4" /></div>
                  <span className="text-sm font-medium">Track a package</span>
                </Link>
              </div>
            </div>

            {/* Contact form */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              {contactSent ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-emerald-50 text-emerald-600 p-4 rounded-full mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Message Sent!</h3>
                  <p className="text-sm text-slate-500">Thank you for reaching out. Our team will get back to you soon.</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                    <input
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                    <input
                      required
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                      placeholder="you@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <input
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Message *</label>
                    <textarea
                      required
                      rows={4}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                      placeholder="How can we help you?"
                    />
                  </div>
                  {contactError && (
                    <div className="text-sm text-rose-600">{contactError}</div>
                  )}
                  <button
                    type="submit"
                    disabled={contactSending}
                    className="w-full px-6 py-2.5 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    {contactSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
