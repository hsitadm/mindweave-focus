import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  ChevronRight, 
  Eye, 
  FolderOpen, 
  Target,
  ArrowLeft,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ViewState, ViewMode } from "@/pages/Index";

interface ViewNavigationProps {
  viewState: ViewState;
  onNavigateToBreadcrumb: (breadcrumbId: string) => void;
  onNavigateToOverview: () => void;
  onNavigateToFocusMode: () => void;
  focusedTasksCount: number;
  className?: string;
}

const viewModeConfig = {
  overview: {
    label: "Vista General",
    icon: Layers,
    description: "Solo tareas padre",
    color: "text-blue-600"
  },
  project: {
    label: "Vista de Proyecto", 
    icon: FolderOpen,
    description: "Proyecto completo",
    color: "text-green-600"
  },
  focus: {
    label: "Modo Enfoque",
    icon: Target,
    description: "Tareas en foco",
    color: "text-orange-600"
  }
};

export function ViewNavigation({ 
  viewState, 
  onNavigateToBreadcrumb, 
  onNavigateToOverview,
  onNavigateToFocusMode,
  focusedTasksCount,
  className 
}: ViewNavigationProps) {
  const currentConfig = viewModeConfig[viewState.mode];
  const CurrentIcon = currentConfig.icon;

  return (
    <div className={cn("flex items-center justify-between p-4 border-b bg-muted/30", className)}>
      {/* Breadcrumbs y Vista Actual */}
      <div className="flex items-center gap-3">
        {/* Indicador de Vista Actual */}
        <div className="flex items-center gap-2">
          <CurrentIcon className={cn("h-4 w-4", currentConfig.color)} />
          <span className="font-medium text-sm">{currentConfig.label}</span>
          <Badge variant="outline" className="text-xs">
            {currentConfig.description}
          </Badge>
        </div>

        {/* Breadcrumbs */}
        {viewState.breadcrumbs.length > 0 && (
          <>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <nav className="flex items-center gap-1">
              {viewState.breadcrumbs.map((breadcrumb, index) => (
                <div key={breadcrumb.id} className="flex items-center gap-1">
                  {index > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                  <button
                    onClick={() => onNavigateToBreadcrumb(breadcrumb.id)}
                    className={cn(
                      "text-sm hover:text-primary transition-colors",
                      index === viewState.breadcrumbs.length - 1 
                        ? "text-foreground font-medium" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {breadcrumb.title}
                  </button>
                </div>
              ))}
            </nav>
          </>
        )}
      </div>

      {/* Controles de Navegación */}
      <div className="flex items-center gap-2">
        {/* Botón Volver (para cualquier vista que no sea overview) */}
        {viewState.mode !== "overview" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onNavigateToOverview}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a General
          </Button>
        )}

        {/* Filtros Rápidos */}
        <div className="flex items-center gap-1 border rounded-md p-1">
          <Button
            variant={viewState.mode === "overview" ? "secondary" : "ghost"}
            size="sm"
            onClick={onNavigateToOverview}
            className="gap-1 h-7 px-2"
          >
            <Layers className="h-3 w-3" />
            <span className="hidden sm:inline">General</span>
          </Button>
          
          <Button
            variant={viewState.mode === "focus" ? "secondary" : "ghost"}
            size="sm"
            onClick={onNavigateToFocusMode}
            className="gap-1 h-7 px-2 relative"
          >
            <Target className="h-3 w-3" />
            <span className="hidden sm:inline">Enfoque</span>
            {focusedTasksCount > 0 && (
              <Badge 
                variant="secondary" 
                className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs"
              >
                {focusedTasksCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
