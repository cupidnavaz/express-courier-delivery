import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Package } from 'lucide-react';
import { useState } from 'react';
import { useSite } from '@/context/SiteContext';

export default function Navbar() {
  const { settings, navLinks } = useSite();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const activeLinks = navLinks.filter((l) => l.is_active);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt={settings.company_name} className="h-9 w-auto" />
            ) : (
              <div className="flex items-center gap-2">
                <div className="text-white p-1.5 rounded-lg" style={{ backgroundColor: 'var(--color-primary)' }}>
                  <Package className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-900 text-lg">{settings?.company_name || 'Express Courier'}</span>
              </div>
            )}
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {activeLinks.map((link) => (
              <Link
                key={link.id}
                to={link.url}
                className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-sky-600 hover:bg-sky-50 rounded-md transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={() => navigate('/track')}
              className="ml-2 px-4 py-2 text-sm font-semibold text-white rounded-md transition-colors"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Track Package
            </button>
          </nav>

          <button
            className="md:hidden p-2 text-slate-700"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            {activeLinks.map((link) => (
              <Link
                key={link.id}
                to={link.url}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-slate-700 hover:text-sky-600 hover:bg-sky-50 rounded-md"
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/track"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-white rounded-md text-center"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Track Package
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
