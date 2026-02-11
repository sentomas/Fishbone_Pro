
import React, { useState } from 'react';
import { DelayStep } from '../types';

interface DelayPathAnalysisProps {
  steps: DelayStep[];
  onUpdate: (steps: DelayStep[]) => void;
  problem: string;
}

export const DelayPathAnalysis: React.FC<DelayPathAnalysisProps> = ({ steps, onUpdate, problem }) => {
  const [newLabel, setNewLabel] = useState('');
  const [newDuration, setNewDuration] = useState<number>(0);
  const [newUnit, setNewUnit] = useState('mins');

  const addStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    const newStep: DelayStep = {
      id: Math.random().toString(36).substr(2, 9),
      label: newLabel.trim(),
      duration: newDuration,
      unit: newUnit,
      description: ''
    };
    onUpdate([...steps, newStep]);
    setNewLabel('');
    setNewDuration(0);
  };

  const removeStep = (id: string) => {
    onUpdate(steps.filter(s => s.id !== id));
  };

  const totalTime = steps.reduce((acc, curr) => acc + curr.duration, 0);

  return (
    <div className="w-full max-w-5xl mx-auto py-12 px-4 relative">
      <div className="relative">
        {/* Central Connection Line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800 -translate-x-1/2 z-0 timeline-spine"></div>

        {/* Start Point - Always Centered */}
        <div className="flex flex-col items-center mb-16 relative z-10 timeline-step">
          <div className="w-12 h-12 rounded-full bg-slate-900 dark:bg-slate-800 flex items-center justify-center text-white shadow-xl border-4 border-white dark:border-slate-700 timeline-dot">
            <i className="fa-solid fa-flag-checkered"></i>
          </div>
          <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 text-center max-w-sm shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Incident Onset</p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-2">{problem || "Define problem statement..."}</p>
          </div>
        </div>

        {/* Dynamic Timeline Steps (Alternating) */}
        <div className="space-y-12">
          {steps.map((step, idx) => {
            const isEven = idx % 2 === 0;
            return (
              <div key={step.id} className={`flex items-center w-full timeline-step ${isEven ? 'flex-row' : 'flex-row-reverse'}`}>
                {/* Step Content */}
                <div className={`w-1/2 flex ${isEven ? 'justify-end pr-12' : 'justify-start pl-12'} timeline-content-wrapper ${isEven ? 'timeline-left' : 'timeline-right'}`}>
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg group relative hover:shadow-xl transition-all max-w-md w-full">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                           <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Stage {idx + 1}</span>
                        </div>
                        <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-snug">{step.label}</h4>
                        <div className="mt-4 flex items-center gap-3">
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[11px] font-black uppercase tracking-wider">
                            <i className="fa-solid fa-clock-rotate-left"></i>
                            {step.duration} {step.unit}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeStep(step.id)}
                        className="no-print p-2 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <i className="fa-solid fa-trash-can text-sm"></i>
                      </button>
                    </div>
                    {/* Connector line to center */}
                    <div className={`absolute top-1/2 -translate-y-1/2 w-12 h-px bg-slate-200 dark:bg-slate-700 hidden md:block ${isEven ? '-right-12' : '-left-12'}`}></div>
                  </div>
                </div>

                {/* Center Node */}
                <div className="absolute left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-orange-400 flex items-center justify-center text-white shadow-lg border-4 border-white dark:border-slate-700 z-10 timeline-dot">
                  <span className="text-[10px] font-black">{idx + 1}</span>
                </div>

                {/* Spacer for the other side */}
                <div className="w-1/2"></div>
              </div>
            );
          })}
        </div>

        {/* Add Step Form - Centered and Styled as an Interactive Node */}
        <div className="mt-16 flex flex-col items-center z-10 no-print timeline-step">
          <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 mb-6 shadow-inner timeline-dot">
            <i className="fa-solid fa-plus text-xs"></i>
          </div>
          <form onSubmit={addStep} className="w-full max-w-2xl p-6 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[240px]">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Event Label</label>
              <input 
                type="text" 
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. Technical handover delayed"
                className="w-full text-sm p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-400 transition-all"
              />
            </div>
            <div className="w-28">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Value</label>
              <input 
                type="number" 
                value={newDuration}
                onChange={(e) => setNewDuration(Number(e.target.value))}
                className="w-full text-sm p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
              />
            </div>
            <div className="w-24">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Unit</label>
              <select 
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                className="w-full text-sm p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none cursor-pointer"
              >
                <option value="mins">Mins</option>
                <option value="hrs">Hrs</option>
                <option value="days">Days</option>
              </select>
            </div>
            <button 
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 h-[46px] rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-orange-500/20"
            >
              Add Node
            </button>
          </form>
        </div>

        {/* End Summary - Always Centered */}
        <div className="mt-16 flex flex-col items-center z-10 timeline-step">
          <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center text-white shadow-2xl border-4 border-white dark:border-slate-700 timeline-dot">
            <i className="fa-solid fa-hourglass-end text-lg"></i>
          </div>
          <div className="mt-6 p-6 bg-green-50 dark:bg-green-950/40 rounded-3xl border border-green-100 dark:border-green-900/40 text-center shadow-md max-w-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-green-600 dark:text-green-500 mb-2">Accumulated System Latency</p>
            <p className="text-3xl font-black text-green-900 dark:text-green-100">{totalTime} <span className="text-sm font-bold opacity-60">Total Units</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};
