
import React, { useState } from 'react';
import { ChecklistItem } from '../types';

interface TroubleshootingChecklistProps {
  items: ChecklistItem[];
  onUpdate: (items: ChecklistItem[]) => void;
  onImportFromCauses: () => void;
}

export const TroubleshootingChecklist: React.FC<TroubleshootingChecklistProps> = ({
  items,
  onUpdate,
  onImportFromCauses
}) => {
  const [newItemText, setNewItemText] = useState('');

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    const newItem: ChecklistItem = {
      id: Math.random().toString(36).substr(2, 9),
      text: newItemText.trim(),
      completed: false
    };
    onUpdate([...items, newItem]);
    setNewItemText('');
  };

  const toggleItem = (id: string) => {
    onUpdate(items.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const removeItem = (id: string) => {
    onUpdate(items.filter(item => item.id !== id));
  };

  const completedCount = items.filter(i => i.completed).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm transition-colors">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <i className="fa-solid fa-list-check text-indigo-500"></i>
            Troubleshooting Checklist
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Prepare specific steps to verify and resolve identified causes.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={onImportFromCauses}
            className="text-[10px] font-bold uppercase tracking-widest px-3 py-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-100 transition-colors flex items-center gap-2"
          >
            <i className="fa-solid fa-rotate"></i>
            Sync with Active Focus
          </button>
        </div>
      </div>

      <div className="p-6">
        {items.length > 0 && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Progress: {completedCount}/{items.length}</span>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        <form onSubmit={addItem} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder="Add a troubleshooting step (e.g., Check belt tension)..."
              className="flex-1 p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:text-slate-200 outline-none"
            />
            <button 
              type="submit"
              className="bg-indigo-600 dark:bg-indigo-500 text-white px-4 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-400 transition-colors"
            >
              <i className="fa-solid fa-plus"></i>
            </button>
          </div>
        </form>

        {items.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-slate-50 dark:border-slate-800 rounded-xl">
            <p className="text-sm text-slate-400 dark:text-slate-500 italic">No tasks added yet. Add steps manually or import from your active focus causes.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(item => (
              <div 
                key={item.id} 
                className={`group flex items-center gap-4 p-3 rounded-lg border transition-all ${
                  item.completed 
                    ? 'bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 opacity-60' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-900 shadow-sm'
                }`}
              >
                <button 
                  onClick={() => toggleItem(item.id)}
                  className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                    item.completed 
                      ? 'bg-green-500 border-green-600 text-white' 
                      : 'border-slate-300 dark:border-slate-600 text-transparent hover:border-indigo-400'
                  }`}
                >
                  <i className="fa-solid fa-check text-[10px]"></i>
                </button>
                <span className={`flex-1 text-sm ${item.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300 font-medium'}`}>
                  {item.text}
                </span>
                <button 
                  onClick={() => removeItem(item.id)}
                  className="text-slate-300 dark:text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                >
                  <i className="fa-solid fa-trash-can text-xs"></i>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
