
import React, { useMemo, useState } from 'react';
import { Venue, PricingCategory, PricingItem, ProgressStep, Task } from '../types';
import { Icon } from './Icons';
import { StarRating } from './StarRating';

interface VenueDetailProps {
  venue: Venue;
  onClose: () => void;
  onEdit: (venue: Venue) => void;
  onDelete: (id: string) => void;
  onVenueUpdate: (venue: Venue) => void;
}

const calculateCosts = (venue: Venue) => {
    let totalCost = 0;

    if (venue.pricingCategories) {
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
    }
    
    const costPerGuest = venue.guestCount > 0 ? totalCost / venue.guestCount : 0;
    
    return { grandTotal: totalCost, costPerGuest };
};

export const VenueDetail: React.FC<VenueDetailProps> = ({ venue, onClose, onEdit, onDelete, onVenueUpdate }) => {
  const costs = useMemo(() => calculateCosts(venue), [venue]);

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onVenueUpdate({ ...venue, [name]: parseFloat(value) || 0 });
  };
  
  const handlePricingToggle = (categoryId: string, itemId: string) => {
    const updatedCategories = venue.pricingCategories.map(cat => {
        if (cat.id === categoryId) {
            let updatedItems;
            if (cat.selectionType === 'single') {
                updatedItems = cat.items.map(item => 
                    item.id === itemId ? { ...item, isIncluded: true } : { ...item, isIncluded: false }
                );
            } else {
                 updatedItems = cat.items.map(item => 
                    item.id === itemId ? { ...item, isIncluded: !item.isIncluded } : item
                );
            }
            return { ...cat, items: updatedItems };
        }
        return cat;
    });
    onVenueUpdate({ ...venue, pricingCategories: updatedCategories });
  };

   const handleProgressToggle = (stepId: string) => {
    const updatedProgress = venue.progress.map(step => {
        if (step.id === stepId) {
            const isNowCompleted = !step.completed;
            return {
                ...step,
                completed: isNowCompleted,
                date: isNowCompleted ? new Date().toLocaleDateString('en-CA') : null // YYYY-MM-DD format
            };
        }
        return step;
    });
    onVenueUpdate({ ...venue, progress: updatedProgress });
  };

  return (
    <div className="bg-white p-8 rounded-l-xl shadow-lg relative h-full overflow-y-auto">
      <button onClick={onClose} className="absolute top-6 right-6 text-stone-400 hover:text-stone-600">
        <Icon name="x" className="w-6 h-6" />
      </button>

      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-4xl font-bold text-stone-800">{venue.name}</h2>
          <p className="text-stone-500 mt-1">{venue.location}</p>
          {venue.url && (
            <a 
              href={venue.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-rose-500 hover:text-rose-600 inline-flex items-center gap-1 mt-2 text-sm font-semibold group"
            >
                Visit Website
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onEdit(venue)} className="p-2 text-stone-500 hover:text-rose-500 hover:bg-rose-100 rounded-full transition-colors"><Icon name="edit" className="w-5 h-5"/></button>
          <button onClick={() => onDelete(venue.id)} className="p-2 text-stone-500 hover:text-red-500 hover:bg-red-100 rounded-full transition-colors"><Icon name="trash" className="w-5 h-5"/></button>
        </div>
      </div>
      
      <div className="flex items-center gap-4 mb-6">
        <StarRating rating={venue.rating} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
            <DetailSection title="Guest Count">
                <div>
                    <input type="number" name="guestCount" value={venue.guestCount} onChange={handleFieldChange} placeholder="Enter guest count" className="w-full p-2 border border-stone-300 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500" />
                </div>
            </DetailSection>

            {venue.pricingCategories.map(category => (
                <DetailSection key={category.id} title={category.name}>
                    <PricingCategoryDetail category={category} onToggle={handlePricingToggle} />
                </DetailSection>
            ))}

            <DetailSection title="Progress Tracker">
              <ProgressTracker progress={venue.progress || []} onToggle={handleProgressToggle} />
            </DetailSection>
        </div>

        <div className="space-y-6">
            <DetailSection title="Cost Summary">
              <div className="bg-rose-50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between font-bold text-2xl text-rose-800"><span>Total Cost</span><span>{costs.grandTotal.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                <hr className="border-rose-100" />
                <div className="text-center pt-2 text-rose-600">
                    <span className="font-semibold text-lg">{costs.costPerGuest.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <span className="text-sm"> per guest</span>
                </div>
              </div>
            </DetailSection>

            <DetailSection title="Available Dates">
              {venue.availableDates.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {venue.availableDates.map(date => (
                    <span key={date} className="bg-stone-100 text-stone-700 text-sm px-3 py-1 rounded-md">{date}</span>
                  ))}
                </div>
              ) : <p className="text-stone-500">No dates listed.</p>}
            </DetailSection>

            <DetailSection title="Notes">
              <p className="text-stone-600 whitespace-pre-wrap text-sm">{venue.notes || 'No notes added.'}</p>
            </DetailSection>

            <DetailSection title="Tasks">
              <TaskManager tasks={venue.tasks || []} onVenueUpdate={onVenueUpdate} venue={venue} />
            </DetailSection>
            
            <DetailSection title="Updates">
              <UpdatesManager updates={venue.updates || []} onVenueUpdate={onVenueUpdate} venue={venue} />
            </DetailSection>
        </div>
      </div>
    </div>
  );
};

interface PricingCategoryDetailProps {
    category: PricingCategory;
    onToggle: (categoryId: string, itemId: string) => void;
}

const PricingCategoryDetail: React.FC<PricingCategoryDetailProps> = ({ category, onToggle }) => {
    const inputType = category.selectionType === 'single' ? 'radio' : 'checkbox';
    
    if (category.items.length === 0) {
        return <p className="text-stone-500 text-sm">No items added for this category.</p>;
    }

    return (
        <div className="space-y-2">
        {category.items.map(item => (
          <label key={item.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg hover:bg-stone-100 cursor-pointer">
            <div className="flex items-center">
              <input 
                type={inputType} 
                name={`category-${category.id}`}
                checked={item.isIncluded} 
                onChange={() => onToggle(category.id, item.id)} 
                className={`h-4 w-4 border-stone-300 text-rose-500 focus:ring-rose-500 ${inputType === 'radio' ? 'rounded-full' : 'rounded'}`}
              />
              <span className="ml-3 text-stone-700">{item.name}</span>
            </div>
            <div className="text-right">
                <span className="font-medium text-stone-800">{item.cost.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                {item.costType === 'per_guest' && <span className="text-xs text-stone-500 block">per guest</span>}
            </div>
          </label>
        ))}
      </div>
    );
};


interface DetailSectionProps {
    title: string;
    children: React.ReactNode;
}

const DetailSection: React.FC<DetailSectionProps> = ({ title, children }) => (
    <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-3">{title}</h3>
        {children}
    </div>
);

// --- New Components for Tracking ---

interface ProgressTrackerProps {
    progress: ProgressStep[];
    onToggle: (stepId: string) => void;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ progress, onToggle }) => {
    return (
        <div className="space-y-2">
            {progress.map(step => (
                <label key={step.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg hover:bg-stone-100 cursor-pointer">
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            checked={step.completed}
                            onChange={() => onToggle(step.id)}
                            className="h-4 w-4 border-stone-300 text-rose-500 focus:ring-rose-500 rounded"
                        />
                        <span className={`ml-3 text-stone-700 ${step.completed ? 'line-through text-stone-400' : ''}`}>{step.name}</span>
                    </div>
                    {step.completed && step.date && (
                        <span className="text-xs text-stone-500">{step.date}</span>
                    )}
                </label>
            ))}
        </div>
    );
};

interface TaskManagerProps {
    tasks: Task[];
    venue: Venue;
    onVenueUpdate: (venue: Venue) => void;
}

const TaskManager: React.FC<TaskManagerProps> = ({ tasks, venue, onVenueUpdate }) => {
    const [newTask, setNewTask] = useState({ name: '', assignedTo: '', dueDate: '' });

    const handleAddTask = () => {
        if (!newTask.name) return;
        const taskToAdd: Task = {
            id: Date.now().toString(),
            ...newTask,
            isCompleted: false
        };
        onVenueUpdate({ ...venue, tasks: [...venue.tasks, taskToAdd] });
        setNewTask({ name: '', assignedTo: '', dueDate: '' });
    };

    const handleToggleTask = (taskId: string) => {
        const updatedTasks = venue.tasks.map(task => 
            task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
        );
        onVenueUpdate({ ...venue, tasks: updatedTasks });
    };

    const handleRemoveTask = (taskId: string) => {
        const updatedTasks = venue.tasks.filter(task => task.id !== taskId);
        onVenueUpdate({ ...venue, tasks: updatedTasks });
    };
    
    return (
        <div className="space-y-3">
            {tasks.map(task => (
                <div key={task.id} className={`p-2 rounded-md flex items-start gap-3 ${task.isCompleted ? 'bg-green-50' : 'bg-stone-50'}`}>
                    <input
                        type="checkbox"
                        checked={task.isCompleted}
                        onChange={() => handleToggleTask(task.id)}
                        className="h-4 w-4 border-stone-300 text-rose-500 focus:ring-rose-500 rounded mt-1 shrink-0"
                    />
                    <div className="flex-1">
                        <p className={`text-stone-800 text-sm ${task.isCompleted ? 'line-through text-stone-500' : ''}`}>{task.name}</p>
                        {(task.assignedTo || task.dueDate) && (
                            <p className="text-xs text-stone-500">
                                {task.assignedTo && <span>Assigned to: {task.assignedTo}</span>}
                                {task.assignedTo && task.dueDate && <span className="mx-1">|</span>}
                                {task.dueDate && <span>Due: {task.dueDate}</span>}
                            </p>
                        )}
                    </div>
                    <button onClick={() => handleRemoveTask(task.id)} className="text-stone-400 hover:text-red-500 p-1">
                        <Icon name="trash" className="w-4 h-4" />
                    </button>
                </div>
            ))}
            {tasks.length === 0 && <p className="text-sm text-stone-500 italic">No tasks yet.</p>}
            
            <div className="pt-4 border-t border-stone-200 space-y-2">
                <h4 className="text-sm font-semibold text-stone-600">Add a new task</h4>
                <input
                    type="text"
                    placeholder="Task description"
                    value={newTask.name}
                    onChange={e => setNewTask({ ...newTask, name: e.target.value })}
                    className="w-full p-2 text-sm border border-stone-300 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500"
                />
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Assigned to"
                        value={newTask.assignedTo}
                        onChange={e => setNewTask({ ...newTask, assignedTo: e.target.value })}
                        className="w-1/2 p-2 text-sm border border-stone-300 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500"
                    />
                    <input
                        type="date"
                        placeholder="Due date"
                        value={newTask.dueDate}
                        onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                        className="w-1/2 p-2 text-sm border border-stone-300 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500"
                    />
                </div>
                <button
                    onClick={handleAddTask}
                    className="w-full text-sm bg-rose-500 text-white font-semibold py-2 px-3 rounded-lg hover:bg-rose-600 transition-colors"
                >
                    Add Task
                </button>
            </div>
        </div>
    );
};

interface UpdatesManagerProps {
    updates: string[];
    venue: Venue;
    onVenueUpdate: (venue: Venue) => void;
}

const UpdatesManager: React.FC<UpdatesManagerProps> = ({ updates, venue, onVenueUpdate }) => {
    const [newUpdate, setNewUpdate] = useState('');

    const handleAddUpdate = () => {
        if (!newUpdate.trim()) return;
        const date = new Date().toLocaleString();
        const fullUpdate = `${date}: ${newUpdate}`;
        onVenueUpdate({ ...venue, updates: [fullUpdate, ...venue.updates] });
        setNewUpdate('');
    };
    
    return (
        <div className="space-y-3">
             <div className="space-y-2">
                <textarea
                    rows={2}
                    placeholder="Add an update or note..."
                    value={newUpdate}
                    onChange={e => setNewUpdate(e.target.value)}
                    className="w-full p-2 text-sm border border-stone-300 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500"
                />
                <button
                    onClick={handleAddUpdate}
                    className="w-full text-sm bg-stone-600 text-white font-semibold py-2 px-3 rounded-lg hover:bg-stone-700 transition-colors"
                >
                    Add Update
                </button>
            </div>

            <div className="pt-4 border-t border-stone-200 space-y-2 max-h-48 overflow-y-auto">
                {updates.map((update, index) => (
                    <div key={index} className="p-2 bg-stone-50 rounded-md text-sm text-stone-700 whitespace-pre-wrap">
                        {update}
                    </div>
                ))}
                {updates.length === 0 && <p className="text-sm text-stone-500 italic">No updates yet.</p>}
            </div>
        </div>
    );
};