import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  PanelRightOpen, 
  PanelRightClose, 
  Eye, 
  EyeOff, 
  Zap,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SidebarMode } from "@/hooks/useSidebar";

interface SidebarToggleProps {
  mode: SidebarMode;
  isVisible: boolean;
  isExpanded: boolean;
  onModeChange: (mode: SidebarMode) => void;
  onToggle: () => void;
  hasSelectedTask: boolean;
}

const modeConfig = {
  'auto-hide': {
    label: 'Auto-ocultar',
    description: 'Se muestra solo al seleccionar tareas',
    icon: Zap,
    color: 'text-blue-600 dark:text-blue-400'
  },
  'always-visible': {
    label: 'Siempre visible',
    description: 'Panel siempre abierto',
    icon: Eye,
    color: 'text-green-600 dark:text-green-400'
  },
  'always-hidden': {
    label: 'Siempre oculto',
    description: 'Panel siempre cerrado',
    icon: EyeOff,
    color: 'text-gray-600 dark:text-gray-400'
  }
};

export function SidebarToggle({ 
  mode, 
  isVisible, 
  isExpanded, 
  onModeChange, 
  onToggle,
  hasSelectedTask 
}: SidebarToggleProps) {
  const config = modeConfig[mode];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      {/* Toggle rápido */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className={cn(
          "h-8 w-8 p-0 transition-all duration-200",
          isExpanded ? "text-primary" : "text-muted-foreground"
        )}
        title={isExpanded ? "Ocultar panel" : "Mostrar panel"}
      >
        {isExpanded ? (
          <PanelRightClose className="h-4 w-4" />
        ) : (
          <PanelRightOpen className="h-4 w-4" />
        )}
      </Button>

      {/* Configuración avanzada */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 px-2 text-xs"
          >
            <Icon className={cn("h-3 w-3", config.color)} />
            <span className="hidden sm:inline">{config.label}</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex items-center gap-2">
            <PanelRightOpen className="h-4 w-4" />
            Modo del Panel
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {Object.entries(modeConfig).map(([key, config]) => {
            const ModeIcon = config.icon;
            const isActive = mode === key;
            
            return (
              <DropdownMenuItem
                key={key}
                onClick={() => onModeChange(key as SidebarMode)}
                className={cn(
                  "flex items-start gap-3 cursor-pointer",
                  isActive && "bg-accent"
                )}
              >
                <ModeIcon className={cn("h-4 w-4 mt-0.5", config.color)} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{config.label}</span>
                    {isActive && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        Activo
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {config.description}
                  </p>
                </div>
              </DropdownMenuItem>
            );
          })}
          
          <DropdownMenuSeparator />
          
          <div className="px-2 py-1.5">
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Estado:</span>
                <span className={isVisible ? "text-green-600" : "text-gray-500"}>
                  {isVisible ? "Visible" : "Oculto"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tarea seleccionada:</span>
                <span className={hasSelectedTask ? "text-blue-600" : "text-gray-500"}>
                  {hasSelectedTask ? "Sí" : "No"}
                </span>
              </div>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
