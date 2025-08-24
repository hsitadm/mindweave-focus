import { memo, useState, useRef, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  CalendarDays, 
  ChevronDown, 
  ChevronRight, 
  Focus, 
  PlusCircle, 
  Trash2,
  Clock,
  CheckCircle2,
  Circle,
  PlayCircle,
  Move3D,
  Target,
  FolderOpen,
  Eye,
  EyeOff
} from "lucide-react";
import { Handle, Position, NodeResizer } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";

export type Status = "pendiente" | "en_progreso" | "hecho";

// Paleta de colores para proyectos (duplicada para uso en TaskNode)
const PROJECT_COLOR_SCHEMES = [
  {
    name: "blue",
    primary: "#3B82F6",
    light: "#DBEAFE", 
    dark: "#1E40AF",
    border: "border-blue-500",
    bg: "bg-blue-50",
    text: "text-blue-700",
    progress: "from-blue-400 to-blue-600"
  },
  {
    name: "green", 
    primary: "#10B981",
    light: "#D1FAE5",
    dark: "#047857",
    border: "border-green-500",
    bg: "bg-green-50", 
    text: "text-green-700",
    progress: "from-green-400 to-green-600"
  },
  {
    name: "orange",
    primary: "#F59E0B", 
    light: "#FEF3C7",
    dark: "#D97706",
    border: "border-orange-500",
    bg: "bg-orange-50",
    text: "text-orange-700", 
    progress: "from-orange-400 to-orange-600"
  },
  {
    name: "purple",
    primary: "#8B5CF6",
    light: "#EDE9FE", 
    dark: "#7C3AED",
    border: "border-purple-500",
    bg: "bg-purple-50",
    text: "text-purple-700",
    progress: "from-purple-400 to-purple-600"
  },
  {
    name: "pink",
    primary: "#EC4899",
    light: "#FCE7F3",
    dark: "#BE185D", 
    border: "border-pink-500",
    bg: "bg-pink-50",
    text: "text-pink-700",
    progress: "from-pink-400 to-pink-600"
  },
  {
    name: "indigo",
    primary: "#6366F1",
    light: "#E0E7FF",
    dark: "#4F46E5",
    border: "border-indigo-500", 
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    progress: "from-indigo-400 to-indigo-600"
  },
  {
    name: "teal",
    primary: "#14B8A6",
    light: "#CCFBF1",
    dark: "#0F766E",
    border: "border-teal-500",
    bg: "bg-teal-50", 
    text: "text-teal-700",
    progress: "from-teal-400 to-teal-600"
  },
  {
    name: "red",
    primary: "#EF4444", 
    light: "#FEE2E2",
    dark: "#DC2626",
    border: "border-red-500",
    bg: "bg-red-50",
    text: "text-red-700",
    progress: "from-red-400 to-red-600"
  }
];

// Helper function to get color scheme
const getColorScheme = (colorName?: string) => {
  return PROJECT_COLOR_SCHEMES.find(scheme => scheme.name === colorName) || PROJECT_COLOR_SCHEMES[0];
};

export type TaskData = {
  title: string;
  status: Status;
  dueDate?: string; // ISO date
  progress: number; // 0-100
  collapsed?: boolean;
  highlight?: "overdue" | "soon" | null;
  width?: number;
  height?: number;
  hiddenChildrenCount?: number;
  isSearchResult?: boolean;
  inFocus?: boolean;
  isParentTask?: boolean; // Nueva propiedad para identificar tareas padre
  colorScheme?: string; // Nueva propiedad para esquema de color
  onAddChild?: (id: string) => void;
  onToggleCollapse?: (id: string) => void;
  onFocus?: (id: string) => void;
  onDelete?: (id: string) => void;
  onResize?: (id: string, width: number, height: number) => void;
  onToggleFocus?: (id: string) => void; // Nueva acción para modo enfoque
  onDrillDown?: (id: string) => void; // Nueva acción para drill-down
};

