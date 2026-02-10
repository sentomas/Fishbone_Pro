
import React from 'react';

interface FiveWhysAnalysisProps {
  whys: string[];
  onChange: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  problem: string;
}

export const FiveWhysAnalysis: React.FC<FiveWhysAnalysisProps> = ({ 
  whys, onChange, onAdd, onRemove, problem 
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto py-8">
      <div className="flex flex-col gap-6 relative">
        {/* Connection Line */}
        <div className="absolute left-[2.45rem] top-10 bottom-10 w-0.5 bg-slate-200 dark:bg-slate-800 z-0"></div>

        {/* Starting Problem */}
        <div className="flex items-center gap-6 z-10">
          <div className="w-20 h-20 rounded-2xl bg-slate-900 dark:bg-slate-800 flex items-center justify-center text-white dark:text-slate-100 shrink-0 shadow-lg border-4 border-white dark:border-slate-700">
            <i className="fa-solid fa-circle-exclamation text-2xl"></i>
          </div>
          <div className="flex-1 p-4 bg-slate-800 dark:bg-slate-900 text-white dark:text-slate-200 rounded-xl shadow-md border border-slate-700 dark:border-slate-800">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Problem Statement</p>
            <p className="text-sm font-medium">{problem || "Define your problem in the sidebar..."}</p>
          </div>
        </div>

        {/* Dynamic Whys Steps */}
        {whys.map((why, idx) => (
          <div 
            key={idx} 
            className="flex items-center gap-6 z-10 group relative" 
            style={{ marginLeft: `${Math.min(idx * 1.5, 6)}rem` }} // Cap indentation for very long chains
          >
            <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center text-white shrink-0 shadow-lg border-4 border-white dark:border-slate-700 transition-all duration-300 ${why ? 'bg-indigo-600 dark:bg-indigo-500 scale-100' : 'bg-slate-200 dark:bg-slate-800 scale-90 group-focus-within:bg-indigo-400 dark:group-focus-within:bg-indigo-600 group-focus-within:scale-100'}`}>
              <span className="text-[10px] uppercase font-bold tracking-tighter opacity-70">Level</span>
              <span className="text-xl font-bold italic leading-none">{idx + 1}</span>
            </div>
            
            <div className={`flex-1 p-5 rounded-xl transition-all duration-300 border-2 relative group-hover:shadow-md ${why ? 'bg-white dark:bg-slate-900 border-indigo-100 dark:border-indigo-900 shadow-sm' : 'bg-white/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800'}`}>
              <textarea
                value={why}
                onChange={(e) => onChange(idx, e.target.value)}
                placeholder={`Why did this happen?`}
                className="w-full bg-transparent border-none text-slate-700 dark:text-slate-200 text-sm focus:ring-0 outline-none resize-none h-12 placeholder:text-slate-300 dark:placeholder:text-slate-700 font-medium leading-relaxed"
              />
              {whys.length > 1 && (
                <button 
                  onClick={() => onRemove(idx)}
                  className="absolute -right-3 -top-3 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-red-500 hover:border-red-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  title="Remove this level"
                >
                  <i className="fa-solid fa-xmark text-[10px]"></i>
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Add Step Button */}
        <div className="flex justify-center mt-2 z-10" style={{ marginLeft: `${Math.min(whys.length * 1.5, 6)}rem` }}>
          <button 
            onClick={onAdd}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-500 dark:hover:text-indigo-400 rounded-xl transition-all text-xs font-bold uppercase tracking-widest group"
          >
            <i className="fa-solid fa-plus group-hover:scale-125 transition-transform"></i>
            Add Level
          </button>
        </div>

        {/* Root Cause Conclusion */}
        <div className={`flex items-center gap-6 z-10 mt-4 transition-all duration-500 ${whys[whys.length - 1] ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-2'}`} style={{ marginLeft: `${Math.min((whys.length + 1) * 1.5, 7.5)}rem` }}>
          <div className="w-20 h-20 rounded-full bg-green-500 dark:bg-green-600 flex items-center justify-center text-white shrink-0 shadow-lg border-4 border-white dark:border-slate-700">
            <i className="fa-solid fa-check text-2xl"></i>
          </div>
          <div className="flex-1 p-5 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-100 dark:border-green-900/30 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-green-600 dark:text-green-500 mb-1">Current Root Cause Hypothesis</p>
            <p className="text-sm font-semibold text-green-800 dark:text-green-200 italic">
              {whys[whys.length - 1] ? whys[whys.length - 1] : "The last 'Why' answer represents your potential root cause."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
