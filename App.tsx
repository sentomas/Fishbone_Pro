import React, { useState, useRef, useEffect } from 'react';
import { 
  CategoryType, 
  Cause, 
  AnalysisMethod, 
  ChecklistItem, 
  DelayStep, 
  DomainFramework, 
  FRAMEWORK_CATEGORIES, 
  SoftwareDefectTemplate 
} from './types';
import { SOFTWARE_DEFECT_TEMPLATES } from './data/softwareDefectTemplates';
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

const STORAGE_KEY = 'fishbone_pro_analysis_state_v1';

const getInitialSavedState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn("Could not parse saved state from localStorage:", e);
  }
  return null;
};

const App: React.FC = () => {
  const initialSavedState = getInitialSavedState();

  const [problem, setProblem] = useState<string>(
    initialSavedState?.problem ?? 'REST API response time exceeded SLA (>5s) causing gateway timeouts during peak user traffic'
  );
  const [method, setMethod] = useState<AnalysisMethod>(
    initialSavedState?.method ?? AnalysisMethod.FISHBONE
  );
  const [framework, setFramework] = useState<DomainFramework>(
    initialSavedState?.framework ?? 'software'
  );
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });
  
  // Fishbone State
  const [causes, setCauses] = useState<Cause[]>(
    initialSavedState?.causes ?? []
  );
  const [newCauseText, setNewCauseText] = useState<string>('');
  
  // Checklist State
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    initialSavedState?.checklist ?? []
  );
  
  // 5 Whys State
  const [fiveWhys, setFiveWhys] = useState<string[]>(
    initialSavedState?.fiveWhys ?? ['', '', '', '', '']
  );

  // Delay Path State
  const [delaySteps, setDelaySteps] = useState<DelayStep[]>(
    initialSavedState?.delaySteps ?? []
  );

  // Toast / Modal / Save States
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);
  const [lastAutoSave, setLastAutoSave] = useState<string | null>(null);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize with default software template ONLY if no saved state exists
  useEffect(() => {
    if (!initialSavedState) {
      const defaultTemplate = SOFTWARE_DEFECT_TEMPLATES[0];
      if (defaultTemplate && causes.length === 0) {
        loadTemplate(defaultTemplate);
      }
    }
  }, []);

  // Auto-save effect whenever analysis state changes
  useEffect(() => {
    const dataToSave = {
      problem,
      framework,
      method,
      causes,
      checklist,
      fiveWhys,
      delaySteps,
      timestamp: new Date().toISOString()
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      const now = new Date();
      setLastAutoSave(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      console.warn("Auto-save to localStorage failed:", e);
    }
  }, [problem, framework, method, causes, checklist, fiveWhys, delaySteps]);

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

  const showToast = (message: string) => {
    setCopyToast(message);
    setTimeout(() => setCopyToast(null), 3000);
  };

  const loadTemplate = (template: SoftwareDefectTemplate) => {
    setProblem(template.problem);
    setFramework(template.framework);
    
    // Load pre-assigned causes
    const newCauses: Cause[] = template.causes.map(c => ({
      id: Math.random().toString(36).substr(2, 9),
      text: c.text,
      category: c.category,
      isWorkingOn: false
    }));
    setCauses(newCauses);

    if (template.fiveWhys && template.fiveWhys.length > 0) {
      setFiveWhys(template.fiveWhys);
    }

    if (template.checklist && template.checklist.length > 0) {
      setChecklist(template.checklist.map(t => ({
        id: Math.random().toString(36).substr(2, 9),
        text: t,
        completed: false
      })));
    }

    setIsTemplateModalOpen(false);
  };

  const addCause = (text: string, category: string | null = null) => {
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

  const assignCategory = (causeId: string, category: string) => {
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

  const getFishboneImageBlob = async (): Promise<Blob | null> => {
    const svg = document.getElementById('fishbone-svg') as unknown as SVGSVGElement;
    if (!svg) return null;

    try {
      const clonedSvg = svg.cloneNode(true) as SVGSVGElement;
      
      // Remove no-print UI buttons inside cloned SVG
      const noPrintElems = clonedSvg.querySelectorAll('.no-print');
      noPrintElems.forEach(el => el.remove());

      // Embed style block inside cloned SVG so foreignObject elements render cleanly on canvas
      const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
      styleEl.textContent = `
        * { box-sizing: border-box; font-family: 'Poppins', ui-sans-serif, system-ui, -apple-system, sans-serif; }
        .flex { display: flex; }
        .flex-col { flex-direction: column; }
        .items-center { align-items: center; }
        .justify-center { justify-content: center; }
        .justify-start { justify-content: flex-start; }
        .justify-end { justify-content: flex-end; }
        .text-center { text-align: center; }
        .w-full { width: 100%; }
        .h-full { height: 100%; }
        .gap-1 { gap: 4px; }
        .gap-1.5 { gap: 6px; }
        .p-2 { padding: 8px; }
        .rounded-md { border-radius: 6px; }
        .bg-white { background-color: #ffffff; }
        .dark .bg-slate-800 { background-color: #1e293b; }
        .border { border-style: solid; border-width: 1px; }
        .border-slate-200 { border-color: #e2e8f0; }
        .border-l-4 { border-left-width: 4px; }
        .border-l-indigo-400 { border-left-color: #818cf8; }
        .border-l-amber-500 { border-left-color: #f59e0b; }
        .text-slate-700 { color: #334155; }
        .text-slate-300 { color: #cbd5e1; }
        .text-\\[10px\\] { font-size: 10px; }
        .font-bold { font-weight: 700; }
        .uppercase { text-transform: uppercase; }
        .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); }
      `;
      clonedSvg.insertBefore(styleEl, clonedSvg.firstChild);

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(clonedSvg);
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
            ctx.fillStyle = theme === 'dark' ? '#0f172a' : '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            canvas.toBlob((blob) => {
              URL.revokeObjectURL(url);
              resolve(blob);
            }, 'image/png');
          } catch (e) {
            console.warn("Image capture blocked by browser security.", e);
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
    } catch (err) {
      console.warn("Failed cloning SVG:", err);
      return null;
    }
  };

  // Copy Ishikawa / Fishbone Analysis Summary & Diagram Image to Clipboard
  const copyToClipboard = async () => {
    const activeCats = FRAMEWORK_CATEGORIES[framework].categories;
    let markdown = `# ISHIKAWA (FISHBONE) ROOT CAUSE ANALYSIS\n`;
    markdown += `Framework: ${FRAMEWORK_CATEGORIES[framework].name}\n`;
    markdown += `Problem Statement: ${problem || 'Unspecified Problem'}\n\n`;
    markdown += `--- CATEGORIZED CAUSES ---\n`;

    activeCats.forEach(cat => {
      const catCauses = causes.filter(c => c.category === cat);
      markdown += `\n[ ${cat.toUpperCase()} ]\n`;
      if (catCauses.length === 0) {
        markdown += `  (No causes mapped)\n`;
      } else {
        catCauses.forEach(c => {
          markdown += `  • ${c.text}${c.isWorkingOn ? ' [INVESTIGATING]' : ''}\n`;
        });
      }
    });

    const unassigned = causes.filter(c => !c.category);
    if (unassigned.length > 0) {
      markdown += `\n[ UNASSIGNED CANDIDATE CAUSES ]\n`;
      unassigned.forEach(c => {
        markdown += `  • ${c.text}\n`;
      });
    }

    if (checklist.length > 0) {
      markdown += `\n--- VERIFICATION CHECKLIST ---\n`;
      checklist.forEach(item => {
        markdown += `  [${item.completed ? 'x' : ' '}] ${item.text}\n`;
      });
    }

    if (fiveWhys.some(w => w.trim())) {
      markdown += `\n--- 5 WHYS DRILL-DOWN ---\n`;
      fiveWhys.forEach((why, i) => {
        if (why.trim()) {
          markdown += `  Why ${i + 1}: ${why}\n`;
        }
      });
    }

    // Capture Fishbone diagram image
    const fishboneBlob = await getFishboneImageBlob();

    if (fishboneBlob && navigator.clipboard && typeof navigator.clipboard.write === 'function') {
      try {
        const textBlob = new Blob([markdown], { type: 'text/plain' });

        let base64Img = '';
        try {
          base64Img = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const res = reader.result as string;
              resolve(res ? res.split(',')[1] : '');
            };
            reader.readAsDataURL(fishboneBlob);
          });
        } catch (e) {
          console.warn("Base64 string generation failed:", e);
        }

        const htmlContent = `
          <div style="font-family: system-ui, -apple-system, sans-serif; color: #1e293b; max-width: 800px; padding: 16px;">
            <h2 style="color: #4f46e5; margin-bottom: 8px;">${FRAMEWORK_CATEGORIES[framework].name} - Ishikawa Root Cause Analysis</h2>
            <p style="font-size: 14px; color: #475569;"><strong>Problem Statement:</strong> ${problem || 'Unspecified Problem'}</p>
            ${base64Img ? `<div style="margin: 20px 0; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; padding: 12px; background: #ffffff; text-align: center;"><img src="data:image/png;base64,${base64Img}" alt="Ishikawa Fishbone Diagram" style="max-width: 100%; height: auto; display: block; margin: 0 auto;" /></div>` : ''}
            <pre style="background: #f8fafc; padding: 16px; border-radius: 8px; font-size: 12px; line-height: 1.5; border: 1px solid #e2e8f0; white-space: pre-wrap;">${markdown}</pre>
          </div>
        `;
        const htmlBlob = new Blob([htmlContent], { type: 'text/html' });

        const itemData: Record<string, Blob> = {
          'image/png': fishboneBlob,
          'text/plain': textBlob,
          'text/html': htmlBlob,
        };

        await navigator.clipboard.write([new ClipboardItem(itemData)]);
        showToast("Copied Ishikawa Diagram Image & Report to Clipboard!");
        return;
      } catch (clipErr) {
        console.warn("ClipboardItem write failed, trying fallback image or text:", clipErr);
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': fishboneBlob })]);
          showToast("Copied Ishikawa Diagram Image to Clipboard!");
          return;
        } catch (imgErr) {
          console.warn("Image write failed, falling back to writeText:", imgErr);
        }
      }
    }

    // Fallback text copy
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(markdown);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = markdown;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      showToast("Copied Ishikawa Analysis Report to Clipboard!");
    } catch (err) {
      console.error("Copy failed:", err);
      alert("Unable to copy automatically. Please copy from the screen.");
    }
  };

  const exportProject = () => {
    const data = {
      problem,
      framework,
      method,
      causes,
      fiveWhys,
      checklist,
      delaySteps,
      version: "1.4",
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeProblem = problem.slice(0, 20).replace(/\s+/g, '_') || 'Project';
    link.download = `FishbonePro_${framework}_${safeProblem}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearSavedState = () => {
    if (confirm("Are you sure you want to reset and start a fresh analysis? Your current analysis data will be cleared.")) {
      setProblem('');
      setCauses([]);
      setChecklist([]);
      setFiveWhys(['', '', '', '', '']);
      setDelaySteps([]);
      localStorage.removeItem(STORAGE_KEY);
      setLastAutoSave(null);
      showToast("Cleared analysis and reset storage.");
    }
  };

  const exportToWord = async () => {
    const fishboneBlob = await getFishboneImageBlob();
    const fishboneUint8Array = fishboneBlob ? new Uint8Array(await fishboneBlob.arrayBuffer()) : null;

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
          new TextRun({ text: "Note: Graphical diagram export was restricted by browser settings. Review the tabular distribution below.", italics: true, color: "64748B" })
        ],
        spacing: { before: 200, after: 400 },
      })
    ];

    const checklistParagraphs = checklist.length > 0 ? checklist.map(item => (
      new Paragraph({
        children: [
          new TextRun({ text: item.completed ? "✓ " : "○ ", bold: true }),
          new TextRun({ text: "  " }),
          new TextRun({ text: item.text, strike: item.completed, color: item.completed ? "94A3B8" : "000000" }),
        ],
      })
    )) : [new Paragraph({ children: [new TextRun({ text: "No verification tasks added.", italics: true, color: "94A3B8" })] })];

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

    const activeCategories = FRAMEWORK_CATEGORIES[framework].categories;
    const causalRows = activeCategories.map(cat => {
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
            text: `${FRAMEWORK_CATEGORIES[framework].name} Report`,
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
            text: "1. Ishikawa (Fishbone) Causal Analysis",
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
            text: "Verification & Action Checklist",
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
    link.download = `FishbonePro_${framework}_${safeProblem}.docx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.problem !== undefined) setProblem(data.problem);
        if (data.framework) setFramework(data.framework);
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
  const activeFrameworkInfo = FRAMEWORK_CATEGORIES[framework];

  return (
    <div className={`flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 overflow-hidden print:overflow-visible print:h-auto print:block relative`}>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={importProject} 
        className="hidden" 
        accept=".json" 
      />

      {/* Copy Notification Toast */}
      {copyToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <i className="fa-solid fa-circle-check text-base"></i>
          <span>{copyToast}</span>
        </div>
      )}
      
      {/* Sidebar Navigation */}
      <aside className={`no-print bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-80' : 'w-0'}`}>
        <div className="p-6 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
              <i className="fa-solid fa-fish-fins text-2xl"></i>
              <span>Fishbone Pro</span>
            </h1>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 rounded-md">
              v1.4
            </span>
          </div>

          {/* Domain Framework Selector */}
          <div className="mb-6 bg-slate-100/70 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between">
              <span>Domain Framework</span>
              {framework === 'software' && (
                <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-extrabold">Active</span>
              )}
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {(Object.keys(FRAMEWORK_CATEGORIES) as DomainFramework[]).map((fKey) => {
                const info = FRAMEWORK_CATEGORIES[fKey];
                const isSelected = framework === fKey;
                return (
                  <button
                    key={fKey}
                    onClick={() => setFramework(fKey)}
                    className={`flex items-center gap-2.5 py-2 px-3 text-xs font-bold rounded-xl transition-all text-left ${
                      isSelected 
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-200 dark:border-indigo-800' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <i className={`fa-solid ${info.icon} text-sm w-4 text-center`}></i>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">{info.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preset Software Templates Button */}
          <div className="mb-6">
            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-bug"></i>
              <span>Load Software Defect Samples</span>
            </button>
          </div>

          {/* Analysis Workspace Mode Switcher */}
          <div className="mb-6">
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Analysis Workspace</label>
            <div className="grid grid-cols-1 gap-1.5">
              <button onClick={() => setMethod(AnalysisMethod.FISHBONE)} className={`flex items-center gap-3 py-2.5 px-3.5 text-xs font-bold rounded-xl transition-all ${method === AnalysisMethod.FISHBONE ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                <i className="fa-solid fa-diagram-project w-4 text-center"></i>
                Ishikawa (Fishbone)
              </button>
              <button onClick={() => setMethod(AnalysisMethod.FIVE_WHYS)} className={`flex items-center gap-3 py-2.5 px-3.5 text-xs font-bold rounded-xl transition-all ${method === AnalysisMethod.FIVE_WHYS ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                <i className="fa-solid fa-list-ol w-4 text-center"></i>
                Multi-Level 5 Whys
              </button>
              <button onClick={() => setMethod(AnalysisMethod.DELAY_PATH)} className={`flex items-center gap-3 py-2.5 px-3.5 text-xs font-bold rounded-xl transition-all ${method === AnalysisMethod.DELAY_PATH ? 'bg-orange-600 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                <i className="fa-solid fa-timeline w-4 text-center"></i>
                Time Delay Pathway
              </button>
            </div>
          </div>

          {/* Target Problem Statement */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Target Defect / Problem</label>
            </div>
            <textarea 
              value={problem} 
              onChange={(e) => setProblem(e.target.value)} 
              placeholder="Enter software defect or incident description..." 
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 dark:text-slate-200 outline-none h-24 transition-all resize-none shadow-inner" 
            />
          </div>

          {/* Quick Copy Action */}
          <div className="mb-6">
            <button
              onClick={copyToClipboard}
              className="w-full py-2.5 px-3 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-copy text-indigo-500"></i>
              <span>Copy Ishikawa to Clipboard</span>
            </button>
          </div>

          {/* Manual Candidate Causes Input */}
          {method === AnalysisMethod.FISHBONE && (
            <div className="mb-6">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Input Candidate Causes</label>
              <form onSubmit={handleAddManualCause} className="mb-3">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newCauseText} 
                    onChange={(e) => setNewCauseText(e.target.value)} 
                    placeholder="New cause item..." 
                    className="flex-1 p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                  <button type="submit" className="bg-indigo-600 text-white px-3.5 rounded-xl hover:bg-indigo-700 transition-colors">
                    <i className="fa-solid fa-plus text-xs"></i>
                  </button>
                </div>
              </form>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {unassignedCauses.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No unassigned causes. Drag or edit causes on the diagram.</p>
                ) : (
                  unassignedCauses.map(cause => (
                    <CauseCard key={cause.id} cause={cause} onDelete={deleteCause} onEdit={(newText) => updateCauseText(cause.id, newText)} onToggleWorkingOn={toggleWorkingOn} />
                  ))
                )}
              </div>
            </div>
          )}

          <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
             <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
               <div className="flex items-center gap-2 mb-2">
                 <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs">
                   <i className="fa-solid fa-lightbulb"></i>
                 </div>
                 <h4 className="font-black text-slate-800 dark:text-slate-200 text-[9px] uppercase tracking-[0.2em]">Framework Tip</h4>
               </div>
               <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                 {activeFrameworkInfo.description}
               </p>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Analysis Stage */}
      <main className="flex-1 flex flex-col relative overflow-hidden print:overflow-visible print:block print:h-auto">
        <header className="no-print h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 shadow-sm z-20">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-9 h-9 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-indigo-50 transition-colors">
               <i className={`fa-solid ${isSidebarOpen ? 'fa-chevron-left' : 'fa-chevron-right'}`}></i>
             </button>
             <div className="flex flex-col">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Analysis Framework & Mode</span>
               <div className="flex items-center gap-2">
                 <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                   {activeFrameworkInfo.name}
                 </span>
                 <span className="text-xs text-slate-300 dark:text-slate-600">•</span>
                 <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                   {method === AnalysisMethod.FISHBONE ? 'Ishikawa Diagram' : method === AnalysisMethod.FIVE_WHYS ? '5 Whys Drill-down' : 'Timeline Latency'}
                 </span>
               </div>
             </div>
          </div>
          
          <div className="flex items-center gap-2">
             {/* Auto-save Status Badge */}
             <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/60 rounded-full text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 shadow-xs" title="Analysis automatically saved to local storage">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
               <span>Auto-saved {lastAutoSave ? `at ${lastAutoSave}` : ''}</span>
             </div>

             <button onClick={toggleTheme} className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all">
               <i className={`fa-solid ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
             </button>
             
             <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

             <button 
               onClick={copyToClipboard}
               title="Copy to Clipboard" 
               className="text-[10px] font-bold px-3 py-2 bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 rounded-xl hover:bg-indigo-100 transition-all flex items-center gap-1.5 uppercase tracking-wider shadow-sm"
             >
                <i className="fa-solid fa-copy"></i>
                <span>Copy</span>
             </button>

             <button onClick={() => setIsTemplateModalOpen(true)} className="text-[10px] font-bold px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all flex items-center gap-1.5 uppercase tracking-wider">
                <i className="fa-solid fa-bug text-indigo-500"></i>
                <span>Presets</span>
             </button>

             <button onClick={() => fileInputRef.current?.click()} className="text-[10px] font-bold px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all flex items-center gap-1.5 uppercase tracking-wider">
                <i className="fa-solid fa-file-import text-indigo-500"></i>
                Import
             </button>

             <button onClick={exportProject} className="text-[10px] font-bold px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all flex items-center gap-1.5 uppercase tracking-wider">
                <i className="fa-solid fa-floppy-disk text-indigo-500"></i>
                JSON
             </button>

             <button 
               onClick={clearSavedState}
               title="Reset Analysis & Clear Saved Data"
               className="text-[10px] font-bold px-2.5 py-2 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-all flex items-center gap-1 uppercase tracking-wider"
             >
               <i className="fa-solid fa-rotate-left text-xs"></i>
               <span className="hidden md:inline">Reset</span>
             </button>

             <button onClick={exportToWord} title="Export as Word" className="w-9 h-9 flex items-center justify-center bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 transition-all">
                <i className="fa-solid fa-file-word text-base"></i>
             </button>

             <button onClick={() => window.print()} title="Save as PDF" className="w-9 h-9 flex items-center justify-center border border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-50 transition-all">
                <i className="fa-solid fa-file-pdf text-base"></i>
             </button>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-y-auto print:p-0 print:overflow-visible transition-colors">
          <div className="max-w-5xl mx-auto w-full flex flex-col gap-10 print:gap-16 print:m-0 print:max-w-none">
            
            <div className="hidden print:block">
              <div className="flex justify-between items-start border-b-4 border-indigo-600 pb-6">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tighter">{activeFrameworkInfo.name}</h1>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Root Cause Incident Analysis Report</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-slate-400 uppercase mb-1">Dossier Date</p>
                  <p className="text-base font-bold text-slate-800">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
              <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Subject Defect Statement</h3>
                <p className="text-xl font-bold text-slate-800">{problem || "No problem statement defined."}</p>
              </div>

              {/* PDF Table of Contents - Generated when analysis contains all three modes (Fishbone, 5 Whys, and Latency) */}
              {(causes.length > 0 && fiveWhys.some(w => w.trim().length > 0) && delaySteps.length > 0) && (
                <div className="pdf-toc-container mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                  <h3 className="pdf-toc-title text-sm font-black text-slate-900 uppercase tracking-wider border-b-2 border-indigo-600 pb-2 mb-4">
                    Document Table of Contents
                  </h3>
                  <ul className="pdf-toc-list space-y-3">
                    <li className="pdf-toc-item flex items-center justify-between font-bold text-sm text-slate-800">
                      <span>1. Ishikawa Fishbone Diagram ({activeFrameworkInfo.name})</span>
                      <span className="pdf-toc-dots flex-1 border-b-2 border-dotted border-slate-300 mx-3"></span>
                      <span className="text-xs font-extrabold uppercase text-indigo-600">Section 1</span>
                    </li>
                    <li className="pdf-toc-item flex items-center justify-between font-bold text-sm text-slate-800">
                      <span>2. Multi-Level 5 Whys Root Cause Analysis</span>
                      <span className="pdf-toc-dots flex-1 border-b-2 border-dotted border-slate-300 mx-3"></span>
                      <span className="text-xs font-extrabold uppercase text-indigo-600">Section 2</span>
                    </li>
                    <li className="pdf-toc-item flex items-center justify-between font-bold text-sm text-slate-800">
                      <span>3. Latency & Delay Pathway Timeline</span>
                      <span className="pdf-toc-dots flex-1 border-b-2 border-dotted border-slate-300 mx-3"></span>
                      <span className="text-xs font-extrabold uppercase text-indigo-600">Section 3</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Ishikawa Section */}
            <section className={`analysis-section ${method === AnalysisMethod.FISHBONE ? 'block' : 'hidden print:block'}`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
                  <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 print:hidden">
                    <i className="fa-solid fa-fish"></i>
                  </div>
                  <span>1. Ishikawa Diagram ({activeFrameworkInfo.name})</span>
                </h2>

                <div className="no-print flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">Switch Framework:</span>
                  {(Object.keys(FRAMEWORK_CATEGORIES) as DomainFramework[]).map((fKey) => (
                    <button
                      key={fKey}
                      onClick={() => setFramework(fKey)}
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg transition-all ${
                        framework === fKey 
                          ? 'bg-indigo-600 text-white shadow-sm' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {fKey}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-8 rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 bg-white">
                <FishboneDiagram 
                  problem={problem} 
                  causes={causes} 
                  activeCategories={activeFrameworkInfo.categories}
                  frameworkName={activeFrameworkInfo.name}
                  onDrop={assignCategory} 
                  onDeleteCause={deleteCause} 
                  onEditCause={updateCauseText} 
                  onToggleWorkingOn={toggleWorkingOn} 
                  onCopySummary={copyToClipboard}
                  theme={theme} 
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:block print:space-y-12">
                <div className="break-inside-avoid">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Categorical Summary</h3>
                  <SummaryTable causes={causes} activeCategories={activeFrameworkInfo.categories} />
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

            {/* 5 Whys Section */}
            <section className={`analysis-section page-break ${method === AnalysisMethod.FIVE_WHYS ? 'block' : 'hidden print:block'}`}>
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3 mb-6">
                <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 print:hidden">
                  <i className="fa-solid fa-list-check"></i>
                </div>
                <span>2. Multi-Level 5 Whys Drill-Down</span>
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

            {/* Time Delay Pathway Section */}
            <section className={`analysis-section page-break ${method === AnalysisMethod.DELAY_PATH ? 'block' : 'hidden print:block'}`}>
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3 mb-6">
                <div className="w-9 h-9 bg-orange-100 dark:bg-orange-900/40 rounded-xl flex items-center justify-center text-orange-600 dark:text-orange-400 print:hidden">
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
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Fishbone Pro | Software Defect Analytical Suite</p>
            </div>
          </div>
        </div>
      </main>

      {/* Software Defect Template Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <i className="fa-solid fa-bug text-lg"></i>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Software Defect Scenarios</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Load a pre-configured Ishikawa defect analysis template</p>
                </div>
              </div>
              <button 
                onClick={() => setIsTemplateModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 py-2">
              {SOFTWARE_DEFECT_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => loadTemplate(tmpl)}
                  className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-xl cursor-pointer transition-all hover:shadow-md group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {tmpl.title}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-md">
                      {tmpl.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                    "{tmpl.problem}"
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span><i className="fa-solid fa-diagram-nested text-indigo-500 mr-1"></i> {tmpl.causes.length} causes</span>
                    <span>•</span>
                    <span><i className="fa-solid fa-list-ol text-indigo-500 mr-1"></i> 5 Whys drilldown</span>
                    <span>•</span>
                    <span><i className="fa-solid fa-check-double text-indigo-500 mr-1"></i> Verification items</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
