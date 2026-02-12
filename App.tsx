
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
  BorderStyle
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
      canvas.width = 1600; 
      canvas.height = 1000;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(null); return; }

      img.onload = () => {
        try {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          canvas.toBlob((blob) => {
            URL.revokeObjectURL(url);
            resolve(blob);
          }, 'image/png');
        } catch (e) {
          console.warn("Image capture blocked by browser security (Tainted Canvas).");
          URL.revokeObjectURL(url);
          resolve(null);
        }
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

    // Build sections with strict object parameters to avoid undefined errors
    
    // 1. Fishbone Image
    const fishboneParagraphs = fishboneUint8Array ? [
      new Paragraph({
        children: [
          new ImageRun({
            data: fishboneUint8Array,
            transformation: { width: 550, height: 350 },
            type: "png"
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 400 },
      })
    ] : [
      new Paragraph({
        children: [
          new TextRun({ text: "Note: Graphical diagram export was restricted by your browser's security settings (Canvas Tainting). Review the tabular distribution below.", italics: true, color: "64748B" })
        ],
        spacing: { before: 200, after: 400 },
      })
    ];

    // 2. Checklist
    const checklistParagraphs = checklist.length > 0 ? checklist.map(item => (
      new Paragraph({
        children: [
          new TextRun({ text: item.completed ? "✓ " : "○ ", bold: true }),
          new TextRun({ text: "  " }), // Spacer
          new TextRun({ text: item.text, strike: item.completed, color: item.completed ? "94A3B8" : "000000" }),
        ],
      })
    )) : [new Paragraph({ children: [new TextRun({ text: "No verification tasks added.", italics: true, color: "94A3B8" })] })];

    // 3. Five Whys
    const fiveWhysParagraphs = fiveWhys.map((why, idx) => (
      new Paragraph({
        children: [
          new TextRun({ text: `Drill-down Level ${idx + 1}: `, bold: true }),
          new TextRun({ text: why || "(Branch not documented)" })
        ],
        indent: { left: 400 * idx },
        spacing: { before: 200 },
      })
    ));

    // 4. Timeline
    const timelineRows = delaySteps.map((step, idx) => (
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(idx + 1) })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: step.label })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${step.duration} ${step.unit}` })] })] }),
        ],
      })
    ));

    // 5. Causal Summary Rows
    const causalRows = Object.values(CategoryType).map(cat => {
      const catCauses = causes.filter(c => c.category === cat);
      return new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: cat })] })] }),
          new TableCell({ 
            children: catCauses.length > 0 
              ? catCauses.map(c => new Paragraph({ children: [new TextRun({ text: `• ${c.text}` })], spacing: { before: 50, after: 50 } }))
              : [new Paragraph({ children: [new TextRun({ text: "(None identified)", italics: true, color: "94A3B8" })] })]
          }),
        ],
      });
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: "Root Cause Analysis Expert Report",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Generated on: ", bold: true }),
              new TextRun({ text: new Date().toLocaleString() }),
            ],
            spacing: { after: 400 },
          }),

          new Paragraph({
            text: "Problem Statement",
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            children: [new TextRun({ text: problem || "No problem statement defined." })],
            border: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
            },
            spacing: { before: 200, after: 400 },
          }),

          new Paragraph({
            text: "1. Ishikawa (Fishbone) Analysis",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400 },
          }),
          ...fishboneParagraphs,

          new Paragraph({
            text: "Categorized Causal Distribution",
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Category", bold: true })] })], shading: { fill: "F8FAFC" } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Identified Potential Causes", bold: true })] })], shading: { fill: "F8FAFC" } }),
                ],
              }),
              ...causalRows,
            ],
          }),

          new Paragraph({
            text: "Tactical Verification Checklist",
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 400 },
          }),
          ...checklistParagraphs,

          new Paragraph({
            text: "2. Systematic Drill-down (5 Whys)",
            heading: HeadingLevel.HEADING_2,
            pageBreakBefore: true,
          }),
          ...fiveWhysParagraphs,
          
          new Paragraph({
            children: [
              new TextRun({ text: "Identified Probable Root Cause: ", bold: true, color: "059669" }),
              new TextRun({ text: fiveWhys[fiveWhys.length - 1] || "Not Concluded", bold: true, color: "059669" })
            ],
            spacing: { before: 600 },
          }),

          new Paragraph({
            text: "3. Chronological Latency Pathway",
            heading: HeadingLevel.HEADING_2,
            pageBreakBefore: true,
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Step #", bold: true })] })], shading: { fill: "F8FAFC" } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Event/Stage Label", bold: true })] })], shading: { fill: "F8FAFC" } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Latency Value", bold: true })] })], shading: { fill: "F8FAFC" } }),
                ],
              }),
              ...timelineRows,
              new TableRow({
                children: [
                  new TableCell({ 
                    columnSpan: 2, 
                    children: [new Paragraph({ children: [new TextRun({ text: "Total Accumulated Pathway Latency", bold: true })] })],
                    shading: { fill: "F1F5F9" }
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: String(delaySteps.reduce((acc, curr) => acc + curr.duration, 0)), bold: true })] })],
                    shading: { fill: "F1F5F9" }
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({
            text: "END OF ANALYSIS REPORT",
            alignment: AlignmentType.CENTER,
            spacing: { before: 1200 },
          }),
        ],
      }],
    });

    const docBlob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(docBlob);
    const link = document.createElement('a');
    link.href = url;
    const safeProblem = problem.slice(0, 20).replace(/\s+/g, '_') || 'Analysis';
    link.download = `FishbonePro_ExpertReport_${safeProblem}.docx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportImage = () => {
    const svg = document.getElementById('fishbone-svg') as unknown as SVGSVGElement;
    if (!svg) {
      alert("Please switch to the Fishbone mode to export the diagram.");
      return;
    }
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const link = document.createElement('a');
    link.href = url;
    const safeProblem = problem.slice(0, 20).replace(/\s+/g, '_') || 'Fishbone';
    link.download = `FishbonePro_${safeProblem}.svg`;
    link.click();
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
      alert("No causes marked for investigation (wrench icon).");
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
    <div className={`flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 overflow-hidden print:overflow-visible print:h-auto print:block`}>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={importProject} 
        className="hidden" 
        accept=".json" 
      />
      
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
              <button onClick={() => setMethod(AnalysisMethod.FISHBONE)} className={`flex items-center gap-3 py-3 px-4 text-xs font-bold rounded-xl transition-all ${method === AnalysisMethod.FISHBONE ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                <i className="fa-solid fa-diagram-project w-4 text-center"></i>
                Ishikawa (Fishbone)
              </button>
              <button onClick={() => setMethod(AnalysisMethod.FIVE_WHYS)} className={`flex items-center gap-3 py-3 px-4 text-xs font-bold rounded-xl transition-all ${method === AnalysisMethod.FIVE_WHYS ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                <i className="fa-solid fa-list-ol w-4 text-center"></i>
                Multi-Level 5 Whys
              </button>
              <button onClick={() => setMethod(AnalysisMethod.DELAY_PATH)} className={`flex items-center gap-3 py-3 px-4 text-xs font-bold rounded-xl transition-all ${method === AnalysisMethod.DELAY_PATH ? 'bg-orange-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                <i className="fa-solid fa-timeline w-4 text-center"></i>
                Time Delay Pathway
              </button>
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Target Problem</label>
            <textarea value={problem} onChange={(e) => setProblem(e.target.value)} placeholder="Enter defect description..." className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 dark:text-slate-200 outline-none h-28 transition-all resize-none shadow-inner" />
          </div>

          {method === AnalysisMethod.FISHBONE && (
            <div className="mb-8">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Input Candidate Causes</label>
              <form onSubmit={handleAddManualCause} className="mb-4">
                <div className="flex gap-2">
                  <input type="text" value={newCauseText} onChange={(e) => setNewCauseText(e.target.value)} placeholder="New cause..." className="flex-1 p-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                  <button type="submit" className="bg-indigo-600 text-white px-4 rounded-xl hover:bg-indigo-700 transition-colors">
                    <i className="fa-solid fa-plus"></i>
                  </button>
                </div>
              </form>
              <div className="space-y-2">
                {unassignedCauses.map(cause => (
                  <CauseCard key={cause.id} cause={cause} onDelete={deleteCause} onEdit={(newText) => updateCauseText(cause.id, newText)} onToggleWorkingOn={toggleWorkingOn} />
                ))}
              </div>
            </div>
          )}

          <div className="mt-auto pt-8 border-t border-slate-100 dark:border-slate-800">
             <div className="p-5 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
               <div className="flex items-center gap-3 mb-3">
                 <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                   <i className="fa-solid fa-lightbulb"></i>
                 </div>
                 <h4 className="font-black text-slate-800 dark:text-slate-200 text-[10px] uppercase tracking-[0.2em]">Expert Tip</h4>
               </div>
               <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                 {method === AnalysisMethod.FISHBONE ? "Categorize causes to see distribution patterns." : method === AnalysisMethod.FIVE_WHYS ? "Logical drilling uncovers hidden systemic failures." : "Mapping chronological steps identifies operational bottlenecks."}
               </p>
             </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden print:overflow-visible print:block print:h-auto">
        <header className="no-print h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 shrink-0 shadow-sm z-20">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-indigo-50 transition-colors">
               <i className={`fa-solid ${isSidebarOpen ? 'fa-chevron-left' : 'fa-chevron-right'}`}></i>
             </button>
             <div className="flex flex-col">
               <span className="text-xs font-black text-slate-400 uppercase tracking-[0.15em]">Analysis Mode</span>
               <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                 {method === AnalysisMethod.FISHBONE ? 'Ishikawa Mapping' : method === AnalysisMethod.FIVE_WHYS ? 'Root Cause Drill-down' : 'Timeline Latency'}
               </span>
             </div>
          </div>
          
          <div className="flex items-center gap-2">
             <button onClick={toggleTheme} className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all">
               <i className={`fa-solid ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
             </button>
             
             <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

             <button onClick={() => fileInputRef.current?.click()} className="text-[10px] font-bold px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all flex items-center gap-2 uppercase tracking-widest">
                <i className="fa-solid fa-file-import text-indigo-500"></i>
                Import
             </button>

             <button onClick={exportProject} className="text-[10px] font-bold px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all flex items-center gap-2 uppercase tracking-widest">
                <i className="fa-solid fa-floppy-disk text-indigo-500"></i>
                JSON
             </button>

             <button onClick={exportToWord} title="Export as Word" className="w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-all">
                <i className="fa-solid fa-file-word text-lg"></i>
             </button>

             <button onClick={() => window.print()} title="Save as PDF" className="w-10 h-10 flex items-center justify-center border border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-50 transition-all">
                <i className="fa-solid fa-file-pdf text-lg"></i>
             </button>
          </div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto print:p-0 print:overflow-visible transition-colors">
          <div className="max-w-5xl mx-auto w-full flex flex-col gap-12 print:gap-16 print:m-0 print:max-w-none">
            
            <div className="hidden print:block">
              <div className="flex justify-between items-start border-b-4 border-indigo-600 pb-6">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tighter">Analytical Root Cause Dossier</h1>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Expert Edition | Systematic Operational Analysis</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-slate-400 uppercase mb-1">Dossier Date</p>
                  <p className="text-base font-bold text-slate-800">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
              <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Subject Problem</h3>
                <p className="text-xl font-bold text-slate-800">{problem || "No problem statement defined."}</p>
              </div>
            </div>

            <section className={`analysis-section ${method === AnalysisMethod.FISHBONE ? 'block' : 'hidden print:block'}`}>
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 print:hidden">
                  <i className="fa-solid fa-fish"></i>
                </div>
                <span>1. Ishikawa Visualization</span>
              </h2>
              <div className="mb-10 rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 bg-white">
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
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Categorical Summary</h3>
                  <SummaryTable causes={causes} />
                </div>
                <div className="break-inside-avoid">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Verification Actions</h3>
                  <TroubleshootingChecklist 
                    items={checklist} 
                    onUpdate={setChecklist} 
                    onImportFromCauses={importFromCauses} 
                  />
                </div>
              </div>
            </section>

            <section className={`analysis-section page-break ${method === AnalysisMethod.FIVE_WHYS ? 'block' : 'hidden print:block'}`}>
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 print:hidden">
                  <i className="fa-solid fa-list-check"></i>
                </div>
                <span>2. Multi-Level Drill-down</span>
              </h2>
              <div className="bg-white dark:bg-slate-900/30 rounded-3xl p-8 border border-slate-100 dark:border-slate-800">
                <FiveWhysAnalysis 
                  whys={fiveWhys} 
                  onChange={handleWhyChange} 
                  onAdd={addWhyStep} 
                  onRemove={removeWhyStep} 
                  problem={problem} 
                />
              </div>
            </section>

            <section className={`analysis-section page-break ${method === AnalysisMethod.DELAY_PATH ? 'block' : 'hidden print:block'}`}>
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/40 rounded-xl flex items-center justify-center text-orange-600 dark:text-orange-400 print:hidden">
                  <i className="fa-solid fa-timeline"></i>
                </div>
                <span>3. Latency Pathway</span>
              </h2>
              <div className="bg-white dark:bg-slate-900/30 rounded-3xl p-10 border border-slate-100 dark:border-slate-800">
                <DelayPathAnalysis 
                  steps={delaySteps} 
                  onUpdate={setDelaySteps} 
                  problem={problem} 
                />
              </div>
            </section>

            <div className="hidden print:block mt-20 pt-10 border-t border-slate-200 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Fishbone Pro Analytical Suite | Internal Expert Report</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
