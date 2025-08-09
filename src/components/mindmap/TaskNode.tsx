import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, ChevronDown, ChevronRight, Focus, PlusCircle, Trash2 } from "lucide-react";
import type { NodeProps } from "@xyflow/react";

export type Status = "pendiente" | "en_progreso" | "hecho";

export type TaskData = {
  title: string;
  status: Status;
  dueDate?: string; // ISO date
  progress: number; // 0-100
  collapsed?: boolean;
  highlight?: "overdue" | "soon" | null;
  onAddChild?: (id: string) => void;
  onToggleCollapse?: (id: string) => void;
  onFocus?: (id: string) => void;
  onDelete?: (id: string) => void;
};

const statusLabel: Record<Status, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  hecho: "Hecho",
};

function statusVariant(status: Status) {
  switch (status) {
    case "pendiente":
      return "secondary" as const;
    case "en_progreso":
      return "default" as const;
    case "hecho":
      return "outline" as const;
  }
}

const TaskNode = memo(({ id, data, selected }: NodeProps) => {
  const d = data as TaskData;
  const ringClass = d.highlight === "overdue"
    ? "ring-2 ring-destructive"
    : d.highlight === "soon"
      ? "ring-2 ring-sidebar-ring"
      : selected
        ? "ring-1 ring-primary"
        : "";

  return (
    <article className={`w-[260px] max-w-[280px] bg-card text-card-foreground rounded-lg overflow-hidden ${ringClass}`}>
      <header className="p-3 border-b">
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center justify-center shrink-0"
            aria-label={d.collapsed ? "Expandir" : "Colapsar"}
            onClick={() => d.onToggleCollapse?.(id)}
          >
            {d.collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <h3 className="font-semibold line-clamp-1">{d.title}</h3>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <Badge variant={statusVariant(d.status)}>{statusLabel[d.status]}</Badge>
          {d.dueDate && (
            <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="h-3 w-3" />
              <time dateTime={d.dueDate}>{new Date(d.dueDate).toLocaleDateString()}</time>
            </div>
          )}
        </div>
      </header>
      <div className="p-3 flex flex-col gap-2">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span>Progreso</span>
            <span>{Math.round(d.progress)}%</span>
          </div>
          <Progress value={d.progress} />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Button size="sm" variant="secondary" onClick={() => d.onAddChild?.(id)}>
            <PlusCircle className="h-4 w-4 mr-1" /> Subtarea
          </Button>
          <Button size="sm" variant="ghost" onClick={() => d.onFocus?.(id)}>
            <Focus className="h-4 w-4 mr-1" /> Foco
          </Button>
          <Button size="sm" variant="ghost" onClick={() => d.onDelete?.(id)} aria-label="Eliminar">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </article>
  );
});

export default TaskNode;
