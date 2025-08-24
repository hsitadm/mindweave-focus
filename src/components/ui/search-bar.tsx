import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  X, 
  Filter,
  ChevronDown,
  CheckCircle2,
  Circle,
  PlayCircle,
  Calendar,
  Hash
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Task, Status } from "@/pages/Index";

export interface SearchFilters {
  status: Status[];
  hasDeadline: boolean | null;
  overdue: boolean | null;
}

interface SearchBarProps {
  tasks: Record<string, Task>;
  onSearchResults: (results: string[]) => void;
  onFocusTask: (taskId: string) => void;
  onClearSelection: () => void;
  className?: string;
}

const statusConfig = {
  pendiente: {
    label: "Pendiente",
    icon: Circle,
    color: "text-gray-500"
  },
  en_progreso: {
    label: "En Progreso", 
    icon: PlayCircle,
    color: "text-blue-500"
  },
  hecho: {
    label: "Completado",
    icon: CheckCircle2,
    color: "text-green-500"
  }
};

export function SearchBar({ tasks, onSearchResults, onFocusTask, onClearSelection, className }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    status: [],
    hasDeadline: null,
    overdue: null
  });
  const [results, setResults] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Función de búsqueda
  const performSearch = (term: string, currentFilters: SearchFilters) => {
    if (!term.trim() && currentFilters.status.length === 0 && 
        currentFilters.hasDeadline === null && currentFilters.overdue === null) {
      setResults([]);
      onSearchResults([]);
      return;
    }

    const taskList = Object.values(tasks);
    const filtered = taskList.filter(task => {
      // Filtro de texto
      const matchesText = !term.trim() || 
        task.title.toLowerCase().includes(term.toLowerCase()) ||
        task.notes?.toLowerCase().includes(term.toLowerCase()) ||
        task.nextSteps?.toLowerCase().includes(term.toLowerCase());

      // Filtro de estado
      const matchesStatus = currentFilters.status.length === 0 || 
        currentFilters.status.includes(task.status);

      // Filtro de fecha límite
      const matchesDeadline = currentFilters.hasDeadline === null ||
        (currentFilters.hasDeadline === true && task.dueDate) ||
        (currentFilters.hasDeadline === false && !task.dueDate);

      // Filtro de vencimiento
      const matchesOverdue = currentFilters.overdue === null ||
        (currentFilters.overdue === true && task.dueDate && new Date(task.dueDate) < new Date()) ||
        (currentFilters.overdue === false && (!task.dueDate || new Date(task.dueDate) >= new Date()));

      return matchesText && matchesStatus && matchesDeadline && matchesOverdue;
    });

    const resultIds = filtered.map(task => task.id);
    setResults(resultIds);
    onSearchResults(resultIds);
  };

  // Efecto para búsqueda en tiempo real
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      performSearch(searchTerm, filters);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, filters, tasks]);

  const clearSearch = () => {
    setSearchTerm("");
    setFilters({
      status: [],
      hasDeadline: null,
      overdue: null
    });
    setIsExpanded(false);
    setResults([]);
    onSearchResults([]);
    // Limpiar también la selección actual para cerrar el sidebar
    onClearSelection();
  };

  const toggleStatusFilter = (status: Status) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status]
    }));
  };

  const hasActiveFilters = filters.status.length > 0 || 
    filters.hasDeadline !== null || 
    filters.overdue !== null;

  const totalFilters = filters.status.length + 
    (filters.hasDeadline !== null ? 1 : 0) + 
    (filters.overdue !== null ? 1 : 0);

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center gap-2">
        {/* Barra de búsqueda */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Buscar tareas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            className="pl-10 pr-10 transition-all duration-200"
          />
          {(searchTerm || hasActiveFilters) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-destructive/10"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Botón de filtros */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className={cn(
                "gap-2 relative",
                hasActiveFilters && "border-primary text-primary"
              )}
            >
              <Filter className="h-4 w-4" />
              <ChevronDown className="h-3 w-3" />
              {totalFilters > 0 && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {totalFilters}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Filtrar por Estado</DropdownMenuLabel>
            {Object.entries(statusConfig).map(([status, config]) => {
              const StatusIcon = config.icon;
              return (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={filters.status.includes(status as Status)}
                  onCheckedChange={() => toggleStatusFilter(status as Status)}
                >
                  <StatusIcon className={cn("h-4 w-4 mr-2", config.color)} />
                  {config.label}
                </DropdownMenuCheckboxItem>
              );
            })}
            
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Filtrar por Fecha</DropdownMenuLabel>
            
            <DropdownMenuCheckboxItem
              checked={filters.hasDeadline === true}
              onCheckedChange={(checked) => 
                setFilters(prev => ({ ...prev, hasDeadline: checked ? true : null }))
              }
            >
              <Calendar className="h-4 w-4 mr-2 text-blue-500" />
              Con fecha límite
            </DropdownMenuCheckboxItem>
            
            <DropdownMenuCheckboxItem
              checked={filters.overdue === true}
              onCheckedChange={(checked) => 
                setFilters(prev => ({ ...prev, overdue: checked ? true : null }))
              }
            >
              <Calendar className="h-4 w-4 mr-2 text-red-500" />
              Vencidas
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Resultados de búsqueda */}
      {isExpanded && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          <div className="p-2 border-b bg-muted/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          <div className="p-1">
            {results.slice(0, 10).map(taskId => {
              const task = tasks[taskId];
              if (!task) return null;
              
              const config = statusConfig[task.status];
              const StatusIcon = config.icon;
              
              return (
                <button
                  key={taskId}
                  onClick={() => {
                    onFocusTask(taskId);
                    setIsExpanded(false);
                  }}
                  className="w-full p-2 text-left hover:bg-accent rounded-md transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <StatusIcon className={cn("h-4 w-4", config.color)} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {task.title}
                      </div>
                      {task.dueDate && (
                        <div className="text-xs text-muted-foreground">
                          Vence: {new Date(task.dueDate).toLocaleDateString('es-ES')}
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {config.label}
                    </Badge>
                  </div>
                </button>
              );
            })}
            
            {results.length > 10 && (
              <div className="p-2 text-center text-sm text-muted-foreground border-t">
                Y {results.length - 10} resultado{results.length - 10 !== 1 ? 's' : ''} más...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
