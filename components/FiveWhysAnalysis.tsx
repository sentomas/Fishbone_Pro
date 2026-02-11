
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
    <div className="w-full max-w-4xl mx-auto py-8">
      <div className="flex flex-col gap-6 relative">
        {/* Connection Line */}
        <div className="absolute left-[2.45rem] top-10 bottom-10 w-0.5 bg-slate-200 dark:bg-slate-800 z-0"></div>

        {/* Starting Problem / Target Statement */}
        <div className="flex items-center gap-6 z-10">
          <div className="w-20 h-20 rounded-2xl bg-slate-900 dark:bg-slate-800 flex flex-col items-center justify-center text-white dark:text-slate-100 shrink-0 shadow-lg border-4 border-white dark:border-slate-700">
            <i className="fa-solid fa-crosshairs text-2xl mb-1"></i>
            <span className="text-[8px] font-bold uppercase tracking-tighter opacity-60">Problem</span>
          </div>
          <div className="flex-1 p-5 bg-slate-800 dark:bg-slate-900 text-white dark:text-slate-200 rounded-xl shadow-md border border-slate-700 dark:border-slate-800">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 dark:text-indigo-400 mb-2">Primary Incident Statement</h4>
            <p className="text-base font-semibold leading-snug">{problem || "Please define the problem statement in the left sidebar."}</p>
          </div>
        </div>

        {/* Hierarchical Drill-down Steps */}
        {whys.map((why, idx) => (
          <div 
            key={idx} 
            className="flex items-center gap-6 z-10 group relative transition-all duration-300" 
            style={{ marginLeft: `${Math.min(idx * 3, 12)}rem` }}
          >
            {/* The "Why" Bubble */}
            <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center text-white shrink-0 shadow-lg border-4 border-white dark:border-slate-700 transition-all duration-300 ${why ? 'bg-indigo-600 dark:bg-indigo-500 scale-100' : 'bg-slate-200 dark:bg-slate-800 scale-95 group-focus-within:bg-indigo-400 dark:group-focus-within:bg-indigo-600 group-focus-within:scale-100'}`}>
              <span className="text-[9px] uppercase font-bold tracking-tighter opacity-70">Level</span>
              <span className="text-2xl font-black italic leading-none">{idx + 1}</span>
            </div>
            
            <div className={`flex-1 p-5 rounded-xl transition-all duration-300 border-2 relative group-hover:shadow-md ${why ? 'bg-white dark:bg-slate-900 border-indigo-100 dark:border-indigo-900 shadow-sm' : 'bg-white/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800'}`}>
              <div className="flex items-center gap-2 mb-2">
                 <i className="fa-solid fa-arrow-down-long text-indigo-400 text-xs"></i>
                 <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Inquiry Branch</span>
              </div>
              <textarea
                value={why}
                onChange={(e) => onChange(idx, e.target.value)}
                placeholder={`Why did Level ${idx > 0 ? idx : 'Problem'} happen? Describe the direct cause.`}
                className="w-full bg-transparent border-none text-slate-700 dark:text-slate-200 text-sm focus:ring-0 outline-none resize-none h-14 placeholder:text-slate-300 dark:placeholder:text-slate-700 font-medium leading-relaxed"
              />
              
              <div className="no-print absolute -right-3 -top-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {whys.length > 1 && (
                  <button 
                    onClick={() => onRemove(idx)}
                    className="w-7 h-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-red-500 hover:border-red-200 shadow-sm flex items-center justify-center rounded-lg"
                    title="Remove this branch"
                  >
                    <i className="fa-solid fa-trash-can text-[10px]"></i>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Interactive Control: Add Level */}
        <div className="no-print flex justify-start mt-2 z-10" style={{ marginLeft: `${Math.min(whys.length * 3, 12)}rem` }}>
          <button 
            onClick={onAdd}
            className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all text-[11px] font-bold uppercase tracking-widest group shadow-sm hover:shadow-md"
          >
            <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 transition-colors">
              <i className="fa-solid fa-plus text-[10px]"></i>
            </div>
            Drill Down Further
          </button>
        </div>

        {/* Conclusion / Identified Root Cause */}
        <div 
          className={`flex items-center gap-6 z-10 mt-8 transition-all duration-700 ${whys[whys.length - 1] ? 'opacity-100 translate-y-0 scale-100' : 'opacity-30 translate-y-4 scale-95'}`} 
          style={{ marginLeft: `${Math.min((whys.length + 0.5) * 3, 13.5)}rem` }}
        >
          <div className="w-24 h-24 rounded-full bg-green-500 dark:bg-green-600 flex flex-col items-center justify-center text-white shrink-0 shadow-xl border-4 border-white dark:border-slate-700">
            <i className="fa-solid fa-lightbulb text-3xl mb-1"></i>
            <span className="text-[8px] font-bold uppercase tracking-tighter">Root Cause</span>
          </div>
          <div className="flex-1 p-6 bg-green-50 dark:bg-green-900/20 rounded-2xl border-2 border-green-200 dark:border-green-800 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10">
               <i className="fa-solid fa-certificate text-5xl"></i>
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-green-600 dark:text-green-500 mb-2">Final Hypothesis Result</h4>
            <p className="text-base font-bold text-green-900 dark:text-green-100 italic leading-relaxed">
              {whys[whys.length - 1] ? whys[whys.length - 1] : "The terminal answer in your drill-down chain constitutes the probable root cause."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
