import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  FileJson, Download, FileText, Code, Plus, Search, Edit3, Eye, 
  RotateCcw, ChevronDown, ChevronUp, ChevronRight, User, Image, Trash2, 
  GripVertical, X, Save
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


interface Screenshot {
  id: string;
  dataUrl: string;
  caption: string;
  timestamp: number;
}

interface ReportSection {
  id: string;
  title: string;
  content: string;
  screenshots: Screenshot[];
  isCollapsed: boolean;
  order: number;
}

interface MachineInfo {
  name: string;
  ip: string;
  os: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Insane' | '';
  points: string;
  releaseDate: string;
  retireDate: string;
  creator: string;
  userFlag: string;
  rootFlag: string;
}

interface ReportData {
  machineInfo: MachineInfo;
  sections: ReportSection[];
  createdAt: number;
  updatedAt: number;
  author: string;
}

function MachineInfoField({
  label,
  value,
  placeholder,
  isEditing,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  isEditing: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground uppercase">{label}</label>
      {isEditing ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || label}
          className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      ) : (
        <p className="text-sm font-medium">
          {value || <span className="text-muted-foreground italic">Not set</span>}
        </p>
      )}
    </div>
  );
}


const defaultMachineInfo: MachineInfo = {
  name: '', ip: '', os: '', difficulty: '', points: '',
  releaseDate: '', retireDate: '', creator: '', userFlag: '', rootFlag: '',
};

const defaultSections: ReportSection[] = [
  { id: 'recon', title: '🔍 Reconnaissance', content: '## Initial Scanning\n\n```bash\nnmap -sC -sV -oA nmap/initial <IP>\n```\n\n### Open Ports\n\n| Port | Service | Version |\n|------|---------|--------|\n| 22 | SSH | OpenSSH 8.x |\n| 80 | HTTP | nginx 1.x |\n\n', screenshots: [], isCollapsed: false, order: 0 },
  { id: 'enumeration', title: '📋 Enumeration', content: '## Web Enumeration\n\n```bash\ngobuster dir -u http://<IP> -w /usr/share/wordlists/dirb/common.txt\n```\n\n### Findings\n\n- \n\n', screenshots: [], isCollapsed: false, order: 1 },
  { id: 'foothold', title: '🚀 Foothold', content: '## Vulnerability Identified\n\n**CVE:** \n**Type:** \n\n## Exploitation\n\n```bash\n# Exploit command\n```\n\n', screenshots: [], isCollapsed: false, order: 2 },
  { id: 'privesc', title: '⬆️ Privilege Escalation', content: '## Enumeration\n\n```bash\nsudo -l\nfind / -perm -4000 2>/dev/null\n```\n\n## Vector Found\n\n**Type:** \n\n', screenshots: [], isCollapsed: false, order: 3 },
  { id: 'flags', title: '🚩 Proof / Flags', content: '## User Flag\n\n```\ncat /home/user/user.txt\n```\n\n**Flag:** `user_flag_here`\n\n## Root Flag\n\n```\ncat /root/root.txt\n```\n\n**Flag:** `root_flag_here`\n\n', screenshots: [], isCollapsed: false, order: 4 },
  { id: 'notes', title: '📝 Additional Notes', content: '## Lessons Learned\n\n- \n\n## Tools Used\n\n- nmap\n- gobuster\n\n', screenshots: [], isCollapsed: false, order: 5 },
];

const createEmptyReport = (): ReportData => ({
  machineInfo: { ...defaultMachineInfo },
  sections: defaultSections.map(s => ({ ...s, screenshots: [] })),
  createdAt: Date.now(), updatedAt: Date.now(), author: '',
});

function exportToMarkdown(reportData: ReportData): string {
  const { machineInfo, sections, author } = reportData;
  let md = `# ${machineInfo.name || 'HTB Machine'} - Write-Up\n\n`;
  md += `> **Author:** ${author || 'Anonymous'}\n> **Date:** ${new Date(reportData.createdAt).toLocaleDateString()}\n\n---\n\n`;
  md += `## Machine Information\n\n| Property | Value |\n|----------|-------|\n`;
  md += `| **Name** | ${machineInfo.name || '-'} |\n| **IP** | ${machineInfo.ip || '-'} |\n| **OS** | ${machineInfo.os || '-'} |\n| **Difficulty** | ${machineInfo.difficulty || '-'} |\n\n`;
  md += `### Flags\n\n- **User Flag:** \`${machineInfo.userFlag || 'N/A'}\`\n- **Root Flag:** \`${machineInfo.rootFlag || 'N/A'}\`\n\n---\n\n`;
  
  sections.sort((a, b) => a.order - b.order).forEach(section => {
    md += `# ${section.title}\n\n${section.content}\n\n---\n\n`;
  });
  return md;
}

