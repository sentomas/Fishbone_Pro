
import React, { useState, useRef, useEffect } from 'react';
import { CategoryType, Cause, AnalysisMethod, ChecklistItem, DelayStep } from './types';
import { FishboneDiagram } from './components/FishboneDiagram';
import { FiveWhysAnalysis } from './components/FiveWhysAnalysis';
import { DelayPathAnalysis } from './components/DelayPathAnalysis';
import { CauseCard } from './components/CauseCard';
import { SummaryTable } from './components/SummaryTable';
import { TroubleshootingChecklist } from './components/TroubleshootingChecklist';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  ImageRun, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  AlignmentType, 
  HeadingLevel,
  BorderStyle,
  VerticalAlign
} from 'docx';

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

  // Delay Path State
  const [delaySteps, setDelaySteps] = useState<DelayStep[]>([]);
  
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
      setDelaySteps([]);
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
      delaySteps,
      version: "1.3",
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

  // Helper to convert Fishbone SVG to PNG Blob for docx
  const getFishboneImageBlob = async (): Promise<Blob | null> => {
    const svg = document.getElementById('fishbone-svg') as unknown as SVGSVGElement;
    if (!svg) return null;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const img = new Image();
      canvas.width = 2400; 
      canvas.height = 1600;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(null); return; }

      img.onload = () => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          resolve(blob);
        }, 'image/png');
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    });
  };

  const exportToWord = async () => {
    const fishboneBlob = await getFishboneImageBlob();
    const fishboneUint8Array = fishboneBlob ? new Uint8Array(await fishboneBlob.arrayBuffer()) : null;

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: "Root Cause Analysis Dossier",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Generated on: ", bold: true }),
              new TextRun(new Date().toLocaleDateString()),
            ],
            spacing: { after: 400 },
          }),

          new Paragraph({
            text: "Problem Statement",
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: problem || "No problem statement defined.",
            border: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
            },
            spacing: { before: 200, after: 400 },
          }),

          // Fishbone Diagram
          new Paragraph({
            text: "1. Ishikawa (Fishbone) Visualization",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400 },
          }),
          ...(fishboneUint8Array ? [
            new Paragraph({
              children: [
                new ImageRun({
                  data: fishboneUint8Array,
                  transformation: { width: 600, height: 400 },
                }),
              ],
              alignment: AlignmentType.CENTER,
            })
          ] : [new Paragraph("Diagram image could not be captured.")]),

          // Causal Summary Table
          new Paragraph({
            text: "Causal Distribution Summary",
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 400 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Category", bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: "Identified Causes", bold: true })] }),
                ],
              }),
              ...Object.values(CategoryType).map(cat => {
                const catCauses = causes.filter(c => c.category === cat);
                return new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph(cat)] }),
                    new TableCell({ 
                      children: catCauses.length > 0 
                        ? catCauses.map(c => new Paragraph({ text: `• ${c.text}`, spacing: { before: 50, after: 50 } }))
                        : [new Paragraph("No causes identified.")]
                    }),
                  ],
                });
              }),
            ],
          }),

          // Verification Checklist
          new Paragraph({
            text: "Tactical Verification Checklist",
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 400 },
          }),
          ...(checklist.length > 0 ? checklist.map(item => (
            new Paragraph({
              children: [
                new TextRun({ text: item.completed ? "☑ " : "☐ ", font: "Segoe UI Symbol" }),
                new TextRun({ text: item.text, strike: item.completed }),
              ],
            })
          )) : [new Paragraph("No checklist items added.")]),

          // 5 Whys
          new Paragraph({
            text: "2. Root Cause Drill-down (5 Whys)",
            heading: HeadingLevel.HEADING_2,
            pageBreakBefore: true,
          }),
          ...fiveWhys.map((why, idx) => (
            new Paragraph({
              children: [
                new TextRun({ text: `Level ${idx + 1}: `, bold: true }),
                new TextRun(why || "(Empty step)")
              ],
              indent: { left: 720 * idx },
              spacing: { before: 200 },
            })
          )),
          new Paragraph({
            children: [
              new TextRun({ text: "Identified Root Cause: ", bold: true, color: "059669" }),
              new TextRun({ text: fiveWhys[fiveWhys.length - 1] || "None", bold: true, color: "059669" })
            ],
            spacing: { before: 400 },
          }),

          // Timeline
          new Paragraph({
            text: "3. Timeline Latency Pathway",
            heading: HeadingLevel.HEADING_2,
            pageBreakBefore: true,
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Step #", bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: "Event Label", bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: "Duration", bold: true })] }),
                ],
              }),
              ...delaySteps.map((step, idx) => (
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph(String(idx + 1))] }),
                    new TableCell({ children: [new Paragraph(step.label)] }),
                    new TableCell({ children: [new Paragraph(`${step.duration} ${step.unit}`)] }),
                  ],
                })
              )),
              new TableRow({
                children: [
                  new TableCell({ 
                    columnSpan: 2, 
                    children: [new Paragraph({ text: "Accumulated System Latency", bold: true })] 
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ text: String(delaySteps.reduce((acc, curr) => acc + curr.duration, 0)), bold: true })] 
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({
            text: "End of Report",
            alignment: AlignmentType.CENTER,
            spacing: { before: 800 },
          }),
        ],
      }],
    });

    const docBlob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(docBlob);
    const link = document.createElement('a');
    link.href = url;
    const safeProblem = problem.slice(0, 20).replace(/\s+/g, '_') || 'Report';
    link.download = `FishbonePro_${safeProblem}.docx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportImage = () => {
    const svg = document.getElementById('fishbone-svg') as unknown as SVGSVGElement;
    if (!svg) {
      alert("Fishbone diagram not currently active or visible. Switch to Fishbone mode to export the visual.");
      return;
    }

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    const svgLink = document.createElement('a');
    svgLink.href = url;
    const safeProblem = problem.slice(0, 20).replace(/\s+/g, '_') || 'Fishbone';
    svgLink.download = `FishbonePro_${safeProblem}.svg`;
    svgLink.click();
    
    const canvas = document.createElement('canvas');
    const img = new Image();
    canvas.width = 2400; // High resolution
    canvas.height = 1600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    img.onload = () => {
      try {
        ctx.fillStyle = theme === 'dark' ? '#0f172a' : '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngUrl = canvas.toDataURL('image/png');
        const pngLink = document.createElement('a');
        pngLink.href = pngUrl;
        pngLink.download = `FishbonePro_${safeProblem}.png`;
        pngLink.click();
      } catch (e) {
        console.warn("PNG export blocked by security policy (Tainted Canvas). Direct SVG download has been triggered instead.");
      }
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
        if (data.delaySteps) setDelaySteps(data.delaySteps);
        
        // UI feedback
        console.log("Project successfully imported:", data.problem);
      } catch (error) {
        alert("Critical Error: The selected file is not a valid Fishbone Pro project JSON.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const importFromCauses = () => {
    const workingCauses = causes.filter(c => c.isWorkingOn);
    if (workingCauses.length === 0) {
      alert("No causes marked for investigation. Please toggle the 'wrench' icon on potential causes in the diagram first.");
      return;
    }
    const newItems: ChecklistItem[] = workingCauses.map(c => ({
      id: Math.random().toString(36).substr(2, 9),
      text: `Verify Cause: ${c.text}`,
      completed: false
    }));
    setChecklist(prev => [...prev, ...newItems]);
  };

  const unassignedCauses = causes.filter(c => !c.category);

  return (
    <div className={`flex h-screen print:h-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 overflow-hidden print:overflow-visible print:block`}>
      {/* Hidden File Input for Import functionality */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={importProject} 
        className="hidden" 
        accept=".json" 
      />
      
      {/* Left Navigation & Control Sidebar */}
      <aside className={`no-print bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-80' : 'w-0'}`}>
        <div className="p-6 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-xl font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
              <i className="fa-solid fa-fish-fins"></i>
              <span>Fishbone Pro</span>
            </h1>
          </div>

          <div className="mb-8">
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Analysis Workspace</label>
            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={() => setMethod(AnalysisMethod.FISHBONE)} 
                className={`flex items-center gap-3 py-3 px-4 text-xs font-bold rounded-xl transition-all ${method === AnalysisMethod.FISHBONE ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              >
                <i className="fa-solid fa-diagram-project w-4 text-center"></i>
                Ishikawa (Fishbone)
              </button>
              <button 
                onClick={() => setMethod(AnalysisMethod.FIVE_WHYS)} 
                className={`flex items-center gap-3 py-3 px-4 text-xs font-bold rounded-xl transition-all ${method === AnalysisMethod.FIVE_WHYS ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              >
                <i className="fa-solid fa-list-ol w-4 text-center"></i>
                Multi-Level 5 Whys
              </button>
              <button 
                onClick={() => setMethod(AnalysisMethod.DELAY_PATH)} 
                className={`flex items-center gap-3 py-3 px-4 text-xs font-bold rounded-xl transition-all ${method === AnalysisMethod.DELAY_PATH ? 'bg-orange-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              >
                <i className="fa-solid fa-timeline w-4 text-center"></i>
                Time Delay Pathway
              </button>
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Target Problem</label>
            <textarea 
              value={problem} 
              onChange={(e) => setProblem(e.target.value)} 
              placeholder="Primary incident or defect description..." 
              className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 dark:text-slate-200 outline-none h-28 transition-all resize-none shadow-inner" 
            />
          </div>

          {method === AnalysisMethod.FISHBONE && (
            <div className="mb-8">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Input Candidate Causes</label>
              <form onSubmit={handleAddManualCause} className="mb-4">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newCauseText} 
                    onChange={(e) => setNewCauseText(e.target.value)} 
                    placeholder="New cause..." 
                    className="flex-1 p-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                  <button type="submit" className="bg-indigo-600 text-white px-4 rounded-xl hover:bg-indigo-700 transition-colors">
                    <i className="fa-solid fa-plus"></i>
                  </button>
                </div>
              </form>
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Pool ({unassignedCauses.length})</span>
                {unassignedCauses.map(cause => (
                  <CauseCard key={cause.id} cause={cause} onDelete={deleteCause} onEdit={(newText) => updateCauseText(cause.id, newText)} onToggleWorkingOn={toggleWorkingOn} />
                ))}
              </div>
            </div>
          )}

          {/* Workflow Guide - Contextual Help */}
          <div className="mt-auto pt-8 border-t border-slate-100 dark:border-slate-800">
             <div className="p-5 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
               <div className="flex items-center gap-3 mb-3">
                 <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                   <i className="fa-solid fa-lightbulb"></i>
                 </div>
                 <h4 className="font-black text-slate-800 dark:text-slate-200 text-[10px] uppercase tracking-[0.2em]">Workflow Tip</h4>
               </div>
               <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                 {method === AnalysisMethod.FISHBONE 
                   ? "Identify potential categories and drag causes into the diagram skeleton for mapping." 
                   : method === AnalysisMethod.FIVE_WHYS 
                   ? "Drill down through logical layers of causality until a root failure is identified."
                   : "Map chronological events to identify bottlenecks and latency clusters."}
               </p>
             </div>
          </div>
        </div>
      </aside>

      {/* Primary Workspace Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden print:overflow-visible print:h-auto print:block">
        <header className="no-print h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 shrink-0 shadow-sm z-20">
          <div className="flex items-center gap-4">
             <button 
               onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
               className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors"
             >
               <i className={`fa-solid ${isSidebarOpen ? 'fa-chevron-left' : 'fa-chevron-right'}`}></i>
             </button>
             <div className="flex flex-col">
               <span className="text-xs font-black text-slate-400 uppercase tracking-[0.15em]">Active View</span>
               <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                 {method === AnalysisMethod.FISHBONE ? 'Root Cause Mapping' : method === AnalysisMethod.FIVE_WHYS ? 'Drill-down Analysis' : 'Timeline pathway'}
               </span>
             </div>
          </div>
          
          <div className="flex items-center gap-2">
             <button onClick={toggleTheme} className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
               <i className={`fa-solid ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
             </button>
             
             <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

             <button 
               onClick={() => fileInputRef.current?.click()} 
               className="text-xs font-bold px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all flex items-center gap-2"
             >
                <i className="fa-solid fa-file-import text-indigo-500"></i>
                <span className="hidden lg:inline uppercase tracking-widest text-[10px]">Import</span>
             </button>

             <button 
               onClick={exportProject} 
               className="text-xs font-bold px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all flex items-center gap-2"
             >
                <i className="fa-solid fa-floppy-disk text-indigo-500"></i>
                <span className="hidden lg:inline uppercase tracking-widest text-[10px]">Save JSON</span>
             </button>

             <button 
               onClick={exportToWord} 
               className="text-xs font-bold px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
             >
                <i className="fa-solid fa-file-word"></i>
                <span className="uppercase tracking-widest text-[10px]">Export as Word</span>
             </button>

             <button 
               onClick={resetAnalysis} 
               className="text-[10px] font-black uppercase tracking-widest px-4 py-2 text-slate-400 hover:text-red-500 transition-colors"
             >
                Reset
             </button>
          </div>
        </header>

        {/* Content Viewport */}
        <div className="flex-1 p-8 overflow-y-auto print:p-0 print:overflow-visible transition-colors">
          <div className="max-w-5xl mx-auto w-full flex flex-col gap-12 print:m-0 print:max-w-none">
            
            {/* PDF Identity Banner */}
            <div className="hidden print:block mb-12">
              <div className="flex justify-between items-start border-b-4 border-indigo-600 pb-6">
                <div>
                  <h1 className="text-4xl font-black text-slate-900 mb-2">Root Cause Analysis Dossier</h1>
                  <div className="flex items-center gap-4 text-slate-500 font-bold uppercase text-xs tracking-widest">
                    <span>Expert Edition</span>
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                    <span>Systemic Breakdown Report</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-slate-400 uppercase mb-1">Generated On</p>
                  <p className="text-lg font-bold text-slate-800">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
              <div className="mt-8 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Subject Problem Statement</h3>
                <p className="text-2xl font-bold text-slate-800 leading-tight">{problem || "Problem statement not explicitly defined."}</p>
              </div>
            </div>

            {/* Analysis Views: Switched based on Method (All visible in Print) */}
            
            {/* Fishbone Section */}
            <section className={`analysis-section ${method === AnalysisMethod.FISHBONE ? 'block' : 'hidden print:block'}`}>
              <div className="flex items-center justify-between mb-8 print:mb-12">
                <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm print:hidden">
                    <i className="fa-solid fa-fish"></i>
                  </div>
                  <span>Ishikawa Visualization</span>
                </h2>
              </div>
              <div className="mb-10 rounded-2xl overflow-hidden shadow-2xl print:shadow-none border border-slate-200 dark:border-slate-800">
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
                <div className="break-inside-avoid">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Causal Distribution</h3>
                  <SummaryTable causes={causes} />
                </div>
                <div className="break-inside-avoid">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Tactical Checklist</h3>
                  <TroubleshootingChecklist 
                    items={checklist} 
                    onUpdate={setChecklist} 
                    onImportFromCauses={importFromCauses} 
                  />
                </div>
              </div>
            </section>

            {/* 5 Whys Section */}
            <section className={`analysis-section page-break ${method === AnalysisMethod.FIVE_WHYS ? 'block' : 'hidden print:block'}`}>
              <div className="flex items-center justify-between mb-8 print:mb-12">
                <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm print:hidden">
                    <i className="fa-solid fa-list-check"></i>
                  </div>
                  <span>Root Cause Drill-down (5 Whys)</span>
                </h2>
              </div>
              <div className="bg-white dark:bg-slate-900/30 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-inner">
                <FiveWhysAnalysis 
                  whys={fiveWhys} 
                  onChange={handleWhyChange} 
                  onAdd={addWhyStep} 
                  onRemove={removeWhyStep} 
                  problem={problem} 
                />
              </div>
            </section>

            {/* Delay Pathway Section */}
            <section className={`analysis-section page-break ${method === AnalysisMethod.DELAY_PATH ? 'block' : 'hidden print:block'}`}>
              <div className="flex items-center justify-between mb-8 print:mb-12">
                <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/40 rounded-xl flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-sm print:hidden">
                    <i className="fa-solid fa-timeline"></i>
                  </div>
                  <span>Timeline Latency pathway</span>
                </h2>
              </div>
              <div className="bg-white dark:bg-slate-900/30 rounded-3xl p-10 border border-slate-100 dark:border-slate-800 shadow-inner">
                <DelayPathAnalysis 
                  steps={delaySteps} 
                  onUpdate={setDelaySteps} 
                  problem={problem} 
                />
              </div>
            </section>

            {/* Final Report Certification */}
            <div className="hidden print:block mt-20 pt-10 border-t border-slate-200 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Fishbone Pro Analytical Suite | Internal Analysis Report</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
