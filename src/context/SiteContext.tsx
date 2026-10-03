import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { SiteSettings, NavLink, FooterLink } from '@/types';

const GOOGLE_FONTS: Record<string, string> = {
  'Alice': 'Alice',
  'Inter': 'Inter:wght@300;400;500;600;700',
  'Poppins': 'Poppins:wght@300;400;500;600;700',
  'Roboto': 'Roboto:wght@300;400;500;700',
  'Open Sans': 'Open+Sans:wght@300;400;500;600;700',
  'Montserrat': 'Montserrat:wght@300;400;500;600;700',
  'Playfair Display': 'Playfair+Display:wght@400;500;600;700',
  'Lora': 'Lora:wght@400;500;600;700',
  'Source Sans Pro': 'Source+Sans+Pro:wght@300;400;600;700',
  'Nunito': 'Nunito:wght@300;400;600;700',
  'Raleway': 'Raleway:wght@300;400;500;600;700',
  'DM Sans': 'DM+Sans:wght@400;500;700',
  'Work Sans': 'Work+Sans:wght@300;400;500;600;700',
  'Karla': 'Karla:wght@300;400;700',
  'Rubik': 'Rubik:wght@300;400;500;600;700',
};

export function getFontUrl(fontFamily: string): string | null {
  const key = Object.keys(GOOGLE_FONTS).find((k) => k.toLowerCase() === fontFamily.toLowerCase());
  if (!key) return null;
  return `https://fonts.googleapis.com/css2?family=${GOOGLE_FONTS[key]}&display=swap`;
}

export const AVAILABLE_FONTS = Object.keys(GOOGLE_FONTS);

export const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Anchorage', 'America/Toronto', 'America/Vancouver', 'America/Mexico_City',
  'America/Sao_Paulo', 'America/Argentina/Buenos_Aires',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid', 'Europe/Rome',
  'Europe/Amsterdam', 'Europe/Stockholm', 'Europe/Moscow', 'Europe/Istanbul',
  'Africa/Lagos', 'Africa/Johannesburg', 'Africa/Cairo', 'Africa/Nairobi',
  'Asia/Dubai', 'Asia/Karachi', 'Asia/Kolkata', 'Asia/Dhaka', 'Asia/Bangkok',
  'Asia/Singapore', 'Asia/Shanghai', 'Asia/Hong_Kong', 'Asia/Tokyo', 'Asia/Seoul',
  'Australia/Sydney', 'Australia/Melbourne', 'Australia/Perth',
  'Pacific/Auckland', 'Pacific/Honolulu',
];

interface SiteContextValue {
  settings: SiteSettings | null;
  navLinks: NavLink[];
  footerLinks: FooterLink[];
  loading: boolean;
  refresh: () => Promise<void>;
}

const SiteContext = createContext<SiteContextValue | undefined>(undefined);

export function SiteProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [navLinks, setNavLinks] = useState<NavLink[]>([]);
  const [footerLinks, setFooterLinks] = useState<FooterLink[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [settingsRes, navRes, footerRes] = await Promise.all([
      supabase.from('site_settings').select('*').limit(1).maybeSingle(),
      supabase.from('nav_links').select('*').order('link_order', { ascending: true }),
      supabase.from('footer_links').select('*').order('link_order', { ascending: true }),
    ]);

    if (settingsRes.data) setSettings(settingsRes.data as SiteSettings);
    if (navRes.data) setNavLinks(navRes.data as NavLink[]);
    if (footerRes.data) setFooterLinks(footerRes.data as FooterLink[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const font = settings?.font_family || 'Alice';
    const url = getFontUrl(font);
    if (!url) return;
    const id = 'google-font-link';
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = url;
    document.documentElement.style.fontFamily = `'${font}', sans-serif`;
  }, [settings?.font_family]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', settings?.primary_color || '#0ea5e9');
    root.style.setProperty('--color-secondary', settings?.secondary_color || '#0f172a');
    root.style.setProperty('--color-accent', settings?.accent_color || '#f59e0b');
  }, [settings?.primary_color, settings?.secondary_color, settings?.accent_color]);

  return (
    <SiteContext.Provider value={{ settings, navLinks, footerLinks, loading, refresh }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used within SiteProvider');
  return ctx;
}