function exportToHTML(reportData: ReportData): string {
  const { machineInfo, sections, author } = reportData;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${machineInfo.name || 'HTB'} - Write-Up</title>
<style>body{font-family:system-ui;background:#0a0a0a;color:#fafafa;padding:2rem;max-width:900px;margin:0 auto}
h1,h2,h3{margin-top:1.5rem}pre{background:#141414;padding:1rem;border-radius:0.5rem;overflow-x:auto}
code{font-family:monospace}.section{background:#141414;border:1px solid #262626;border-radius:0.5rem;padding:1rem;margin:1rem 0}</style></head>
<body><h1>${machineInfo.name || 'HTB Machine'}</h1><p>By ${author || 'Anonymous'}</p>
<div class="section"><h2>Machine Info</h2><p>IP: ${machineInfo.ip || '-'} | OS: ${machineInfo.os || '-'} | Difficulty: ${machineInfo.difficulty || '-'}</p>
<p>User Flag: <code>${machineInfo.userFlag || '---'}</code></p><p>Root Flag: <code>${machineInfo.rootFlag || '---'}</code></p></div>
${sections.sort((a, b) => a.order - b.order).map(s => `<div class="section"><h2>${s.title}</h2><div>${s.content.replace(/\n/g, '<br>')}</div></div>`).join('')}
</body></html>`;
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


function MarkdownPreview({ content }: { content: string }) {
  return (
    <div className="prose prose-invert prose-sm max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const isInline = !className;
            if (isInline) {
              return <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-primary" {...props}>{children}</code>;
            }
            return (
              <pre className="bg-background/80 border border-border rounded-lg p-4 overflow-x-auto">
                <code className="text-xs font-mono" {...props}>{children}</code>
              </pre>
            );
          },
          table({ children }) { return <div className="overflow-x-auto my-4"><table className="min-w-full border border-border rounded-lg">{children}</table></div>; },
          th({ children }) { return <th className="bg-muted px-4 py-2 text-left text-xs font-semibold border-b border-border">{children}</th>; },
          td({ children }) { return <td className="px-4 py-2 text-sm border-b border-border/50">{children}</td>; },
          h2({ children }) { return <h2 className="text-lg font-semibold text-foreground mt-5 mb-2">{children}</h2>; },
          h3({ children }) { return <h3 className="text-base font-medium text-foreground mt-4 mb-2">{children}</h3>; },
          p({ children }) { return <p className="text-sm text-muted-foreground my-2">{children}</p>; },
          strong({ children }) { return <strong className="font-semibold text-foreground">{children}</strong>; },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}


function SectionComponent({ section, onUpdate, onDelete, searchQuery = '' }: {
  section: ReportSection;
  onUpdate: (s: ReportSection) => void;
  onDelete?: (id: string) => void;
  searchQuery?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState(section.content);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newSS: Screenshot = {
          id: `ss-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          dataUrl: event.target?.result as string,
          caption: file.name.replace(/\.[^/.]+$/, ''),
          timestamp: Date.now(),
        };
        onUpdate({ ...section, screenshots: [...section.screenshots, newSS] });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const isMatch = searchQuery && (section.title.toLowerCase().includes(searchQuery.toLowerCase()) || section.content.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className={cn('border border-border rounded-lg overflow-hidden transition-all', isMatch && 'ring-2 ring-primary/50', section.isCollapsed ? 'bg-muted/30' : 'bg-card')}>
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 cursor-pointer hover:bg-muted/70" onClick={() => onUpdate({ ...section, isCollapsed: !section.isCollapsed })}>
        <GripVertical className="w-4 h-4 text-muted-foreground opacity-50" />
        {section.isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        <span className="font-semibold text-sm flex-1">{section.title}</span>
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <button onClick={() => setIsEditing(!isEditing)} className={cn('p-1.5 rounded hover:bg-accent', isEditing && 'bg-accent')} title={isEditing ? 'Preview' : 'Edit'}>
            {isEditing ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="p-1.5 rounded hover:bg-accent" title="Add Screenshot"><Image className="w-3.5 h-3.5" /></button>
          {onDelete && <button onClick={() => onDelete(section.id)} className="p-1.5 rounded hover:bg-destructive/20 hover:text-destructive" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>}
        </div>
      </div>
      {!section.isCollapsed && (
        <div className="p-4">
          {isEditing ? (
            <div className="space-y-3">
              <textarea value={localContent} onChange={(e) => setLocalContent(e.target.value)} className="w-full min-h-[200px] bg-background border border-border rounded-lg p-3 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <div className="flex justify-end gap-2">
                <button onClick={() => { setLocalContent(section.content); setIsEditing(false); }} className="px-3 py-1.5 text-xs bg-muted hover:bg-muted/70 rounded">Cancel</button>
                <button onClick={() => { onUpdate({ ...section, content: localContent }); setIsEditing(false); }} className="px-3 py-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded">Save</button>
              </div>
            </div>
          ) : <MarkdownPreview content={section.content} />}
          {section.screenshots.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase">Screenshots ({section.screenshots.length})</h4>
              <div className="grid grid-cols-2 gap-3">
                {section.screenshots.map((ss) => (
                  <div key={ss.id} className="relative group border border-border rounded-lg overflow-hidden bg-background">
                    <img src={ss.dataUrl} alt={ss.caption} className="w-full h-32 object-cover" />
                    <button onClick={() => onUpdate({ ...section, screenshots: section.screenshots.filter(s => s.id !== ss.id) })} className="absolute top-2 right-2 p-1 bg-destructive/80 rounded opacity-0 group-hover:opacity-100"><X className="w-3 h-3 text-white" /></button>
                    <input type="text" value={ss.caption} onChange={(e) => onUpdate({ ...section, screenshots: section.screenshots.map(s => s.id === ss.id ? { ...s, caption: e.target.value } : s) })} className="w-full px-2 py-1.5 text-xs bg-muted border-t border-border" placeholder="Caption..." />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleScreenshotUpload} className="hidden" />
    </div>
  );
}


function MachineInfoCard({ info, onUpdate, isEditing }: { info: MachineInfo; onUpdate: (i: MachineInfo) => void; isEditing: boolean }) {
  const handleChange = (field: keyof MachineInfo, value: string) => onUpdate({ ...info, [field]: value });
  
  const difficultyColors: Record<string, string> = { Easy: 'bg-primary/20 text-primary border-primary/30', Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', Hard: 'bg-destructive/20 text-destructive border-destructive/30', Insane: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <div className="bg-gradient-to-r from-primary/20 to-primary/5 px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={info.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Machine Name"
                className="text-xl font-bold bg-transparent border-b border-dashed border-muted-foreground/30 focus:outline-none focus:border-primary w-full"
              />
            ) : (
              <h2 className="text-xl font-bold">{info.name || "Untitled Machine"}</h2>
            )}
          </div>
          {(info.difficulty || isEditing) && (
            isEditing ? <select value={info.difficulty} onChange={(e) => handleChange('difficulty', e.target.value)} className="bg-background border border-border rounded px-2 py-1 text-sm"><option value="">Select Difficulty</option><option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option><option value="Insane">Insane</option></select>
            : <span className={cn('px-3 py-1 rounded-full text-xs font-semibold border', difficultyColors[info.difficulty] || 'bg-muted')}>{info.difficulty}</span>
          )}
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MachineInfoField
            label="IP Address"
            value={info.ip}
            placeholder="10.10.10.x"
            isEditing={isEditing}
            onChange={(v) => handleChange("ip", v)}
          />
          <MachineInfoField
            label="OS"
            value={info.os}
            placeholder="Linux / Windows"
            isEditing={isEditing}
            onChange={(v) => handleChange("os", v)}
          />
          <MachineInfoField
            label="Points"
            value={info.points}
            placeholder="20"
            isEditing={isEditing}
            onChange={(v) => handleChange("points", v)}
          />
          <MachineInfoField
            label="Creator"
            value={info.creator}
            isEditing={isEditing}
            onChange={(v) => handleChange("creator", v)}
          />
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">🚩 Captured Flags</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">User Flag</label>
              {isEditing ? (
                <input
                  type="text"
                  value={info.userFlag}
                  onChange={(e) => handleChange("userFlag", e.target.value)}
                  placeholder="User flag hash"
                  className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm font-mono focus:outline-none"
                />
              ) : (
                <code className="block text-sm font-mono text-primary bg-primary/10 px-2 py-1.5 rounded border border-primary/20">
                  {info.userFlag || "---"}
                </code>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Root Flag</label>
              {isEditing ? (
                <input
                  type="text"
                  value={info.rootFlag}
                  onChange={(e) => handleChange("rootFlag", e.target.value)}
                  placeholder="Root flag hash"
                  className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm font-mono focus:outline-none"
                />
              ) : (
                <code className="block text-sm font-mono text-destructive bg-destructive/10 px-2 py-1.5 rounded border border-destructive/20">
                  {info.rootFlag || "---"}
                </code>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


const STORAGE_KEY = 'htb-report-data';

export function HTBReportTemplate() {
  const [reportData, setReportData] = useState<ReportData>(() => {
    try { const saved = localStorage.getItem(STORAGE_KEY); return saved ? JSON.parse(saved) : createEmptyReport(); } catch { return createEmptyReport(); }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [allCollapsed, setAllCollapsed] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timeout = setTimeout(() => localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...reportData, updatedAt: Date.now() })), 500);
    return () => clearTimeout(timeout);
  }, [reportData]);

  const handleExport = async (format: 'md' | 'html' | 'json') => {
    const machineName = reportData.machineInfo.name || 'HTB-Report';
    try {
      if (format === 'md') { downloadFile(exportToMarkdown(reportData), `${machineName}-writeup.md`, 'text/markdown'); toast.success('Markdown exported!'); }
      else if (format === 'html') { downloadFile(exportToHTML(reportData), `${machineName}-writeup.html`, 'text/html'); toast.success('HTML exported!'); }
      else if (format === 'json') { downloadFile(JSON.stringify(reportData, null, 2), `${machineName}-report.json`, 'application/json'); toast.success('JSON exported!'); }
    } catch (err) { toast.error(`Export failed: ${err}`); }
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string) as Partial<ReportData>;
        setReportData({ machineInfo: { ...reportData.machineInfo, ...imported.machineInfo }, sections: imported.sections?.length ? imported.sections.map((s, i) => ({ ...defaultSections[i] || {}, ...s, screenshots: s.screenshots || [] })) : reportData.sections, author: imported.author || reportData.author, createdAt: imported.createdAt || Date.now(), updatedAt: Date.now() });
        toast.success('Report imported!');
      } catch { toast.error('Failed to parse JSON'); }
    };
    reader.readAsText(file); e.target.value = '';
  };

  const toggleAllSections = () => {
    const newCollapsed = !allCollapsed;
    setAllCollapsed(newCollapsed);
    setReportData(prev => ({ ...prev, sections: prev.sections.map(s => ({ ...s, isCollapsed: newCollapsed })) }));
  };

  const filteredSections = searchQuery ? reportData.sections.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.content.toLowerCase().includes(searchQuery.toLowerCase())) : reportData.sections;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Demo Notice */}
      <p className="text-sm font-semibold text-neon-red px-3 pt-2 drop-shadow-[0_0_10px_hsl(var(--neon-red))] animate-pulse">
        ⚠ Under Development
      </p>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 p-3 border-b border-border bg-muted/30 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="pl-8 pr-3 py-1.5 text-xs bg-background border border-border rounded w-40 focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <button onClick={() => setIsEditingInfo(!isEditingInfo)} className={cn('p-1.5 rounded hover:bg-accent', isEditingInfo && 'bg-accent')} title={isEditingInfo ? 'View' : 'Edit'}>
            {isEditingInfo ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
          </button>
          <button onClick={toggleAllSections} className="p-1.5 rounded hover:bg-accent" title={allCollapsed ? 'Expand' : 'Collapse'}>
            {allCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-background border border-border rounded">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
            <input type="text" value={reportData.author} onChange={(e) => setReportData(prev => ({ ...prev, author: e.target.value }))} placeholder="Author" className="bg-transparent text-xs w-20 focus:outline-none" />
          </div>
          <button onClick={() => fileInputRef.current?.click()} className="ctf-button flex items-center gap-1.5 text-xs"><FileJson className="w-3.5 h-3.5" />Import</button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><button className="ctf-button flex items-center gap-1.5 text-xs"><Download className="w-3.5 h-3.5" />Export</button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => handleExport('md')}><FileText className="w-4 h-4 mr-2" />Markdown</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('html')}><Code className="w-4 h-4 mr-2" />HTML</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('json')}><FileJson className="w-4 h-4 mr-2" />JSON</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button onClick={() => { if (confirm('Reset report?')) { setReportData(createEmptyReport()); localStorage.removeItem(STORAGE_KEY); toast.success('Reset'); } }} className="p-1.5 rounded hover:bg-destructive/20 hover:text-destructive" title="Reset"><RotateCcw className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Report Content */}
      <div className="flex-1 overflow-y-auto p-4" ref={reportRef}>
        <div className="max-w-4xl mx-auto space-y-4">
          <MachineInfoCard info={reportData.machineInfo} onUpdate={(info) => setReportData(prev => ({ ...prev, machineInfo: info }))} isEditing={isEditingInfo} />
          {filteredSections.sort((a, b) => a.order - b.order).map(section => (
            <SectionComponent key={section.id} section={section} onUpdate={(s) => setReportData(prev => ({ ...prev, sections: prev.sections.map(sec => sec.id === s.id ? s : sec) }))} onDelete={section.id.startsWith('custom-') ? (id) => setReportData(prev => ({ ...prev, sections: prev.sections.filter(s => s.id !== id) })) : undefined} searchQuery={searchQuery} />
          ))}
          <button onClick={() => setReportData(prev => ({ ...prev, sections: [...prev.sections, { id: `custom-${Date.now()}`, title: '📌 New Section', content: '## Overview\n\n', screenshots: [], isCollapsed: false, order: prev.sections.length }] }))} className="w-full py-3 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-primary/50 hover:text-primary flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />Add Custom Section
          </button>
        </div>
      </div>
      <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
    </div>
  );
}
