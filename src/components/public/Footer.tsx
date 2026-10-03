import { Link } from 'react-router-dom';
import { Package, Phone, Mail, MapPin, Facebook, Twitter, Instagram, Linkedin, MessageCircle, Youtube, Music } from 'lucide-react';
import { useSite } from '@/context/SiteContext';

export default function Footer() {
  const { settings, footerLinks } = useSite();

  const columns = footerLinks.reduce<Record<string, typeof footerLinks>>((acc, link) => {
    if (!acc[link.column_name]) acc[link.column_name] = [];
    acc[link.column_name].push(link);
    return acc;
  }, {});

  const socials = [
    { url: settings?.facebook_url, icon: Facebook, label: 'Facebook' },
    { url: settings?.twitter_url, icon: Twitter, label: 'Twitter' },
    { url: settings?.instagram_url, icon: Instagram, label: 'Instagram' },
    { url: settings?.linkedin_url, icon: Linkedin, label: 'LinkedIn' },
    { url: settings?.whatsapp_url, icon: MessageCircle, label: 'WhatsApp' },
    { url: settings?.youtube_url, icon: Youtube, label: 'YouTube' },
    { url: settings?.tiktok_url, icon: Music, label: 'TikTok' },
  ].filter((s) => s.url);

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="text-white p-1.5 rounded-lg" style={{ backgroundColor: 'var(--color-primary)' }}>
                <Package className="w-5 h-5" />
              </div>
              <span className="font-bold text-white text-lg">{settings?.company_name}</span>
            </div>
            <p className="text-sm text-slate-400 mb-4">{settings?.tagline}</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                <span>{settings?.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                <span>{settings?.email}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5" style={{ color: 'var(--color-primary)' }} />
                <span>{settings?.address}</span>
              </div>
            </div>
          </div>

          {Object.entries(columns).map(([colName, links]) => (
            <div key={colName}>
              <h3 className="font-semibold text-white mb-4">{colName}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.id}>
                    <Link to={link.url} className="text-sm text-slate-400 hover:text-sky-400 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="font-semibold text-white mb-4">Follow Us</h3>
            <div className="flex gap-3 mb-4">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-800 p-2 rounded-lg transition-colors"
                  aria-label={s.label}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                >
                  <s.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 text-center text-sm text-slate-500">
          {settings?.footer_text}
        </div>
      </div>
    </footer>
  );
}
