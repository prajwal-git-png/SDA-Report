
export interface UserProfile {
  name: string;
  storeName: string;
  empId: string;
  brand: string;
  brandPortfolio: string[];
  department: string;
  photo?: string;
  weekTarget: number;
  monthTarget: number;
}

export type InteractionType = 'Sale' | 'Enquiry' | 'Leave';
export type LeaveType = 'Week Off' | 'Sick Leave' | 'None';
export type AttendedBy = 'Me' | 'Other Staff';

export const PRODUCT_CATEGORIES = [
  'Mixer Grinder', 'Air Fryer', 'OTG', 'Geyser', 'Personal Care', 
  'Chimney', 'Toaster', 'Iron Box', 'Vacuum Cleaner', 'Dyson', 
  'Kettles', 'Rice Cooker', 'Induction', 'Blender', 'Others'
];

export interface SaleEntry {
  id: string;
  date: string;
  interactionType: InteractionType;
  productName: string;
  category: string;
  brandName: string;
  quantity: number;
  price: number;
  reasonForPurchase: string;
  customerFeedback: string;
  isOwnBrand: boolean;
  attendedBy: AttendedBy;
  walkins?: number;
  leaveType?: LeaveType;
}

export type CounterCategory = 'Garment Care' | 'Kitchen Care' | 'Home Care' | 'Others';

export interface CounterLog {
  id: string;
  date: string;
  hasPurchased: boolean;
  timestamp: number;
  category: CounterCategory;
  products: string[];
  brands: string[];
  note: string;
}

export type ReasonType = 'Price Issue' | 'Quality Issue' | 'Requirement Issue' | 'Previous Experience' | 'Brand Loyalty' | 'Feature Missing' | 'Better Warranty' | 'Demo Not Available' | 'Stock Issue' | 'Other';

export const BRANDS = [
  'Bajaj', 'Philips', 'Havells', 'Butterfly', 'Preeti', 'Panasonic', 'Wonderchef', 'Morphy Richards', 'Other'
];

export const REASONS: ReasonType[] = [
  'Price Issue', 'Quality Issue', 'Requirement Issue', 'Previous Experience', 'Brand Loyalty', 'Feature Missing', 'Better Warranty', 'Demo Not Available', 'Stock Issue', 'Other'
];

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
}

export interface SearchResult {
  title: string;
  uri: string;
}
