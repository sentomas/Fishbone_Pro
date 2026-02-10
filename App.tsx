
import React, { useState, useRef, useEffect } from 'react';
import { CategoryType, Cause, AnalysisMethod, ChecklistItem } from './types';
import { FishboneDiagram } from './components/FishboneDiagram';
import { FiveWhysAnalysis } from './components/FiveWhysAnalysis';
import { CauseCard } from './components/CauseCard';
import { SummaryTable } from './components/SummaryTable';
import { TroubleshootingChecklist } from './components/TroubleshootingChecklist';

const App: React.FC = () => {
  const [problem, setProblem] = useState<string>('');
  const [method, setMethod] = useState<AnalysisMethod>(AnalysisMethod.FISHBONE);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });
  
  // Fishbone State
  const [causes, setCauses] = useState<Cause[]>([]);
  const [newCauseText, setNewCauseText] = useState<string>('');
  
  // Checklist State
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  
  // 5 Whys State
  const [fiveWhys, setFiveWhys] = useState<string[]>(['', '', '', '', '']);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const addCause = (text: string, category: CategoryType | null = null) => {
    if (!text.trim()) return;
    const newCause: Cause = {
      id: Math.random().toString(36).substr(2, 9),
      text: text.trim(),
      category: category,
      isWorkingOn: false
    };
    setCauses(prev => [...prev, newCause]);
  };

  const handleAddManualCause = (e: React.FormEvent) => {
    e.preventDefault();
    addCause(newCauseText);
    setNewCauseText('');
  };

  const deleteCause = (id: string) => {
    setCauses(prev => prev.filter(c => c.id !== id));
  };

  const updateCauseText = (id: string, newText: string) => {
    setCauses(prev => prev.map(c => c.id === id ? { ...c, text: newText } : c));
  };

  const assignCategory = (causeId: string, category: CategoryType) => {
    setCauses(prev => prev.map(c => c.id === causeId ? { ...c, category } : c));
  };

  const toggleWorkingOn = (id: string) => {
    setCauses(prev => prev.map(c => c.id === id ? { ...c, isWorkingOn: !c.isWorkingOn } : c));
  };

  const handleWhyChange = (index: number, value: string) => {
    const updated = [...fiveWhys];
    updated[index] = value;
    setFiveWhys(updated);
  };

  const addWhyStep = () => {
    setFiveWhys(prev => [...prev, '']);
  };

  const removeWhyStep = (index: number) => {
    if (fiveWhys.length <= 1) return;
    setFiveWhys(prev => prev.filter((_, i) => i !== index));
  };

  const resetAnalysis = () => {
    if (confirm("Are you sure you want to clear your current analysis?")) {
      setCauses([]);
      setFiveWhys(['', '', '', '', '']);
      setProblem('');
      setChecklist([]);
    }
  };

  const exportProject = () => {
    const data = {
      problem,
      method,
      causes,
      fiveWhys,
      checklist,
      version: "1.2",
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeProblem = problem.slice(0, 20).replace(/\s+/g, '_') || 'Project';
    link.download = `FishbonePro_${safeProblem}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportImage = () => {
    const svg = document.getElementById('fishbone-svg') as unknown as SVGSVGElement;
    if (!svg) {
      alert("No diagram to export.");
      return;
    }

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    const canvas = document.createElement('canvas');
    const img = new Image();
    
    const scale = 2; 
    canvas.width = 1000 * scale;
    canvas.height = 650 * scale;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    img.onload = () => {
      ctx.fillStyle = theme === 'dark' ? '#0f172a' : '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      const safeProblem = problem.slice(0, 20).replace(/\s+/g, '_') || 'Diagram';
      downloadLink.download = `FishbonePro_${safeProblem}.png`;
      downloadLink.click();
      URL.revokeObjectURL(url);
    };
    
    img.src = url;
  };

  const importProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.problem !== undefined) setProblem(data.problem);
        if (data.method) setMethod(data.method);
        if (data.causes) setCauses(data.causes);
        if (data.fiveWhys) setFiveWhys(data.fiveWhys);
        if (data.checklist) setChecklist(data.checklist);
      } catch (error) {
        alert("Invalid project file.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const importFromCauses = () => {
    const workingCauses = causes.filter(c => c.isWorkingOn);
    if (workingCauses.length === 0) {
      alert("No causes marked as 'Working On'. Toggle the investigation status on causes first.");
      return;
    }
    
    const newItems: ChecklistItem[] = workingCauses.map(c => ({
      id: Math.random().toString(36).substr(2, 9),
      text: `Verify: ${c.text}`,
      completed: false
    }));
    
    setChecklist(prev => [...prev, ...newItems]);
  };

  const unassignedCauses = causes.filter(c => !c.category);

  return (
    <div className={`flex h-screen print:h-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 overflow-hidden print:overflow-visible print:block`}>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={importProject} 
        className="hidden" 
        accept=".json"
      />
      
      {/* Left Sidebar */}
      <aside className={`no-print bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-80' : 'w-0'}`}>
        <div className="p-6 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
              <i className="fa-solid fa-fish"></i>
              <span>Fishbone Pro</span>
            </h1>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Analysis Method</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setMethod(AnalysisMethod.FISHBONE)}
                className={`py-2 px-3 text-[10px] font-bold uppercase rounded-lg transition-all ${method === AnalysisMethod.FISHBONE ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
              >
                Fishbone
              </button>
              <button
                onClick={() => setMethod(AnalysisMethod.FIVE_WHYS)}
                className={`py-2 px-3 text-[10px] font-bold uppercase rounded-lg transition-all ${method === AnalysisMethod.FIVE_WHYS ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
              >
                5 Whys
              </button>
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Problem Statement</label>
            <textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="e.g. High manufacturing defect rate in Q3"
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-slate-200 outline-none transition-all resize-none h-24"
            />
          </div>

          {method === AnalysisMethod.FISHBONE ? (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Input Causes</label>
                <button 
                  disabled={true}
                  title="AI integration possible."
                  className="text-[10px] font-bold text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60 flex items-center gap-1 uppercase tracking-wider transition-all"
                >
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                  AI Suggest
                </button>
              </div>
              
              <form onSubmit={handleAddManualCause} className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCauseText}
                    onChange={(e) => setNewCauseText(e.target.value)}
                    placeholder="Type a cause..."
                    className="flex-1 p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:text-slate-200 outline-none"
                  />
                  <button 
                    type="submit"
                    className="bg-indigo-600 dark:bg-indigo-500 text-white px-3 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-400 transition-colors"
                  >
                    <i className="fa-solid fa-plus"></i>
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Unassigned ({unassignedCauses.length})</span>
                </div>
                {unassignedCauses.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
                    <p className="text-xs text-slate-400 dark:text-slate-600 italic">No unassigned causes.<br/>Add one to get started.</p>
                  </div>
                ) : (
                  unassignedCauses.map(cause => (
                    <CauseCard 
                      key={cause.id} 
                      cause={cause} 
                      onDelete={deleteCause} 
                      onEdit={(newText) => updateCauseText(cause.id, newText)}
                      onToggleWorkingOn={toggleWorkingOn}
                    />
                  ))
                )}
              </div>
            </div>
          ) : (
             <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Drill Down</label>
                  <button 
                    disabled={true}
                    title="AI integration possible."
                    className="text-[10px] font-bold text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60 flex items-center gap-1 uppercase tracking-wider transition-all"
                  >
                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                    AI Brainstorm
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 italic leading-relaxed">Systematically ask "Why?" to drill down.</p>
             </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-600 text-center">
          <p>© 2024 serinthomas.co.in</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden print:overflow-visible print:h-auto print:block">
        {/* Toggle Sidebar Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="no-print absolute top-4 left-4 z-10 w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300"
        >
          <i className={`fa-solid ${isSidebarOpen ? 'fa-chevron-left' : 'fa-chevron-right'}`}></i>
        </button>

        <header className="no-print h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4 ml-10">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              {method === AnalysisMethod.FISHBONE ? 'Fishbone Analysis' : 'Root Cause Drill-down'}
            </span>
            {causes.some(c => c.isWorkingOn) && (
              <div className="bg-amber-50 dark:bg-amber-900/30 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest">Active Investigation</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
             <button onClick={toggleTheme} className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                <i className={`fa-solid ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
              </button>
             <button onClick={() => fileInputRef.current?.click()} className="text-xs font-semibold px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all flex items-center gap-2">
                <i className="fa-solid fa-file-import"></i>
                <span className="hidden md:inline">Import</span>
              </button>
             <button onClick={exportProject} className="text-xs font-semibold px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all flex items-center gap-2">
                <i className="fa-solid fa-floppy-disk"></i>
                <span className="hidden md:inline">Save</span>
              </button>
             {method === AnalysisMethod.FISHBONE && (
               <button onClick={exportImage} className="text-xs font-semibold px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all flex items-center gap-2">
                  <i className="fa-solid fa-image"></i>
                  <span className="hidden md:inline">Export</span>
                </button>
             )}
             <button onClick={() => window.print()} className="text-xs font-semibold px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all flex items-center gap-2">
                <i className="fa-solid fa-print"></i>
                <span className="hidden md:inline">Print</span>
              </button>
             <button onClick={resetAnalysis} className="text-xs font-semibold px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-400 shadow-sm transition-all">
                Reset
              </button>
          </div>
        </header>

        {/* Scrollable container for screen, expanded for print */}
        <div className="flex-1 p-8 flex flex-col overflow-y-auto print:overflow-visible print:p-0 print:h-auto print:block">
          <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col pb-20 print:pb-0 print:m-0 print:max-w-none">
            <div className="mb-6 flex justify-between items-end print:mb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight print:text-black">
                  {method === AnalysisMethod.FISHBONE ? 'Ishikawa Visualization' : 'Multi-Level Why Analysis'}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 print:text-slate-600">
                  {problem || "Root Cause Analysis"}
                </p>
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-12 print:gap-10 print:block">
              {method === AnalysisMethod.FISHBONE ? (
                <div className="print:block">
                  <div className="print:mb-8 print:break-after-auto">
                    <FishboneDiagram 
                      problem={problem} 
                      causes={causes} 
                      onDrop={assignCategory} 
                      onDeleteCause={deleteCause}
                      onEditCause={updateCauseText}
                      onToggleWorkingOn={toggleWorkingOn}
                      theme={theme}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:block print:space-y-12">
                    <div className="print:break-inside-avoid">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 print:text-black">
                        <i className="fa-solid fa-table-list text-indigo-500"></i>
                        Cause Summary
                      </h3>
                      <SummaryTable causes={causes} />
                    </div>
                    
                    <div className="print:break-inside-avoid">
                      <TroubleshootingChecklist 
                        items={checklist} 
                        onUpdate={setChecklist} 
                        onImportFromCauses={importFromCauses}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="print:block">
                  <FiveWhysAnalysis 
                    whys={fiveWhys} 
                    onChange={handleWhyChange} 
                    onAdd={addWhyStep}
                    onRemove={removeWhyStep}
                    problem={problem}
                  />
                </div>
              )}
            </div>

            {/* Hint Box (Hidden in Print) */}
            <div className="no-print mt-12 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-500 dark:text-indigo-400 shrink-0">
                <i className="fa-solid fa-lightbulb"></i>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Workflow Tip</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Toggle the investigation icon <i className="fa-solid fa-wrench"></i> on any cause to mark it as your current focus. 
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
