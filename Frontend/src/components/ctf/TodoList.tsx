import { useState } from "react";
import {
  Plus,
  Trash2,
  Check,
  X,
  Edit2,
  Network,
  Server,
  Monitor,
  Bug,
  Shield,
  MoreHorizontal,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Flame,
  Search,
  Maximize2,
  Minimize2,
  Eye,
  FileUp,
} from "lucide-react";
import type { Task, TaskCategory, TaskStatus } from "@/types/ctf";

interface TodoListProps {
  tasks: Task[];
  onAdd: (content: string, category: TaskCategory, details?: string, notes?: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onClearDone: () => void;
  onUpdateTask: (
    id: string,
    content: string,
    category: TaskCategory,
    status: TaskStatus,
    details?: string,
    notes?: string,
  ) => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
  onOpenNmapImport?: () => void;
}

const categoryConfig: Record<TaskCategory, { icon: React.ElementType; label: string; color: string }> = {
  ports: { icon: Network, label: "Ports", color: "text-neon-cyan" },
  service: { icon: Server, label: "Service", color: "text-neon-orange" },
  host: { icon: Monitor, label: "Host", color: "text-primary" },
  exploit: { icon: Bug, label: "Exploit", color: "text-destructive" },
  privesc: { icon: Shield, label: "PrivEsc", color: "text-warning" },
  other: { icon: MoreHorizontal, label: "Other", color: "text-muted-foreground" },
};

const statusConfig: Record<TaskStatus, { icon: React.ElementType; label: string; color: string; bgColor: string }> = {
  verified: { icon: CheckCircle2, label: "Verified", color: "text-success", bgColor: "bg-success/20" },
  "low-priority": { icon: Circle, label: "Low Priority", color: "text-warning", bgColor: "bg-warning/20" },
  important: { icon: Flame, label: "Important", color: "text-destructive", bgColor: "bg-destructive/20" },
  "no-findings": { icon: AlertTriangle, label: "No Findings", color: "text-muted-foreground", bgColor: "bg-muted/50" },
};

export function TodoList({
  tasks,
  onAdd,
  onToggle,
  onDelete,
  onClearDone,
  onUpdateTask,
  isMaximized = false,
  onToggleMaximize,
  onOpenNmapImport,
}: TodoListProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterCategory, setFilterCategory] = useState<TaskCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [newTask, setNewTask] = useState({
    content: "",
    category: "other" as TaskCategory,
    status: "low-priority" as TaskStatus,
    details: "",
    notes: "",
  });

  const handleAdd = () => {
    if (newTask.content.trim()) {
      onAdd(newTask.content.trim(), newTask.category, newTask.details.trim(), newTask.notes.trim());
      setNewTask({ content: "", category: "other", status: "low-priority", details: "", notes: "" });
      setAddDialogOpen(false);
    }
  };

  const handleSaveEdit = () => {
    if (editingTask) {
      onUpdateTask(
        editingTask.id,
        editingTask.content,
        editingTask.category,
        editingTask.status,
        editingTask.details,
        editingTask.notes,
      );
      setEditingTask(null);
    }
  };

