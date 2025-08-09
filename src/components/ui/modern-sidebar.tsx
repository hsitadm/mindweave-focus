import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Calendar,
  Clock,
  FileText,
  Plus,
  Trash2,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Circle,
  PlayCircle,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task, Status } from "@/pages/Index";

interface ModernSidebarProps {
  selectedTask?: Task;
  onUpdateTask: (field: keyof Task, value: any) => void;
  onAddSubtask: () => void;
  onDeleteTask: () => void;
  onClose?: () => void;
  className?: string;
  isVisible?: boolean;
  isExpanded?: boolean;
}

const statusConfig = {
  pendiente: {
    label: "Pendiente",
    icon: Circle,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/20"
  },
  en_progreso: {
    label: "En Progreso", 
    icon: PlayCircle,
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/20"
  },
  hecho: {
    label: "Completado",
    icon: CheckCircle2,
    color: "text-green-600", 
    bgColor: "bg-green-100 dark:bg-green-900/20"
  }
};

function getProgressColor(progress: number) {
  if (progress >= 100) return "text-green-600";
  if (progress >= 75) return "text-blue-600";
  if (progress >= 50) return "text-yellow-600";
  return "text-gray-500";
}

function getDaysUntilDue(dueDate?: string) {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const now = new Date();
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function ModernSidebar({ 
  selectedTask, 
  onUpdateTask, 
  onAddSubtask, 
  onDeleteTask,
  onClose,
  className,
  isVisible = true,
  isExpanded = true
}: ModernSidebarProps) {
  if (!isVisible) return null;

  if (!selectedTask) {
    return (
      <aside className={cn(
        "glass border-l h-full overflow-hidden transition-all duration-300",
        isExpanded ? "w-[400px] opacity-100" : "w-0 opacity-0",
        className
      )}>
        <div className={cn(
          "p-6 h-full flex flex-col items-center justify-center text-center transition-all duration-300",
          isExpanded ? "translate-x-0" : "translate-x-full"
        )}>
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <Target className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Selecciona una tarea</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Haz clic en cualquier nodo del mapa mental para ver y editar sus detalles aquí.
          </p>
        </div>
      </aside>
    );
  }

  const statusInfo = statusConfig[selectedTask.status];
  const StatusIcon = statusInfo.icon;
  const daysUntilDue = getDaysUntilDue(selectedTask.dueDate);
  const progressColor = getProgressColor(selectedTask.progress);

  return (
    <aside className={cn(
      "glass border-l h-full overflow-hidden transition-all duration-300",
      isExpanded ? "w-[400px] opacity-100" : "w-0 opacity-0",
      className
    )}>
      <div className={cn(
        "w-[400px] transition-all duration-300",
        isExpanded ? "translate-x-0" : "translate-x-full"
      )}>
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <StatusIcon className={cn("h-5 w-5", statusInfo.color)} />
                <Badge variant="secondary" className={statusInfo.bgColor}>
                  {statusInfo.label}
                </Badge>
              </div>
              <h2 className="text-xl font-bold leading-tight">
                {selectedTask.title}
              </h2>
            </div>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Progress Overview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className={cn("h-4 w-4", progressColor)} />
                <span className="text-sm font-medium">Progreso</span>
              </div>
              <span className={cn("text-lg font-bold", progressColor)}>
                {Math.round(selectedTask.progress)}%
              </span>
            </div>
            <div className="space-y-2">
              <Slider 
                value={[selectedTask.progress]} 
                onValueChange={([value]) => onUpdateTask("progress", value)}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Título
              </Label>
              <Input 
                id="title"
                value={selectedTask.title} 
                onChange={(e) => onUpdateTask("title", e.target.value)}
                className="font-medium"
              />
            </div>

            {/* Status and Due Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Circle className="h-4 w-4" />
                  Estado
                </Label>
                <Select 
                  value={selectedTask.status} 
                  onValueChange={(value: Status) => onUpdateTask("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([key, config]) => {
                      const Icon = config.icon;
                      return (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Icon className={cn("h-4 w-4", config.color)} />
                            {config.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Vencimiento
                </Label>
                <Input 
                  type="date" 
                  value={selectedTask.dueDate ?? ""} 
                  onChange={(e) => onUpdateTask("dueDate", e.target.value || undefined)}
                />
                {daysUntilDue !== null && (
                  <div className={cn(
                    "flex items-center gap-1 text-xs px-2 py-1 rounded-md",
                    daysUntilDue < 0 ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300" :
                    daysUntilDue <= 2 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300" :
                    "bg-muted text-muted-foreground"
                  )}>
                    <Clock className="h-3 w-3" />
                    {daysUntilDue < 0 ? `Vencido hace ${Math.abs(daysUntilDue)} días` :
                     daysUntilDue === 0 ? "Vence hoy" :
                     daysUntilDue === 1 ? "Vence mañana" :
                     `Vence en ${daysUntilDue} días`}
                  </div>
                )}
              </div>
            </div>

            {/* Next Steps */}
            <div className="space-y-2">
              <Label htmlFor="nextSteps" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Próximos pasos
              </Label>
              <Textarea 
                id="nextSteps"
                value={selectedTask.nextSteps ?? ""} 
                onChange={(e) => onUpdateTask("nextSteps", e.target.value)}
                placeholder="¿Qué necesitas hacer a continuación?"
                rows={3}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Notas
              </Label>
              <Textarea 
                id="notes"
                value={selectedTask.notes ?? ""} 
                onChange={(e) => onUpdateTask("notes", e.target.value)}
                placeholder="Notas adicionales, ideas, recursos..."
                rows={4}
              />
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-3">
            <Button 
              onClick={onAddSubtask}
              className="w-full gap-2 gradient-primary text-white hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" />
              Añadir Subtarea
            </Button>
            
            <Button 
              variant="destructive" 
              onClick={onDeleteTask}
              className="w-full gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar Tarea
            </Button>
          </div>

          {/* Task Info */}
          <div className="pt-4 border-t border-border/50">
            <div className="text-xs text-muted-foreground space-y-1">
              <div>ID: {selectedTask.id.slice(0, 8)}...</div>
              {selectedTask.parentId && (
                <div>Subtarea de: {selectedTask.parentId.slice(0, 8)}...</div>
              )}
            </div>
          </div>
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
}
