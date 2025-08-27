import React, { useState, useEffect } from 'react';
import { Venue, PricingItem, PricingCategory } from '../types';
import { Icon } from './Icons';
import { StarRating } from './StarRating';

interface VenueFormProps {
  venueToEdit: Venue | null;
  onSave: (venue: Venue) => void;
  onClose: () => void;
}

const initialPricingCategories: PricingCategory[] = [
    { id: 'rental', name: 'Venue Rental', selectionType: 'single', items: [] },
    { id: 'packages', name: 'Packages', selectionType: 'multiple', items: [] },
    { id: 'food', name: 'Food', selectionType: 'multiple', items: [] },
    { id: 'bar', name: 'Bar', selectionType: 'multiple', items: [] },
];


const initialVenueState: Omit<Venue, 'id'> = {
  name: '',
  location: '',
  url: '',
  rating: 0,
  notes: '',
  pricingCategories: JSON.parse(JSON.stringify(initialPricingCategories)),
  availableDates: [],
  guestCount: 100,
};

export const VenueForm: React.FC<VenueFormProps> = ({ venueToEdit, onSave, onClose }) => {
  const [venue, setVenue] = useState<Omit<Venue, 'id'>>({ ...initialVenueState });
  const [newDate, setNewDate] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    if (venueToEdit) {
      setVenue({
        ...initialVenueState,
        ...venueToEdit
      });
    } else {
      setVenue({ ...initialVenueState, pricingCategories: JSON.parse(JSON.stringify(initialPricingCategories)) });
    }
  }, [venueToEdit]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation to finish
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isNumber = type === 'number';
    setVenue(prev => ({ ...prev, [name]: isNumber ? parseFloat(value) || 0 : value }));
  };
  
  const handleRatingChange = (newRating: number) => {
    setVenue(prev => ({...prev, rating: newRating}));
  };

  const handleAddPriceItem = (categoryId: string, newItem: {name: string, cost: string}) => {
    if (newItem.name && newItem.cost) {
        const item: PricingItem = {
            id: Date.now().toString(),
            name: newItem.name,
            cost: parseFloat(newItem.cost),
            isIncluded: true,
        };
        const updatedCategories = venue.pricingCategories.map(cat => {
            if (cat.id === categoryId) {
                return { ...cat, items: [...cat.items, item] };
            }
            return cat;
        });
        setVenue(prev => ({ ...prev, pricingCategories: updatedCategories }));
    }
  };

  const handleRemovePriceItem = (categoryId: string, itemId: string) => {
     const updatedCategories = venue.pricingCategories.map(cat => {
        if (cat.id === categoryId) {
            return { ...cat, items: cat.items.filter(item => item.id !== itemId) };
        }
        return cat;
    });
    setVenue(prev => ({ ...prev, pricingCategories: updatedCategories }));
  };

  const handleCategoryChange = (categoryId: string, field: 'name' | 'selectionType', value: string) => {
    setVenue(prev => ({
      ...prev,
      pricingCategories: prev.pricingCategories.map(cat =>
        cat.id === categoryId ? { ...cat, [field]: value } : cat
      )
    }));
  };

  const handleAddCategory = () => {
    const newCategory: PricingCategory = {
      id: `cat-${Date.now()}`,
      name: 'New Category',
      selectionType: 'multiple',
      items: [],
    };
    setVenue(prev => ({
      ...prev,
      pricingCategories: [...prev.pricingCategories, newCategory]
    }));
  };

  const handleRemoveCategory = (categoryId: string) => {
    setVenue(prev => ({
      ...prev,
      pricingCategories: prev.pricingCategories.filter(cat => cat.id !== categoryId)
    }));
  };


  const handleAddDate = () => {
    if (newDate) {
      setVenue(prev => ({ ...prev, availableDates: [...prev.availableDates, newDate] }));
      setNewDate('');
    }
  };

  const handleRemoveDate = (dateToRemove: string) => {
    setVenue(prev => ({ ...prev, availableDates: prev.availableDates.filter(date => date !== dateToRemove) }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...venue,
      id: venueToEdit?.id || Date.now().toString(),
    });
  };

  return (
     <div className={`fixed inset-0 bg-black z-50 transition-opacity duration-300 ${isVisible ? 'bg-opacity-50' : 'bg-opacity-0'}`} onClick={handleClose}>
      <div 
        className={`absolute top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isVisible ? 'translate-x-0' : 'translate-x-full'}`}
        onClick={e => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-stone-200">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-stone-700">{venueToEdit ? 'Edit Venue' : 'Add New Venue'}</h2>
              <button type="button" onClick={handleClose} className="text-stone-400 hover:text-stone-600">
                <Icon name="x" className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              <InputField label="Venue Name" name="name" value={venue.name} onChange={handleChange} required />
              <InputField label="Location / Address" name="location" value={venue.location} onChange={handleChange} />
              <InputField label="Website URL" name="url" type="url" value={venue.url || ''} onChange={handleChange} placeholder="https://example.com" />
              <InputField label="Guest Count" name="guestCount" type="number" value={venue.guestCount} onChange={handleChange} />
              
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-stone-700">Rating</label>
                <StarRating rating={venue.rating} onRatingChange={handleRatingChange} />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-stone-700 mb-1">Notes</label>
                <textarea id="notes" name="notes" rows={3} value={venue.notes} onChange={handleChange} className="w-full p-2 border border-stone-300 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500"></textarea>
              </div>
              
              {/* Available Dates */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-stone-700">Available Dates</h3>
                 {venue.availableDates.map(date => (
                  <div key={date} className="flex items-center justify-between bg-stone-100 p-2 rounded-md">
                    <span>{date}</span>
                    <button type="button" onClick={() => handleRemoveDate(date)} className="text-red-500 hover:text-red-700"><Icon name="trash" className="w-4 h-4" /></button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="flex-grow p-2 border border-stone-300 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500" />
                  <button type="button" onClick={handleAddDate} className="bg-rose-100 text-rose-700 p-2 rounded-md hover:bg-rose-200"><Icon name="plus" className="w-5 h-5" /></button>
                </div>
              </div>

              {/* Pricing Categories */}
              <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-stone-800 border-b pb-2">Pricing Details</h3>
                  {venue.pricingCategories.map(category => (
                       <div key={category.id} className="p-4 border border-stone-200 rounded-lg bg-stone-50">
                           <div className="flex justify-between items-start gap-2 mb-2">
                               <div className="flex-1">
                                   <input
                                       type="text"
                                       value={category.name}
                                       onChange={(e) => handleCategoryChange(category.id, 'name', e.target.value)}
                                       placeholder="Category Name"
                                       className="text-lg font-semibold text-stone-700 p-1 -ml-1 w-full bg-transparent rounded-md focus:bg-white focus:ring-1 focus:ring-rose-500 outline-none"
                                   />
                                    <select
                                       value={category.selectionType}
                                       onChange={(e) => handleCategoryChange(category.id, 'selectionType', e.target.value as 'single' | 'multiple')}
                                       className="text-xs mt-1 p-1 border border-stone-300 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500 w-auto"
                                   >
                                       <option value="multiple">Multiple Selections</option>
                                       <option value="single">Single Selection</option>
                                   </select>
                               </div>
                               <button type="button" onClick={() => handleRemoveCategory(category.id)} className="text-stone-400 hover:text-red-500 p-1">
                                   <Icon name="trash" className="w-5 h-5" />
                               </button>
                           </div>
                           
                           <PricingCategoryFormSection 
                               category={category}
                               onAddItem={(newItem) => handleAddPriceItem(category.id, newItem)}
                               onRemoveItem={(itemId) => handleRemovePriceItem(category.id, itemId)}
                           />
                       </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="w-full flex items-center justify-center gap-2 text-rose-600 font-semibold py-2 px-4 rounded-lg border-2 border-dashed border-rose-300 hover:bg-rose-100 transition-colors"
                >
                    <Icon name="plus" className="w-5 h-5" />
                    Add Pricing Category
                </button>
              </div>
            </div>
          </div>
          {/* Footer */}
          <div className="bg-stone-50 px-6 py-4 border-t border-stone-200 flex justify-end gap-4">
            <button type="button" onClick={handleClose} className="bg-white text-stone-700 font-bold py-2 px-6 rounded-lg border border-stone-300 hover:bg-stone-100 transition-colors duration-300">
                Cancel
            </button>
            <button type="submit" className="bg-rose-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-rose-600 transition-colors duration-300 shadow-sm">
              Save Venue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface PricingCategoryFormSectionProps {
    category: PricingCategory;
    onAddItem: (newItem: {name: string, cost: string}) => void;
    onRemoveItem: (itemId: string) => void;
}
const PricingCategoryFormSection: React.FC<PricingCategoryFormSectionProps> = ({ category, onAddItem, onRemoveItem }) => {
    const [newItem, setNewItem] = useState({ name: '', cost: '' });

    const handleAdd = () => {
        onAddItem(newItem);
        setNewItem({ name: '', cost: '' });
    };

    return (
        <div className="space-y-2 pt-3 mt-3 border-t border-stone-200">
            <h4 className="text-sm font-medium text-stone-600 mb-1">Items in this category</h4>
             {category.items.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-white p-2 rounded-md border">
                    <span>{item.name}: ${parseFloat(item.cost.toString()).toLocaleString()}</span>
                    <button type="button" onClick={() => onRemoveItem(item.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100">
                        <Icon name="trash" className="w-4 h-4" />
                    </button>
                </div>
            ))}
            {category.items.length === 0 && <p className="text-xs text-stone-500 italic">No items yet.</p>}
            <div className="flex gap-2 pt-2">
                <input type="text" placeholder="Item Name" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="flex-grow p-2 border border-stone-300 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500" />
                <input type="number" placeholder="Cost" value={newItem.cost} onChange={e => setNewItem({...newItem, cost: e.target.value})} className="w-28 p-2 border border-stone-300 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500" />
                <button type="button" onClick={handleAdd} className="bg-rose-100 text-rose-700 p-2 rounded-md hover:bg-rose-200 shrink-0">
                    <Icon name="plus" className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};


interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, ...props }) => (
    <div>
        <label htmlFor={props.name} className="block text-sm font-medium text-stone-700 mb-1">{label}</label>
        <input {...props} id={props.name} className="w-full p-2 border border-stone-300 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500" />
    </div>
);