const statusConfig = {
  pendiente: {
    label: "Pendiente",
    variant: "secondary" as const,
    icon: Circle,
    className: "status-pending"
  },
  en_progreso: {
    label: "En Progreso",
    variant: "default" as const,
    icon: PlayCircle,
    className: "status-progress"
  },
  hecho: {
    label: "Completado",
    variant: "outline" as const,
    icon: CheckCircle2,
    className: "status-done"
  }
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return `Vencido hace ${Math.abs(diffDays)} días`;
  if (diffDays === 0) return "Vence hoy";
  if (diffDays === 1) return "Vence mañana";
  if (diffDays <= 7) return `Vence en ${diffDays} días`;
  
  return date.toLocaleDateString('es-ES', { 
    month: 'short', 
    day: 'numeric' 
  });
}

const TaskNode = memo(({ id, data, selected }: NodeProps) => {
  const d = data as TaskData;
  const config = statusConfig[d.status];
  const StatusIcon = config.icon;
  const [isResizing, setIsResizing] = useState(false);
  
  // Get color scheme for this task
  const colorScheme = getColorScheme(d.colorScheme);
  
  // Default dimensions
  const width = d.width || 280;
  const height = d.height || 200;
  
  const cardClasses = cn(
    "bg-card/95 backdrop-blur-sm text-card-foreground rounded-xl overflow-hidden transition-all duration-300 hover:shadow-soft",
    "border-2 relative",
    {
      "ring-2 ring-red-500/50 shadow-red-500/20": d.highlight === "overdue",
      "ring-2 ring-yellow-500/50 shadow-yellow-500/20": d.highlight === "soon",
      "ring-2 ring-primary/50 shadow-primary/20": selected,
      "ring-2 ring-blue-400/60 shadow-blue-400/30 bg-blue-50/50 dark:bg-blue-950/20": d.isSearchResult && !selected,
      "hover:scale-[1.02]": !selected && !isResizing,
      "scale-[1.02]": selected
    }
  );
  
  // Apply project color to border
  const borderStyle = {
    borderColor: colorScheme.primary,
    borderWidth: '2px'
  };

  // Dynamic progress color based on project color scheme
  const progressStyle = {
    background: `linear-gradient(90deg, ${colorScheme.primary}80, ${colorScheme.primary})`
  };

  const handleResize = useCallback((event: any, params: any) => {
    const newWidth = Math.max(250, params.width);
    const newHeight = Math.max(180, params.height);
    d.onResize?.(id, newWidth, newHeight);
  }, [id, d]);

  return (
    <article 
      className={cardClasses}
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        ...borderStyle
      }}
    >
      {/* Node Resizer */}
      <NodeResizer
        color="#8b5cf6"
        isVisible={selected}
        minWidth={250}
        minHeight={180}
        onResize={handleResize}
        onResizeStart={() => setIsResizing(true)}
        onResizeEnd={() => setIsResizing(false)}
      />

      <Handle 
        type="target" 
        position={Position.Left} 
        className="!w-3 !h-3 !bg-primary/60 !border-2 !border-white" 
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!w-3 !h-3 !bg-primary/60 !border-2 !border-white" 
      />
      
      {/* Resize Indicator */}
      {selected && (
        <div className="absolute top-2 right-2 opacity-50 pointer-events-none">
          <Move3D className="h-4 w-4 text-primary" />
        </div>
      )}
      
      {/* Header */}
      <header 
        className="p-4 border-b border-border/50"
        style={{ 
          backgroundColor: colorScheme.light,
          borderBottomColor: colorScheme.primary + '40' // 40 = 25% opacity
        }}
      >
        <div className="flex items-start gap-3">
          <div className="relative">
            <button
              className="inline-flex items-center justify-center shrink-0 nodrag mt-0.5 hover:bg-accent rounded-md p-1 transition-colors"
              aria-label={d.collapsed ? "Expandir" : "Colapsar"}
              onClick={(e) => { 
                e.stopPropagation(); 
                d.onToggleCollapse?.(id); 
              }}
            >
              {d.collapsed ? 
                <ChevronRight className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              }
            </button>
            
            {/* Contador de subtareas ocultas */}
            {d.collapsed && d.hiddenChildrenCount && d.hiddenChildrenCount > 0 && (
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium animate-scale-in">
                {d.hiddenChildrenCount > 9 ? '9+' : d.hiddenChildrenCount}
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 
              className="font-semibold text-sm leading-tight mb-2"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: Math.max(2, Math.floor((height - 120) / 40)),
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {d.title}
            </h3>
            
            <div className="flex items-center justify-between">
              <Badge 
                variant={config.variant} 
                className={cn("gap-1.5 text-xs", config.className)}
              >
                <StatusIcon className="h-3 w-3" />
                {config.label}
              </Badge>
              
              {d.dueDate && (
                <div className={cn(
                  "inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md",
                  d.highlight === "overdue" ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300" :
                  d.highlight === "soon" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300" :
                  "bg-muted text-muted-foreground"
                )}>
                  <Clock className="h-3 w-3" />
                  <time dateTime={d.dueDate}>
                    {formatDate(d.dueDate)}
                  </time>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 flex flex-col justify-between" style={{ height: `${height - 80}px` }}>
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">Progreso</span>
            <span className="font-semibold">{Math.round(d.progress)}%</span>
          </div>
          <div className="relative">
            <Progress value={d.progress} className="h-2" />
            <div 
              className="absolute top-0 left-0 h-2 rounded-full transition-all duration-500"
              style={{ 
                width: `${d.progress}%`,
                ...progressStyle
              }}
            />
          </div>
        </div>

        {/* Spacer for larger cards */}
        {height > 220 && (
          <div className="flex-1 min-h-4" />
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5 mt-4">
          <Button 
            size="sm" 
            variant="secondary" 
            className="nodrag flex-1 gap-1.5 h-8 text-xs hover:shadow-soft transition-all duration-200" 
            onClick={(e) => { 
              e.stopPropagation(); 
              d.onAddChild?.(id); 
            }}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            {width > 250 ? "Subtarea" : "+"}
          </Button>
          
          <Button 
            size="sm" 
            variant="ghost" 
            className="nodrag h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-all duration-200" 
            onClick={(e) => { 
              e.stopPropagation(); 
              d.onFocus?.(id); 
            }}
            title="Modo Foco"
          >
            <Focus className="h-3.5 w-3.5" />
          </Button>

          {/* Botón de Enfoque */}
          <Button 
            size="sm" 
            variant={d.inFocus ? "secondary" : "ghost"}
            className={cn(
              "nodrag h-8 w-8 p-0 transition-all duration-200",
              d.inFocus 
                ? "bg-orange-100 text-orange-600 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400" 
                : "hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-900/20"
            )}
            onClick={(e) => { 
              e.stopPropagation(); 
              d.onToggleFocus?.(id); 
            }}
            title={d.inFocus ? "Quitar del enfoque" : "Agregar al enfoque"}
          >
            <Target className="h-3.5 w-3.5" />
          </Button>

          {/* Botón de Drill-down (solo para tareas padre) */}
          {d.isParentTask && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="nodrag h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 transition-all duration-200" 
              onClick={(e) => { 
                e.stopPropagation(); 
                d.onDrillDown?.(id); 
              }}
              title="Ver proyecto completo"
            >
              <FolderOpen className="h-3.5 w-3.5" />
            </Button>
          )}
          
          <Button 
            size="sm" 
            variant="ghost" 
            className="nodrag h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-all duration-200" 
            onClick={(e) => { 
              e.stopPropagation(); 
              d.onDelete?.(id); 
            }}
            title="Eliminar"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Search Result Indicator */}
      {d.isSearchResult && (
        <div className="absolute -top-1 -left-1 h-3 w-3 bg-blue-500 rounded-full animate-pulse" />
      )}

      {/* Focus Mode Indicator */}
      {d.inFocus && (
        <div className="absolute -top-1 -right-1 h-3 w-3 bg-orange-500 rounded-full animate-pulse">
          <Target className="h-2 w-2 text-white absolute top-0.5 left-0.5" />
        </div>
      )}

      {/* Completion Indicator */}
      {d.status === "hecho" && (
        <div className="absolute -top-2 -right-2 h-6 w-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-scale-in">
          <CheckCircle2 className="h-4 w-4 text-white" />
        </div>
      )}

      {/* Priority Indicator */}
      {d.highlight === "overdue" && (
        <div className="absolute -top-1 -left-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
      )}
      {d.highlight === "soon" && (
        <div className="absolute -top-1 -left-1 h-3 w-3 bg-yellow-500 rounded-full animate-pulse" />
      )}
    </article>
  );
});

TaskNode.displayName = "TaskNode";

export default TaskNode;
