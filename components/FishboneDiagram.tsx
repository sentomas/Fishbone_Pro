
import React, { useState } from 'react';
import { CategoryType, Cause } from '../types';

interface FishboneDiagramProps {
  problem: string;
  causes: Cause[];
  onDrop: (causeId: string, category: CategoryType) => void;
  onDeleteCause: (id: string) => void;
  onEditCause: (id: string, newText: string) => void;
  onToggleWorkingOn?: (id: string) => void;
  theme: 'light' | 'dark';
}

export const FishboneDiagram: React.FC<FishboneDiagramProps> = ({ 
  problem, causes, onDrop, onDeleteCause, onEditCause, onToggleWorkingOn, theme
}) => {
  const [activeDropZone, setActiveDropZone] = useState<CategoryType | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const categories = [
    { type: CategoryType.PEOPLE, x: 180, y: 80, anchor: 'top' },
    { type: CategoryType.METHODS, x: 440, y: 80, anchor: 'top' },
    { type: CategoryType.MACHINES, x: 700, y: 80, anchor: 'top' },
    { type: CategoryType.MATERIALS, x: 180, y: 570, anchor: 'bottom' },
    { type: CategoryType.MEASUREMENTS, x: 440, y: 570, anchor: 'bottom' },
    { type: CategoryType.ENVIRONMENT, x: 700, y: 570, anchor: 'bottom' },
  ];

  const handleDragOver = (e: React.DragEvent, category: CategoryType) => {
    e.preventDefault();
    setActiveDropZone(category);
  };

  const handleDragLeave = () => {
    setActiveDropZone(null);
  };

  const handleOnDrop = (e: React.DragEvent, category: CategoryType) => {
    e.preventDefault();
    const causeId = e.dataTransfer.getData('causeId');
    onDrop(causeId, category);
    setActiveDropZone(null);
  };

  const handleInternalDragStart = (e: React.DragEvent, causeId: string) => {
    if (editingId) return;
    e.dataTransfer.setData('causeId', causeId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const startEditing = (cause: Cause) => {
    setEditingId(cause.id);
    setEditText(cause.text);
  };

  const saveEdit = (id: string) => {
    onEditCause(id, editText);
    setEditingId(null);
  };

  const spineY = 325;
  const isDark = theme === 'dark';

  return (
    <div className="w-full h-full min-h-[650px] flex items-center justify-center bg-white dark:bg-slate-900/50 rounded-xl shadow-inner border border-slate-100 dark:border-slate-800 transition-colors duration-300 overflow-hidden p-4">
      <svg
        id="fishbone-svg"
        viewBox="0 0 1000 650"
        className="w-full h-auto max-w-5xl"
        style={{ filter: isDark ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' : 'drop-shadow(0 4px 6px rgba(0,0,0,0.03))' }}
      >
        <line x1="50" y1={spineY} x2="850" y2={spineY} stroke={isDark ? '#475569' : '#cbd5e1'} strokeWidth="4" />
        <polygon points={`850,${spineY - 15} 885,${spineY} 850,${spineY + 15}`} fill={isDark ? '#94a3b8' : '#64748b'} />

        <rect x="885" y={spineY - 45} width="110" height="90" rx="6" fill={isDark ? '#334155' : '#1e293b'} />
        <foreignObject x="895" y={spineY - 35} width="90" height="70">
          <div className="w-full h-full flex items-center justify-center text-center">
            <span className="text-white text-[10px] font-bold uppercase leading-tight">
              {problem || "Enter Problem Statement"}
            </span>
          </div>
        </foreignObject>

        {categories.map((cat) => {
          const isTop = cat.anchor === 'top';
          const isActive = activeDropZone === cat.type;
          
          return (
            <g key={cat.type}>
              <line
                x1={cat.x}
                y1={cat.y}
                x2={cat.x + 60}
                y2={spineY}
                stroke={isActive ? (isDark ? '#818cf8' : '#6366f1') : (isDark ? '#1e293b' : '#f1f5f9')}
                strokeWidth={isActive ? '8' : '5'}
                className="transition-all duration-300"
              />
              
              <rect
                x={cat.x - 50}
                y={isTop ? cat.y - 30 : cat.y - 200}
                width="180"
                height="230"
                fill="transparent"
                onDragOver={(e) => handleDragOver(e, cat.type)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleOnDrop(e, cat.type)}
                className="cursor-pointer"
              />

              <text
                x={cat.x}
                y={isTop ? cat.y - 15 : cat.y + 30}
                textAnchor="middle"
                className={`text-[11px] font-bold uppercase tracking-widest transition-colors duration-300 ${isActive ? (isDark ? 'fill-indigo-400' : 'fill-indigo-600') : (isDark ? 'fill-slate-500' : 'fill-slate-400')}`}
              >
                {cat.type}
              </text>

              <foreignObject
                x={cat.x - 80}
                y={isTop ? cat.y + 10 : cat.y - 210}
                width="160"
                height="200"
              >
                <div className={`flex flex-col gap-1.5 overflow-y-auto max-h-full p-2 scrollbar-hide ${isTop ? 'justify-start' : 'justify-end'}`}>
                  {causes
                    .filter((c) => c.category === cat.type)
                    .map((cause) => (
                      <div
                        key={cause.id}
                        draggable={editingId !== cause.id}
                        onDragStart={(e) => handleInternalDragStart(e, cause.id)}
                        className={`bg-white dark:bg-slate-800 border ${
                          editingId === cause.id 
                            ? 'border-indigo-400 ring-1 ring-indigo-200 dark:ring-indigo-900' 
                            : cause.isWorkingOn
                              ? 'border-amber-400 ring-1 ring-amber-100 dark:ring-amber-900/30'
                              : 'border-slate-200 dark:border-slate-700'
                        } rounded-md p-2 text-[10px] text-slate-700 dark:text-slate-300 leading-tight shadow-sm transition-all border-l-4 ${cause.isWorkingOn ? 'border-l-amber-500' : 'border-l-indigo-400 dark:border-l-indigo-600'} group relative ${editingId !== cause.id ? 'cursor-grab hover:bg-indigo-50 dark:hover:bg-slate-700' : ''}`}
                      >
                        {editingId === cause.id ? (
                          <div className="flex flex-col gap-1">
                            <textarea
                              autoFocus
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="w-full text-[10px] border-none focus:ring-0 p-0 h-10 resize-none bg-transparent dark:text-slate-200"
                            />
                            <div className="flex justify-end gap-1">
                              <button onClick={() => setEditingId(null)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 uppercase font-bold text-[8px]">X</button>
                              <button onClick={() => saveEdit(cause.id)} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 uppercase font-bold text-[8px]">OK</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {cause.text}
                            <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 no-print">
                              <button 
                                onClick={() => onToggleWorkingOn?.(cause.id)}
                                className={`rounded-full shadow-md w-5 h-5 flex items-center justify-center border transition-colors ${cause.isWorkingOn ? 'bg-amber-500 text-white border-amber-600' : 'bg-white dark:bg-slate-700 text-amber-500 border-amber-100 dark:border-slate-600 hover:bg-amber-50'}`}
                                title={cause.isWorkingOn ? "Stop Investigating" : "Mark as Investigation Focus"}
                              >
                                <i className="fa-solid fa-wrench text-[8px]"></i>
                              </button>
                              <button 
                                onClick={() => startEditing(cause)}
                                className="bg-white dark:bg-slate-700 rounded-full shadow-md text-indigo-500 w-5 h-5 flex items-center justify-center border border-indigo-100 dark:border-slate-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                              >
                                <i className="fa-solid fa-pen text-[8px]"></i>
                              </button>
                              <button 
                                onClick={() => onDeleteCause(cause.id)}
                                className="bg-white dark:bg-slate-700 rounded-full shadow-md text-red-500 w-5 h-5 flex items-center justify-center border border-red-100 dark:border-slate-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                              >
                                <i className="fa-solid fa-xmark text-[9px]"></i>
                              </button>
                            </div>
                            {cause.isWorkingOn && (
                              <div className="absolute -bottom-1 -right-1">
                                <span className="flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                </div>
              </foreignObject>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
