export interface TenantConfig {
  welcome_message: string;
  model_name: string;
  temperature: number;
  system_prompt: string;
  faq_threshold: number;
  knowledge_enabled: boolean;
  fallback_threshold: number;
  cs_webhook_url: string;
  language: string;
}

export interface Tenant {
  id: string;
  name: string;
  api_key: string;
  is_active: boolean;
  max_requests_per_day: number;
  config: TenantConfig;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  tenant_id?: string;
  api_key?: string;
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  tenant_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface Knowledge {
  id: string;
  content: string;
  source: string;
  metadata?: Record<string, unknown> | null;
  tenant_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface Action {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  keyword_pattern: string;
  action_type: string;
  api_endpoint?: string;
  api_method?: string;
  template_id?: string;
  created_at: string;
  updated_at: string;
}

export interface OperatingHourSlot {
  open: string;
  close: string;
}

export interface OperatingHours {
  monday?: OperatingHourSlot;
  tuesday?: OperatingHourSlot;
  wednesday?: OperatingHourSlot;
  thursday?: OperatingHourSlot;
  friday?: OperatingHourSlot;
  saturday?: OperatingHourSlot;
  sunday?: OperatingHourSlot;
}

export interface ReservationTemplate {
  id: string;
  tenant_id: string;
  name: string;
  template_type: string;
  time_policy: string;
  slot_duration_minutes: number;
  resources: string[];
  services: string[];
  operating_hours: OperatingHours;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Credit {
  id: string;
  tenant_id: string;
  user_id: string;
  amount: number;
  billing_month: string;
  due_date: string;
  subscription_start: string;
  subscription_end: string;
  next_renewal_date: string;
  notes: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentStatus {
  total_credits: number;
  total_paid: number;
  total_unpaid: number;
  unpaid_invoices: number;
  last_payment_date: string | null;
}

export interface Reservation {
  id: string;
  tenant_id: string;
  template_id: string;
  resource_name: string;
  customer_name: string;
  customer_contact: string;
  start_time: string;
  end_time?: string;
  service_name: string;
  notes: string;
  status: string;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
}

export interface Model {
  id: string;
  model_name: string;
  model_code: string;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image_url?: string;
  category: string;
  stock: number;
  is_active: boolean;
  tenant_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface AppError {
  id: string;
  error_code: string;
  message: string;
  http_status: number;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminDashboardSummary {
  total_tenants: number;
  total_users: number;
  active_credits: number;
  overdue_credits: number;
}

export interface UserDashboardSummary {
  total_sessions: number;
  active_sessions: number;
  total_knowledge_bases: number;
  total_faqs: number;
}

export interface DashboardResponse {
  data: AdminDashboardSummary | UserDashboardSummary;
  success: boolean;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  tenant_id: string;
  user_id?: string;
  items: OrderItem[];
  total_price: number;
  status: string;
  customer_name: string;
  customer_contact: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface Personality {
  id: string;
  tenant_id: string;
  name: string;
  tone: string;
  language: string;
  instructions: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}
