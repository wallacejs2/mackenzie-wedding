
export interface ProgressStep {
  id: string;
  name: string;
  completed: boolean;
  date: string | null;
}

export interface Task {
  id: string;
  name: string;
  assignedTo: string;
  dueDate: string;
  isCompleted: boolean;
}

export interface PricingItem {
  id: string;
  name:string;
  cost: number;
  isIncluded: boolean;
  costType?: 'flat' | 'per_guest';
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
  progress: ProgressStep[];
  tasks: Task[];
  updates: string[];
}