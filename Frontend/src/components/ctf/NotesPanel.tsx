import { useState } from 'react';
import { Save, FolderOpen, Image, FileText, Edit3 } from 'lucide-react';
import { toast } from 'sonner';
import { HTBReportTemplate } from './HTBReportTemplate';

interface NotesPanelProps {
  notes: string;
  onChange: (notes: string) => void;
  onSave: () => void;
  onLoad: () => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

export function NotesPanel({ notes, onChange, onSave, onLoad, isMaximized = false, onToggleMaximize }: NotesPanelProps) {
  const [showReport, setShowReport] = useState(false);

  const handleInsertScreenshot = () => {
    toast.info('Screenshot insertion would open file picker in desktop app');
  };

  if (showReport) {
    return (
      <div className={`terminal-panel flex flex-col overflow-hidden ${isMaximized ? 'fixed inset-4 z-50' : 'h-full'}`}>
        {isMaximized && (
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm -z-10"
            onClick={onToggleMaximize}
          />
        )}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
          <span className="text-sm font-semibold text-foreground">📋 HTB Report Template</span>
          <button
            onClick={() => setShowReport(false)}
            className="p-1.5 rounded hover:bg-accent transition-colors text-xs flex items-center gap-1"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Quick Notes
          </button>
        </div>
        <HTBReportTemplate />
      </div>
    );
  }

  return (
    <div className={`terminal-panel p-3 flex flex-col overflow-hidden ${isMaximized ? 'fixed inset-4 z-50' : 'h-full'}`}>
      {isMaximized && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm -z-10"
          onClick={onToggleMaximize}
        />
      )}

      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
        <span className="text-sm font-semibold text-foreground">Notes / Screenshots</span>
        <button
          onClick={() => setShowReport(true)}
          className="p-1.5 rounded hover:bg-accent transition-colors text-xs flex items-center gap-1"
          title="Open HTB Report Template"
        >
          <FileText className="w-3.5 h-3.5" />
          Report
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <textarea
          value={notes}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write your notes here...

• Findings
• Credentials discovered
• Exploitation steps
• Important observations"
          className="ctf-input w-full h-full resize-none min-h-[200px] text-sm"
        />
      </div>

      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border flex-wrap">
        <button onClick={handleInsertScreenshot} className="ctf-button flex items-center gap-1.5 text-xs">
          <Image className="w-3 h-3" />
          Screenshot
        </button>
        <button onClick={onSave} className="ctf-button flex items-center gap-1.5 text-xs">
          <Save className="w-3 h-3" />
          Save
        </button>
        <button onClick={onLoad} className="ctf-button flex items-center gap-1.5 text-xs">
          <FolderOpen className="w-3 h-3" />
          Load
        </button>
      </div>
    </div>
  );
}
