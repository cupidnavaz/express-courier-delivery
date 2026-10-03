export interface WhyChooseItem {
  icon: string;
  title: string;
  description: string;
}

export interface SiteSettings {
  id: string;
  company_name: string;
  logo_url: string | null;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  about_text: string | null;
  facebook_url: string;
  twitter_url: string;
  instagram_url: string;
  linkedin_url: string;
  whatsapp_url: string;
  tiktok_url: string;
  youtube_url: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image_url: string | null;
  about_image_url: string | null;
  about_badge_value: string;
  about_badge_label: string;
  services_title: string;
  services_subtitle: string;
  why_choose_title: string;
  why_choose_subtitle: string;
  why_choose_json: WhyChooseItem[];
  contact_title: string;
  contact_subtitle: string;
  contact_info_text: string;
  hero_badge_text: string;
  about_features_json: string[];
  services_json: ServiceItem[];
  stats_json: StatItem[];
  footer_text: string;
  font_family: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceItem {
  icon: string;
  title: string;
  description: string;
}

export interface StatItem {
  label: string;
  value: string;
}

export interface NavLink {
  id: string;
  label: string;
  url: string;
  link_order: number;
  is_active: boolean;
  is_external: boolean;
  created_at: string;
}

export interface FooterLink {
  id: string;
  label: string;
  url: string;
  link_order: number;
  column_name: string;
  is_external: boolean;
  created_at: string;
}

export interface PageItem {
  id: string;
  title: string;
  slug: string;
  content: string;
  is_published: boolean;
  meta_description: string | null;
  page_order: number;
  created_at: string;
  updated_at: string;
}

export type DeliveryStatus = 'processing' | 'dispatched' | 'in_transit' | 'on_hold' | 'delivered';

export interface Invoice {
  id: string;
  tracking_code: string;
  barcode_value: string;
  sender_name: string;
  sender_phone: string;
  sender_email: string | null;
  sender_address: string;
  receiver_name: string;
  receiver_phone: string;
  receiver_email: string | null;
  receiver_address: string;
  package_description: string;
  package_weight: string | null;
  package_type: string | null;
  package_dimensions: string | null;
  shipping_method: string;
  total_cost: number;
  currency: string;
  status: DeliveryStatus;
  estimated_delivery_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceStatusHistory {
  id: string;
  invoice_id: string;
  status: DeliveryStatus;
  notes: string | null;
  location: string | null;
  created_at: string;
}

export const STATUS_LABELS: Record<DeliveryStatus, string> = {
  processing: 'Processing',
  dispatched: 'Dispatched',
  in_transit: 'In Transit',
  on_hold: 'On Hold',
  delivered: 'Delivered',
};

export const STATUS_COLORS: Record<DeliveryStatus, string> = {
  processing: 'bg-amber-100 text-amber-800 border-amber-300',
  dispatched: 'bg-blue-100 text-blue-800 border-blue-300',
  in_transit: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  on_hold: 'bg-rose-100 text-rose-800 border-rose-300',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-300',
};

export const STATUS_ORDER: DeliveryStatus[] = ['processing', 'dispatched', 'in_transit', 'on_hold', 'delivered'];

export type MessageChannel = 'email' | 'whatsapp';
export type MessageDirection = 'outbound' | 'inbound';
export type MessageStatus = 'sent' | 'failed' | 'delivered' | 'received' | 'pending';

export interface Message {
  id: string;
  channel: MessageChannel;
  direction: MessageDirection;
  recipient_email: string | null;
  recipient_phone: string | null;
  recipient_name: string | null;
  subject: string | null;
  body: string;
  sender_brand_name: string;
  status: MessageStatus;
  thread_id: string | null;
  parent_id: string | null;
  invoice_id: string | null;
  created_at: string;
}

export const MESSAGE_STATUS_LABELS: Record<MessageStatus, string> = {
  sent: 'Sent',
  failed: 'Failed',
  delivered: 'Delivered',
  received: 'Received',
  pending: 'Pending',
};

export const MESSAGE_STATUS_COLORS: Record<MessageStatus, string> = {
  sent: 'bg-sky-100 text-sky-800 border-sky-300',
  failed: 'bg-rose-100 text-rose-800 border-rose-300',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  received: 'bg-violet-100 text-violet-800 border-violet-300',
  pending: 'bg-amber-100 text-amber-800 border-amber-300',
};
