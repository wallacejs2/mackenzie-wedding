
import React, { useState, useEffect } from 'react';
import { Venue, PricingCategory, PricingItem, ProgressStep } from './types';
import { VenueForm } from './components/VenueForm';
import { VenueDetail } from './components/VenueDetail';
import { Icon } from './components/Icons';
import { StarRating } from './components/StarRating';

const calculateTotalCost = (venue: Venue): number => {
    let totalCost = 0;
    if (!venue.pricingCategories) {
        return 0;
    }

    for (const category of venue.pricingCategories) {
        const itemsToSum = category.selectionType === 'single'
            ? [category.items.find(item => item.isIncluded)].filter(Boolean) as PricingItem[]
            : category.items.filter(item => item.isIncluded);
        
        for (const item of itemsToSum) {
            if (item.costType === 'per_guest') {
                totalCost += item.cost * venue.guestCount;
            } else { // Handles 'flat' and undefined
                totalCost += item.cost;
            }
        }
    }
    
    return totalCost;
};

const initialProgressSteps: ProgressStep[] = [
    { id: 'inquired', name: 'Inquired', completed: false, date: null },
    { id: 'tour', name: 'Scheduled Tour', completed: false, date: null },
    { id: 'contract', name: 'Received Contract', completed: false, date: null },
    { id: 'booked', name: 'Booked!', completed: false, date: null },
];


