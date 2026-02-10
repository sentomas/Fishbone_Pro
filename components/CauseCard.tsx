
import React, { useState } from 'react';
import { Cause } from '../types';

interface CauseCardProps {
  cause: Cause;
  onDelete: (id: string) => void;
  onEdit: (newText: string) => void;
}

export const CauseCard: React.FC<CauseCardProps> = ({ cause, onDelete, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(cause.text);

  const handleDragStart = (e: React.DragEvent) => {
    if (isEditing) return;
    e.dataTransfer.setData('causeId', cause.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSave = () => {
    onEdit(editText);
    setIsEditing(false);
  };

  return (
    <div
      draggable={!isEditing}
      onDragStart={handleDragStart}
      className={`bg-white dark:bg-slate-800 border ${isEditing ? 'border-indigo-400 ring-2 ring-indigo-50 dark:ring-indigo-900/30' : 'border-slate-200 dark:border-slate-700'} rounded-lg p-3 mb-2 shadow-sm transition-all group relative ${!isEditing ? 'cursor-grab active:cursor-grabbing hover:border-indigo-300 dark:hover:border-indigo-600' : ''}`}
    >
      <div className="flex justify-between items-start gap-2">
        {isEditing ? (
          <div className="flex-1 flex flex-col gap-2">
            <textarea
              autoFocus
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full text-sm p-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-slate-100 rounded focus:outline-none focus:border-indigo-500 resize-none h-16"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSave();
                }
                if (e.key === 'Escape') setIsEditing(false);
              }}
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setIsEditing(false)}
                className="text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 uppercase"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 uppercase"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <>
            <span className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-tight">{cause.text}</span>
            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setIsEditing(true)}
                className="text-slate-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 p-1"
                title="Edit"
              >
                <i className="fa-solid fa-pen text-[10px]"></i>
              </button>
              <button
                onClick={() => onDelete(cause.id)}
                className="text-slate-400 dark:text-slate-500 hover:text-red-500 p-1"
                title="Delete"
              >
                <i className="fa-solid fa-xmark text-xs"></i>
              </button>
            </div>
          </>
        )}
      </div>
      {!isEditing && cause.category && (
        <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
          {cause.category}
        </div>
      )}
    </div>
  );
};
