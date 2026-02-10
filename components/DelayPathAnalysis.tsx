
import React from 'react';
import { DelayStep } from '../types';

interface DelayPathAnalysisProps {
  steps: DelayStep[];
  onUpdate: (steps: DelayStep[]) => void;
  problem: string;
}

export const DelayPathAnalysis: React.FC<DelayPathAnalysisProps> = ({ steps, onUpdate, problem }) => {
  const addStep = () => {
    const newStep: DelayStep = {
      id: Math.random().toString(36).substr(2, 9),
      description: '',
      duration: 0,
      unit: 'hours'
    };
    onUpdate([...steps, newStep]);
  };

  const removeStep = (id: string) => {
    onUpdate(steps.filter(s => s.id !== id));
  };

  const updateStep = (id: string, updates: Partial<DelayStep>) => {
    onUpdate(steps.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSteps.length) return;
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    onUpdate(newSteps);
  };

  const calculateTotalInHours = () => {
    return steps.reduce((acc, step) => {
      let h = step.duration;
      if (step.unit === 'mins') h = step.duration / 60;
      if (step.unit === 'days') h = step.duration * 24;
      return acc + h;
    }, 0);
  };

  const totalHours = calculateTotalInHours();
  const formatTotal = () => {
    if (totalHours >= 24) return `${(totalHours / 24).toFixed(1)} Days`;
    return `${totalHours.toFixed(1)} Hours`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-4">
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm print:border-none print:shadow-none">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <i className="fa-solid fa-clock-rotate-left text-orange-500"></i>
            Time Delay Pathway
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Quantifying the latency between failure and resolution.</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-950/30 px-6 py-4 rounded-xl border border-orange-100 dark:border-orange-900/40 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400 mb-1">Total Accumulated Delay</p>
          <p className="text-3xl font-black text-orange-700 dark:text-orange-300">{formatTotal()}</p>
        </div>
      </div>

      <div className="relative">
        {/* Timeline Spine */}
        {steps.length > 0 && (
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-400 to-amber-200 dark:from-orange-600 dark:to-slate-800 transform -translate-x-1/2 rounded-full hidden md:block"></div>
        )}

        <div className="space-y-12">
          {steps.map((step, index) => (
            <div 
              key={step.id} 
              className={`flex flex-col md:flex-row items-center gap-8 relative ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
            >
              {/* Step Number Badge */}
              <div className="absolute left-8 md:left-1/2 w-10 h-10 rounded-full bg-white dark:bg-slate-900 border-4 border-orange-500 dark:border-orange-600 transform -translate-x-1/2 z-10 flex items-center justify-center text-sm font-black shadow-md">
                {index + 1}
              </div>

              <div className="w-full md:w-[45%]">
                <div className="bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm hover:border-orange-300 dark:hover:border-orange-800 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Event Description</span>
                    <div className="flex gap-1 no-print opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => moveStep(index, 'up')} disabled={index === 0} className="w-6 h-6 rounded bg-slate-50 dark:bg-slate-700 hover:bg-slate-200 text-slate-400 disabled:opacity-30"><i className="fa-solid fa-chevron-up text-[10px]"></i></button>
                      <button onClick={() => moveStep(index, 'down')} disabled={index === steps.length - 1} className="w-6 h-6 rounded bg-slate-50 dark:bg-slate-700 hover:bg-slate-200 text-slate-400 disabled:opacity-30"><i className="fa-solid fa-chevron-down text-[10px]"></i></button>
                      <button onClick={() => removeStep(step.id)} className="w-6 h-6 rounded bg-red-50 dark:bg-red-900/30 hover:bg-red-100 text-red-400"><i className="fa-solid fa-trash text-[10px]"></i></button>
                    </div>
                  </div>
                  
                  <textarea
                    value={step.description}
                    onChange={(e) => updateStep(step.id, { description: e.target.value })}
                    placeholder="e.g. Waiting for spare parts delivery..."
                    className="w-full bg-transparent border-none text-slate-700 dark:text-slate-200 font-medium text-sm focus:ring-0 resize-none h-16 scrollbar-hide"
                  />
                  
                  <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={step.duration || ''}
                        onChange={(e) => updateStep(step.id, { duration: parseFloat(e.target.value) || 0 })}
                        className="w-16 p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-center font-bold text-orange-600 dark:text-orange-400 focus:ring-1 focus:ring-orange-500 outline-none"
                      />
                      <select
                        value={step.unit}
                        onChange={(e) => updateStep(step.id, { unit: e.target.value as any })}
                        className="bg-transparent text-xs font-bold text-slate-500 dark:text-slate-400 uppercase outline-none cursor-pointer"
                      >
                        <option value="mins">Mins</option>
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                      </select>
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-600">
                      PATH POINT #{index + 1}
                    </div>
                  </div>
                </div>
              </div>

              {/* Empty space for the other side of the timeline */}
              <div className="hidden md:block md:w-[45%]"></div>
            </div>
          ))}
        </div>

        <div className="mt-16 flex justify-center no-print">
          <button 
            onClick={addStep}
            className="flex items-center gap-3 px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl shadow-lg shadow-orange-200 dark:shadow-none transition-all font-bold uppercase tracking-widest active:scale-95"
          >
            <i className="fa-solid fa-plus"></i>
            Add Delay Point
          </button>
        </div>
      </div>
    </div>
  );
};