const App: React.FC = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    try {
      const storedVenues = localStorage.getItem('weddingVenues');
      if (storedVenues) {
        const parsedVenues = JSON.parse(storedVenues).map((v: any): Venue => {
            let migratedVenue: any;

            // --- MIGRATION LOGIC ---
            if (v.pricingCategories) {
                // It's a newer format, just copy it over
                migratedVenue = { ...v, url: v.url || '' };
            } else {
                // It's an older format, migrate pricing
                const migratedCategories: PricingCategory[] = [
                    { id: 'rental', name: 'Venue Rental', selectionType: 'single', items: [] },
                    { id: 'packages', name: 'Packages', selectionType: 'multiple', items: (v.pricing || []).map((p: any) => ({ ...p, isIncluded: p.isIncluded === undefined ? true : p.isIncluded })) },
                    { id: 'food', name: 'Food', selectionType: 'multiple', items: [] },
                    { id: 'bar', name: 'Bar', selectionType: 'multiple', items: [] },
                ];
                migratedVenue = {
                    id: v.id,
                    name: v.name,
                    location: v.location,
                    url: v.url || '',
                    rating: v.rating,
                    notes: v.notes,
                    availableDates: v.availableDates || [],
                    guestCount: v.guestCount || 100,
                    pricingCategories: migratedCategories
                };
            }

            // Ensure new tracking fields exist on all venues
            if (!migratedVenue.progress) {
              migratedVenue.progress = JSON.parse(JSON.stringify(initialProgressSteps));
            }
            if (!migratedVenue.tasks) {
              migratedVenue.tasks = [];
            }
            if (!migratedVenue.updates) {
              migratedVenue.updates = [];
            }

            return migratedVenue as Venue;
        });
        setVenues(parsedVenues);
      }
    } catch (error) {
      console.error("Could not parse venues from localStorage", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('weddingVenues', JSON.stringify(venues));
  }, [venues]);

  const handleSelectVenue = (venue: Venue) => {
    setSelectedVenue(venue);
  };

  const handleCloseDetail = () => {
    setSelectedVenue(null);
  };

  const handleAddNew = () => {
    setEditingVenue(null);
    setSelectedVenue(null);
    setIsFormOpen(true);
  };

  const handleEdit = (venue: Venue) => {
    setEditingVenue(venue);
    setIsFormOpen(true);
    setSelectedVenue(null); // Close detail view when editing
  };
  
  const handleDelete = (id: string) => {
    if(window.confirm('Are you sure you want to delete this venue?')) {
        setVenues(venues.filter(v => v.id !== id));
        setSelectedVenue(null);
    }
  };

  const handleSaveVenue = (venue: Venue) => {
    const index = venues.findIndex(v => v.id === venue.id);
    if (index > -1) {
      const updatedVenues = [...venues];
      updatedVenues[index] = venue;
      setVenues(updatedVenues);
    } else {
      setVenues([...venues, venue]);
    }
    setIsFormOpen(false);
    setEditingVenue(null);
    setSelectedVenue(venue); // Select the newly saved venue
  };

  const handleVenueUpdate = (updatedVenue: Venue) => {
    const updatedVenues = venues.map(v => v.id === updatedVenue.id ? updatedVenue : v);
    setVenues(updatedVenues);
    if (selectedVenue && selectedVenue.id === updatedVenue.id) {
        setSelectedVenue(updatedVenue);
    }
  };
  
  const handleExportCSV = () => {
    if (venues.length === 0) {
        alert("No venues to export.");
        return;
    }

    const escapeCSV = (field: any): string => {
        const str = String(field ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const headers = [
        'Name', 'Location', 'Website URL', 'Rating (1-5)', 'Guest Count',
        'Estimated Total Cost', 'Available Dates', 'Selected Options', 'Notes'
    ];

    const rows = venues.map(venue => {
        const totalCost = calculateTotalCost(venue);
        const availableDates = venue.availableDates.join('; ');
        const selectedOptions = venue.pricingCategories
            .flatMap(category => 
                category.items
                    .filter(item => item.isIncluded)
                    .map(item => `${category.name} - ${item.name} ($${item.cost.toFixed(2)}${item.costType === 'per_guest' ? '/guest' : ''})`)
            )
            .join('; ');

        return [
            escapeCSV(venue.name),
            escapeCSV(venue.location),
            escapeCSV(venue.url),
            escapeCSV(venue.rating),
            escapeCSV(venue.guestCount),
            escapeCSV(totalCost.toFixed(2)),
            escapeCSV(availableDates),
            escapeCSV(selectedOptions),
            escapeCSV(venue.notes)
        ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "wedding_venues_export.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="flex h-screen w-screen bg-stone-50">
      {isFormOpen && <VenueForm venueToEdit={editingVenue} onSave={handleSaveVenue} onClose={() => setIsFormOpen(false)} />}
      
      {/* Venue List Panel */}
      <aside className="w-1/3 max-w-md h-full flex flex-col border-r border-stone-200">
        <header className="p-6 border-b border-stone-200">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-stone-800">Venue Cost Calculator</h1>
                    <p className="text-stone-500 mt-1">Compare your wedding venue options.</p>
                </div>
                <button
                    onClick={handleExportCSV}
                    title="Export all venues to CSV"
                    className="p-2 text-stone-500 hover:text-rose-500 hover:bg-rose-100 rounded-full transition-colors shrink-0 ml-4"
                >
                    <Icon name="export" className="w-6 h-6"/>
                </button>
            </div>
        </header>
        <div className="p-4">
            <button
                onClick={handleAddNew}
                className="w-full flex items-center justify-center gap-2 bg-rose-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-rose-600 transition-colors duration-300 shadow"
            >
                <Icon name="plus" className="w-5 h-5" />
                Add New Venue
            </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {venues.length === 0 ? (
            <div className="text-center text-stone-500 mt-10">
                <p>No venues added yet.</p>
                <p>Click "Add New Venue" to get started!</p>
            </div>
          ) : (
            venues.map(venue => (
              <VenueCard key={venue.id} venue={venue} onSelect={handleSelectVenue} isSelected={selectedVenue?.id === venue.id} />
            ))
          )}
        </div>
      </aside>

      {/* Main Content Panel */}
      <main className="flex-1 h-full">
        {selectedVenue ? (
          <VenueDetail 
            venue={selectedVenue} 
            onClose={handleCloseDetail} 
            onEdit={handleEdit} 
            onDelete={handleDelete}
            onVenueUpdate={handleVenueUpdate}
          />
        ) : (
          <WelcomeScreen />
        )}
      </main>
    </div>
  );
};

const VenueCard: React.FC<{ venue: Venue, onSelect: (venue: Venue) => void, isSelected: boolean}> = ({ venue, onSelect, isSelected }) => {
    const totalCost = calculateTotalCost(venue);

    return (
        <div 
            onClick={() => onSelect(venue)} 
            className={`bg-white p-4 rounded-lg shadow-sm border-2 cursor-pointer transition-all duration-200 ${isSelected ? 'border-rose-500 shadow-md' : 'border-transparent hover:border-rose-300 hover:shadow-md'}`}
        >
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1 overflow-hidden">
                    <h3 className="font-bold text-lg truncate text-stone-800">{venue.name}</h3>
                    <p className="text-sm text-stone-500 truncate">{venue.location}</p>
                    <div className="mt-2 flex items-center gap-3">
                        <StarRating rating={venue.rating} />
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xl font-bold text-rose-600">{totalCost.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="text-xs text-stone-500">Est. Total</div>
                </div>
            </div>
        </div>
    );
};

const WelcomeScreen = () => (
    <div className="h-full flex flex-col justify-center items-center text-center p-8 bg-gradient-to-br from-rose-50 to-stone-50">
        <div className="max-w-md">
            <h2 className="text-4xl font-bold text-stone-700">Welcome to Your Venue Calculator</h2>
            <p className="mt-4 text-stone-500 text-lg">
                Select a venue from the list to see its cost breakdown, or add a new one to start comparing.
            </p>
            <div className="mt-8 text-rose-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
            </div>
        </div>
    </div>
);

export default App;