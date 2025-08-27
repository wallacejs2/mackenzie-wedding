
export interface PricingItem {
  id: string;
  name: string;
  cost: number;
  isIncluded: boolean;
}

export interface PricingCategory {
  id: string;
  name: string;
  items: PricingItem[];
  selectionType: 'single' | 'multiple'; // 'single' for radio-like behavior, 'multiple' for checkboxes
}

export interface Venue {
  id:string;
  name: string;
  location: string;
  url: string;
  rating: number; // 0-5
  notes: string;
  pricingCategories: PricingCategory[];
  availableDates: string[];
  guestCount: number;
}