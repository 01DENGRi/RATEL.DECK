import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { CheatSheetData, CheatCategory } from '@/data/cheatsheets';

interface AddCheatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cheat: CheatSheetData) => void;
}

const defaultColors = ['#00d4aa', '#ff6b6b', '#4ade80', '#f59e0b', '#8b5cf6', '#3b82f6', '#374151'];

export function AddCheatDialog({ isOpen, onClose, onSave }: AddCheatDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    note: '',
    color: '#00d4aa',
  });
  const [fileContent, setFileContent] = useState<CheatCategory[] | null>(null);
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setFormData({ name: '', note: '', color: '#00d4aa' });
      setFileContent(null);
      setFileName('');
    }
  }, [isOpen]);

  const handleFileSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            // Support multiple formats
            if (data.categories) {
              setFileContent(data.categories);
              if (data.name && !formData.name) {
                setFormData(prev => ({ ...prev, name: data.name }));
              }
            } else if (Array.isArray(data)) {
              setFileContent(data);
            } else {
              setFileContent([{ name: 'Commands', commands: Object.entries(data).map(([title, command]) => ({ title, command: String(command) })) }]);
            }
          } catch {
            alert('Invalid JSON file format');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const newCheat: CheatSheetData = {
      id: `custom-${Date.now()}`,
      name: formData.name.trim(),
      color: formData.color,
      categories: fileContent || [{ 
        name: 'Notes', 
        commands: formData.note ? [{ title: 'Note', command: formData.note }] : [] 
      }],
    };

    onSave(newCheat);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-card border border-border rounded-lg shadow-xl w-full max-w-md animate-slide-in">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary rounded-t-lg">
          <h3 className="text-sm font-semibold text-foreground">Add Cheat</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-[80px_1fr] items-center gap-3">
            <label className="text-sm text-muted-foreground">Name:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Cheat sheet name"
              className="ctf-input"
              required
            />
          </div>

          <div className="grid grid-cols-[80px_1fr] items-center gap-3">
            <label className="text-sm text-muted-foreground">File path:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={fileName}
                placeholder="Select JSON file..."
                className="ctf-input flex-1"
                readOnly
              />
              <button
                type="button"
                onClick={handleFileSelect}
                className="ctf-button whitespace-nowrap"
              >
                Browse...
              </button>
            </div>
          </div>

          <div className="grid grid-cols-[80px_1fr] items-center gap-3">
            <label className="text-sm text-muted-foreground">Note:</label>
            <input
              type="text"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Optional note (small)"
              className="ctf-input"
            />
          </div>

          <div className="grid grid-cols-[80px_1fr] items-center gap-3">
            <label className="text-sm text-muted-foreground">Color:</label>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {defaultColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-6 h-6 rounded border-2 transition-all ${
                      formData.color === color ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'color';
                  input.value = formData.color;
                  input.onchange = (e) => setFormData({ ...formData, color: (e.target as HTMLInputElement).value });
                  input.click();
                }}
                className="ctf-button text-xs"
              >
                Pick...
              </button>
            </div>
          </div>

          {fileContent && (
            <div className="bg-secondary/50 rounded p-2 text-xs text-muted-foreground">
              ✓ Loaded {fileContent.length} categories from file
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <button type="button" onClick={onClose} className="ctf-button">
              Cancel
            </button>
            <button type="submit" className="ctf-button-primary">
              OK
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