  const cycleStatus = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    const statuses: TaskStatus[] = ["verified", "low-priority", "important", "no-findings"];
    const currentIndex = statuses.indexOf(task.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    onUpdateTask(task.id, task.content, task.category, nextStatus, task.details, task.notes);
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesCategory = filterCategory === "all" || task.category === filterCategory;
    const matchesSearch = task.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const groupedTasks = filteredTasks.reduce(
    (acc, task) => {
      if (!acc[task.category]) acc[task.category] = [];
      acc[task.category].push(task);
      return acc;
    },
    {} as Record<TaskCategory, Task[]>,
  );

  return (
    <div className={`terminal-panel p-3 flex flex-col ${isMaximized ? "fixed inset-4 z-50" : "h-full"}`}>
      {isMaximized && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm -z-10" onClick={onToggleMaximize} />
      )}

      <div className="px-2 py-2 border-b border-sidebar-border">
        <div className="flex items-center justify-center mb-2">
          <h2 className="text-xs font-bold text-sidebar-foreground tracking-wide uppercase border-b-2 border-primary pb-1">
            You Have&nbsp;&nbsp;&nbsp;{tasks.length} tasks
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setAddDialogOpen(true)}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-[10px] font-medium rounded bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
          {onOpenNmapImport && (
            <button
              onClick={onOpenNmapImport}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-[10px] font-medium rounded bg-muted hover:bg-accent transition-colors text-muted-foreground"
              title="Import Nmap XML results"
            >
              <FileUp className="w-2 h-2" />
              Nmap
            </button>
          )}
          {onToggleMaximize && (
            <button
              onClick={onToggleMaximize}
              className="p-1 rounded hover:bg-accent transition-colors"
              title={isMaximized ? "Restore" : "Maximize"}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="ctf-input pl-7 text-xs w-full"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as TaskCategory | "all")}
          className="ctf-select text-xs"
        >
          <option value="all">All Categories</option>
          {Object.entries(categoryConfig).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-250px)] space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            No tasks found. Click "+Add" to create one!
          </div>
        ) : filterCategory === "all" ? (
          Object.entries(groupedTasks).map(([category, categoryTasks]) => {
            const config = categoryConfig[category as TaskCategory];
            const Icon = config.icon;
            return (
              <div key={category} className="border border-border rounded-lg overflow-hidden">
                <div className={`flex items-center gap-2 px-3 py-2 bg-secondary ${config.color}`}>
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-semibold">{config.label}</span>
                  <span className="text-xs text-muted-foreground">({categoryTasks.length})</span>
                </div>
                <div className="divide-y divide-border/50">
                  {categoryTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={onToggle}
                      onDelete={onDelete}
                      onEdit={setEditingTask}
                      onView={setViewingTask}
                      onCycleStatus={cycleStatus}
                    />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="divide-y divide-border/50">
              {filteredTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onEdit={setEditingTask}
                  onView={setViewingTask}
                  onCycleStatus={cycleStatus}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
        <button
          onClick={() => tasks.filter((t) => !t.completed).forEach((t) => onToggle(t.id))}
          className="ctf-button text-xs"
        >
          Toggle ✓
        </button>
        <button onClick={onClearDone} className="ctf-button text-xs">
          Clear Done
        </button>
      </div>

      {addDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setAddDialogOpen(false)} />
          <div className="relative bg-card border-2 border-[hsl(var(--panel-border))] rounded-lg shadow-xl w-full max-w-lg animate-slide-in p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-primary">Add New Task</h3>
              <button onClick={() => setAddDialogOpen(false)} className="p-1 rounded hover:bg-accent">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Task Title *</label>
                <input
                  type="text"
                  value={newTask.content}
                  onChange={(e) => setNewTask({ ...newTask, content: e.target.value })}
                  placeholder="e.g., Check SSH on port 22..."
                  className="ctf-input w-full"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                  <select
                    value={newTask.category}
                    onChange={(e) => setNewTask({ ...newTask, category: e.target.value as TaskCategory })}
                    className="ctf-select w-full"
                  >
                    {Object.entries(categoryConfig).map(([key, { label }]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                  <select
                    value={newTask.status}
                    onChange={(e) => setNewTask({ ...newTask, status: e.target.value as TaskStatus })}
                    className="ctf-select w-full"
                  >
                    {Object.entries(statusConfig).map(([key, { label }]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Details</label>
                <textarea
                  value={newTask.details}
                  onChange={(e) => setNewTask({ ...newTask, details: e.target.value })}
                  placeholder="Commands, IP addresses, ports, services..."
                  className="ctf-input w-full resize-none h-20"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
                <textarea
                  value={newTask.notes}
                  onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                  placeholder="Additional observations, hints, references..."
                  className="ctf-input w-full resize-none h-20"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setAddDialogOpen(false)} className="ctf-button">
                Cancel
              </button>
              <button onClick={handleAdd} className="ctf-button-primary" disabled={!newTask.content.trim()}>
                <Plus className="w-4 h-4 mr-1" />
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setViewingTask(null)} />
          <div className="relative bg-card border-2 border-[hsl(var(--panel-border))] rounded-lg shadow-xl w-full max-w-lg animate-slide-in p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {(() => {
                  const config = categoryConfig[viewingTask.category];
                  const Icon = config.icon;
                  return <Icon className={`w-5 h-5 ${config.color}`} />;
                })()}
                <h3 className="text-sm font-semibold">{viewingTask.content}</h3>
              </div>
              <button onClick={() => setViewingTask(null)} className="p-1 rounded hover:bg-accent">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Category:</span>
                  <span className={`text-xs font-medium ${categoryConfig[viewingTask.category].color}`}>
                    {categoryConfig[viewingTask.category].label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Status:</span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded ${statusConfig[viewingTask.status].bgColor} ${statusConfig[viewingTask.status].color}`}
                  >
                    {statusConfig[viewingTask.status].label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Completed:</span>
                  <span className={`text-xs font-medium ${viewingTask.completed ? "text-success" : "text-warning"}`}>
                    {viewingTask.completed ? "Yes" : "No"}
                  </span>
                </div>
              </div>

              {viewingTask.details && (
                <div className="bg-secondary/50 rounded-lg p-3">
                  <label className="text-xs text-muted-foreground mb-1 block font-semibold">Details</label>
                  <pre className="text-sm font-mono whitespace-pre-wrap text-foreground">{viewingTask.details}</pre>
                </div>
              )}

              {viewingTask.notes && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <label className="text-xs text-muted-foreground mb-1 block font-semibold">Notes</label>
                  <p className="text-sm whitespace-pre-wrap text-foreground">{viewingTask.notes}</p>
                </div>
              )}

              {!viewingTask.details && !viewingTask.notes && (
                <div className="text-center text-muted-foreground text-sm py-4">
                  No additional details or notes for this task.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setViewingTask(null)} className="ctf-button">
                Close
              </button>
              <button
                onClick={() => {
                  setEditingTask(viewingTask);
                  setViewingTask(null);
                }}
                className="ctf-button-primary"
              >
                <Edit2 className="w-4 h-4 mr-1" />
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setEditingTask(null)} />
          <div className="relative bg-card border-2 border-[hsl(var(--panel-border))] rounded-lg shadow-xl w-full max-w-lg animate-slide-in p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-primary">Edit Task</h3>
              <button onClick={() => setEditingTask(null)} className="p-1 rounded hover:bg-accent">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Task Title</label>
                <input
                  type="text"
                  value={editingTask.content}
                  onChange={(e) => setEditingTask({ ...editingTask, content: e.target.value })}
                  className="ctf-input w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                  <select
                    value={editingTask.category}
                    onChange={(e) => setEditingTask({ ...editingTask, category: e.target.value as TaskCategory })}
                    className="ctf-select w-full"
                  >
                    {Object.entries(categoryConfig).map(([key, { label }]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                  <select
                    value={editingTask.status}
                    onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value as TaskStatus })}
                    className="ctf-select w-full"
                  >
                    {Object.entries(statusConfig).map(([key, { label }]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Details</label>
                <textarea
                  value={editingTask.details || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, details: e.target.value })}
                  placeholder="Commands, IP addresses, ports, services..."
                  className="ctf-input w-full resize-none h-20"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
                <textarea
                  value={editingTask.notes || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, notes: e.target.value })}
                  placeholder="Additional observations, hints, references..."
                  className="ctf-input w-full resize-none h-20"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditingTask(null)} className="ctf-button">
                Cancel
              </button>
              <button onClick={handleSaveEdit} className="ctf-button-primary">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskItem({
  task,
  onToggle,
  onDelete,
  onEdit,
  onView,
  onCycleStatus,
}: {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onView: (task: Task) => void;
  onCycleStatus: (task: Task, e: React.MouseEvent) => void;
}) {
  const statusCfg = statusConfig[task.status];
  const StatusIcon = statusCfg.icon;
  const hasDetails = task.details || task.notes;

  return (
    <div
      className={`px-3 py-2 cursor-pointer hover:bg-muted/20 transition-colors ${task.completed ? "bg-muted/30" : ""}`}
      onClick={() => onView(task)}
    >
      {/* Row 1: Checkbox + Title */}
      <div className="flex items-start gap-2 mb-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(task.id);
          }}
          className="flex-shrink-0 mt-0.5"
        >
          <div
            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
              task.completed ? "bg-success border-success" : "border-muted-foreground hover:border-primary"
            }`}
          >
            {task.completed && <Check className="w-2.5 h-2.5 text-success-foreground" />}
          </div>
        </button>

        {/* Title - small readable font, full text visible */}
        <span
          className={`text-[11px] leading-snug flex-1 ${
            task.completed ? "line-through text-muted-foreground" : "text-foreground"
          }`}
          title={task.content}
        >
          {task.content}
        </span>
      </div>

      {/* Row 2: Status badge + Details indicator + Action buttons */}
      <div className="flex items-center justify-between gap-2 ml-6">
        <div className="flex items-center gap-2">
          {/* Status Badge - always visible */}
          <button
            onClick={(e) => onCycleStatus(task, e)}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${statusCfg.bgColor} ${statusCfg.color} hover:opacity-80 transition-opacity`}
          >
            <StatusIcon className="w-2.5 h-2.5" />
            <span>{statusCfg.label}</span>
          </button>

          {/* Has details indicator */}
          {hasDetails && <span className="text-[10px] text-muted-foreground">📝</span>}
        </div>

        {/* Action buttons - always visible */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(task);
            }}
            className="p-1 rounded hover:bg-accent text-primary transition-colors"
            title="View details"
          >
            <Eye className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Edit task"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            className="p-1 rounded hover:bg-destructive/20 text-destructive transition-colors"
            title="Delete task"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
