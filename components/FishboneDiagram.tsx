
import React, { useState } from 'react';
import { Cause, CategoryType } from '../types';

interface FishboneDiagramProps {
  problem: string;
  causes: Cause[];
  activeCategories?: string[];
  frameworkName?: string;
  onDrop: (causeId: string, category: string) => void;
  onDeleteCause: (id: string) => void;
  onEditCause: (id: string, newText: string) => void;
  onToggleWorkingOn?: (id: string) => void;
  onCopySummary?: () => void;
  theme?: 'light' | 'dark';
}

export const FishboneDiagram: React.FC<FishboneDiagramProps> = ({ 
  problem, 
  causes, 
  activeCategories = Object.values(CategoryType),
  frameworkName,
  onDrop, 
  onDeleteCause, 
  onEditCause, 
  onToggleWorkingOn, 
  onCopySummary,
  theme
}) => {
  const [activeDropZone, setActiveDropZone] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [diagramFontSize, setDiagramFontSize] = useState<number>(11); // Default 11px Poppins

  // Map activeCategories (expecting 6 items) to 3 top and 3 bottom positions
  const categoryPositions = [
    { type: activeCategories[0] || 'Category 1', x: 180, y: 80, anchor: 'top' },
    { type: activeCategories[1] || 'Category 2', x: 440, y: 80, anchor: 'top' },
    { type: activeCategories[2] || 'Category 3', x: 700, y: 80, anchor: 'top' },
    { type: activeCategories[3] || 'Category 4', x: 180, y: 570, anchor: 'bottom' },
    { type: activeCategories[4] || 'Category 5', x: 440, y: 570, anchor: 'bottom' },
    { type: activeCategories[5] || 'Category 6', x: 700, y: 570, anchor: 'bottom' },
  ];

  const handleDragOver = (e: React.DragEvent, category: string) => {
    e.preventDefault();
    setActiveDropZone(category);
  };

  const handleDragLeave = () => {
    setActiveDropZone(null);
  };

  const handleOnDrop = (e: React.DragEvent, category: string) => {
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
    <div className="w-full h-full min-h-[650px] flex flex-col items-center justify-center bg-white dark:bg-slate-900/50 rounded-xl shadow-inner border border-slate-100 dark:border-slate-800 transition-colors duration-300 overflow-hidden p-4 relative">
      <div className="no-print absolute top-3 left-4 flex items-center gap-2 flex-wrap z-10">
        {frameworkName && (
          <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-indigo-700 dark:text-indigo-300">
            <i className="fa-solid fa-layer-group text-xs"></i>
            <span>{frameworkName}</span>
          </div>
        )}

        {/* Font Size Option Control */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-full text-[11px] font-bold text-slate-700 dark:text-slate-300 shadow-sm">
          <i className="fa-solid fa-text-height text-indigo-500 text-xs"></i>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Font:</span>
          <button 
            type="button"
            onClick={() => setDiagramFontSize(prev => Math.max(8, prev - 1))}
            className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-black transition-colors"
            title="Decrease Diagram Font Size"
          >
            -
          </button>
          <select 
            value={diagramFontSize} 
            onChange={(e) => setDiagramFontSize(Number(e.target.value))}
            className="bg-transparent font-bold cursor-pointer outline-none text-xs text-indigo-600 dark:text-indigo-400 py-0"
          >
            <option value={9} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">9px (Compact)</option>
            <option value={10} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">10px (Small)</option>
            <option value={11} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">11px (Default - Poppins)</option>
            <option value={12} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">12px (Medium)</option>
            <option value={13} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">13px (Large)</option>
            <option value={14} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">14px (X-Large)</option>
            <option value={16} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">16px (2X-Large)</option>
          </select>
          <button 
            type="button"
            onClick={() => setDiagramFontSize(prev => Math.min(20, prev + 1))}
            className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-black transition-colors"
            title="Increase Diagram Font Size"
          >
            +
          </button>
        </div>
      </div>

      {onCopySummary && (
        <button
          onClick={onCopySummary}
          title="Copy Ishikawa diagram summary to clipboard"
          className="no-print absolute top-3 right-4 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 z-10"
        >
          <i className="fa-solid fa-copy"></i>
          <span>Copy to Clipboard</span>
        </button>
      )}

      <svg
        id="fishbone-svg"
        viewBox="0 0 1000 650"
        className="w-full h-auto max-w-5xl"
        style={{ 
          filter: isDark ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' : 'drop-shadow(0 4px 6px rgba(0,0,0,0.03))',
          fontFamily: "'Poppins', sans-serif"
        }}
      >
        {/* Main Spine Line */}
        <line x1="50" y1={spineY} x2="850" y2={spineY} stroke={isDark ? '#475569' : '#cbd5e1'} strokeWidth="4" />
        <polygon points={`850,${spineY - 15} 885,${spineY} 850,${spineY + 15}`} fill={isDark ? '#94a3b8' : '#64748b'} />

        {/* Dynamic Problem Head Box (Auto-adjusts width & height to content) */}
        {(() => {
          const probText = problem || "Enter Problem Statement";
          const problemBoxWidth = Math.min(160, Math.max(120, Math.floor(probText.length * 0.6) + diagramFontSize * 4));
          const problemBoxHeight = Math.min(130, Math.max(85, Math.floor(probText.length * 0.4) + diagramFontSize * 3));
          const problemBoxX = 865;
          const problemBoxY = spineY - problemBoxHeight / 2;

          return (
            <g className="transition-all duration-300">
              <rect 
                x={problemBoxX} 
                y={problemBoxY} 
                width={problemBoxWidth} 
                height={problemBoxHeight} 
                rx="10" 
                fill={isDark ? '#1e293b' : '#0f172a'} 
                stroke={isDark ? '#475569' : '#334155'}
                strokeWidth="2"
                className="shadow-md transition-all duration-300"
              />
              <foreignObject x={problemBoxX + 6} y={problemBoxY + 6} width={problemBoxWidth - 12} height={problemBoxHeight - 12}>
                <div className="w-full h-full flex items-center justify-center text-center p-1">
                  <span 
                    className="text-white font-extrabold uppercase leading-snug break-words"
                    style={{ fontFamily: "'Poppins', sans-serif", fontSize: `${Math.max(10, diagramFontSize)}px` }}
                  >
                    {probText}
                  </span>
                </div>
              </foreignObject>
            </g>
          );
        })()}

        {/* Categories & Cause Ribs */}
        {categoryPositions.map((cat) => {
          const isTop = cat.anchor === 'top';
          const isActive = activeDropZone === cat.type;
          const categoryCauses = causes.filter((c) => c.category === cat.type);
          
          // Auto-calculated category header badge dimensions
          const categoryBadgeWidth = Math.max(130, Math.min(180, cat.type.length * (diagramFontSize * 0.7) + 32));
          const categoryBadgeX = cat.x - categoryBadgeWidth / 2;
          const categoryBadgeY = isTop ? cat.y - 32 : cat.y + 8;
          const categoryBadgeHeight = Math.max(26, diagramFontSize + 14);

          // Auto-calculated cause container dimensions
          const containerWidth = Math.max(170, Math.min(220, 150 + diagramFontSize * 2.5));
          const containerX = isTop ? cat.x - containerWidth / 2 + 15 : cat.x - containerWidth / 2 - 10;
          const containerY = isTop ? cat.y + categoryBadgeHeight + 8 : cat.y - 225;
          const containerHeight = isTop ? spineY - (cat.y + categoryBadgeHeight + 15) : 225 - categoryBadgeHeight;

          return (
            <g key={cat.type}>
              {/* Rib Line connecting to spine */}
              <line
                x1={cat.x}
                y1={cat.y}
                x2={cat.x + 60}
                y2={spineY}
                stroke={isActive ? (isDark ? '#818cf8' : '#6366f1') : (isDark ? '#334155' : '#cbd5e1')}
                strokeWidth={isActive ? '7' : '4'}
                className="transition-all duration-300"
              />
              
              {/* Invisible Drop Zone Rect */}
              <rect
                x={cat.x - 60}
                y={isTop ? cat.y - 35 : cat.y - 210}
                width="200"
                height="240"
                fill="transparent"
                onDragOver={(e) => handleDragOver(e, cat.type)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleOnDrop(e, cat.type)}
                className="cursor-pointer"
              />

              {/* Auto-aligned Category Header Badge Box */}
              <rect
                x={categoryBadgeX}
                y={categoryBadgeY}
                width={categoryBadgeWidth}
                height={categoryBadgeHeight}
                rx="8"
                fill={isActive ? (isDark ? '#312e81' : '#e0e7ff') : (isDark ? '#1e293b' : '#f8fafc')}
                stroke={isActive ? (isDark ? '#818cf8' : '#4f46e5') : (isDark ? '#475569' : '#cbd5e1')}
                strokeWidth="1.5"
                className="transition-all duration-300 shadow-xs"
              />
              <text
                x={cat.x}
                y={categoryBadgeY + categoryBadgeHeight / 2 + (diagramFontSize * 0.35)}
                textAnchor="middle"
                style={{ fontFamily: "'Poppins', sans-serif", fontSize: `${Math.max(11, diagramFontSize + 1)}px` }}
                className={`font-black uppercase tracking-wider pointer-events-none transition-colors duration-300 ${
                  isActive 
                    ? (isDark ? 'fill-indigo-300' : 'fill-indigo-700') 
                    : (isDark ? 'fill-slate-200' : 'fill-slate-800')
                }`}
              >
                {cat.type}
              </text>

              {/* Dynamic Cause Cards Container */}
              <foreignObject
                x={containerX}
                y={containerY}
                width={containerWidth}
                height={containerHeight}
              >
                <div className={`flex flex-col gap-2 overflow-y-auto max-h-full p-1.5 scrollbar-hide ${isTop ? 'justify-start' : 'justify-end'}`}>
                  {categoryCauses.map((cause) => (
                    <div
                      key={cause.id}
                      draggable={editingId !== cause.id}
                      onDragStart={(e) => handleInternalDragStart(e, cause.id)}
                      className={`bg-white dark:bg-slate-800/95 border ${
                        editingId === cause.id 
                          ? 'border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-900/50' 
                          : cause.isWorkingOn
                            ? 'border-amber-400 ring-1 ring-amber-200 dark:ring-amber-900/40'
                            : 'border-slate-200 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-slate-600'
                      } rounded-lg p-2.5 text-slate-700 dark:text-slate-200 leading-snug shadow-xs transition-all border-l-4 ${
                        cause.isWorkingOn ? 'border-l-amber-500' : 'border-l-indigo-500 dark:border-l-indigo-400'
                      } group relative break-words whitespace-pre-wrap ${editingId !== cause.id ? 'cursor-grab hover:bg-indigo-50/70 dark:hover:bg-slate-700/80' : ''}`}
                      style={{ fontFamily: "'Poppins', sans-serif", fontSize: `${diagramFontSize}px` }}
                    >
                      {editingId === cause.id ? (
                        <div className="flex flex-col gap-1.5">
                          <textarea
                            autoFocus
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            style={{ fontFamily: "'Poppins', sans-serif", fontSize: `${diagramFontSize}px` }}
                            className="w-full border border-slate-200 dark:border-slate-700 rounded-md focus:ring-1 focus:ring-indigo-500 p-1.5 h-12 resize-none bg-white dark:bg-slate-900 dark:text-slate-200"
                          />
                          <div className="flex justify-end gap-1.5">
                            <button onClick={() => setEditingId(null)} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded text-[9px] font-bold uppercase">Cancel</button>
                            <button onClick={() => saveEdit(cause.id)} className="px-2 py-0.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded text-[9px] font-bold uppercase">Save</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="pr-2">{cause.text}</div>
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

                  {categoryCauses.length === 0 && (
                    <div className="w-full py-2.5 px-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-center flex items-center justify-center gap-1.5 text-slate-400 dark:text-slate-600 text-[10px] font-bold">
                      <i className="fa-solid fa-plus text-[9px]"></i>
                      <span>Drop cause here</span>
                    </div>
                  )}
                </div>
              </foreignObject>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

