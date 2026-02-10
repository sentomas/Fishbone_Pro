
import React from 'react';
import { CategoryType, Cause } from '../types';

interface SummaryTableProps {
  causes: Cause[];
}

export const SummaryTable: React.FC<SummaryTableProps> = ({ causes }) => {
  const categories = Object.values(CategoryType);
  const assignedCauses = causes.filter(c => c.category !== null);

  if (assignedCauses.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center transition-colors">
        <p className="text-sm text-slate-400 dark:text-slate-600 italic">No causes assigned yet. Drag items to the diagram to see them here.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm transition-colors">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest w-48">Category</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Identified Causes</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => {
            const catCauses = causes.filter(c => c.category === cat);
            if (catCauses.length === 0) return null;
            
            return (
              <tr key={cat} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4 align-top">
                  <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                    {cat}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <ul className="space-y-2">
                    {catCauses.map((cause) => (
                      <li key={cause.id} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-indigo-400 dark:bg-indigo-600 rounded-full mt-1.5 shrink-0"></span>
                        {cause.text}
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
