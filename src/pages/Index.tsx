import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  type Node,
  type Edge,
  MarkerType,
  Connection,
  ConnectionMode,
} from "@xyflow/react";
import { toast } from "sonner";
import TaskNode, { TaskData, Status } from "@/components/mindmap/TaskNode";
import { ModernHeaderSimple } from "@/components/ui/modern-header-simple";
import { SaveIndicator } from "@/components/ui/save-indicator";
import { ModernSidebar } from "@/components/ui/modern-sidebar";
import { ViewNavigation } from "@/components/ui/view-navigation";
import { EmptyFocusState } from "@/components/ui/empty-focus-state";
import { loadFromStorage, autoSave, type MindMapData } from "@/lib/storage";
import { useSidebar } from "@/hooks/useSidebar";
import { cn } from "@/lib/utils";

// Types
export type Task = {
  id: string;
  title: string;
  status: Status;
  dueDate?: string;
  progress: number;
  nextSteps?: string;
  notes?: string;
  parentId?: string | null;
  collapsed?: boolean;
  width?: number;
  height?: number;
  inFocus?: boolean; // Nueva propiedad para modo enfoque
  colorScheme?: string; // Nueva propiedad para esquema de color del proyecto
};

// Tipos para vista de capas
export type ViewMode = "overview" | "project" | "focus";

export type ViewState = {
  mode: ViewMode;
  currentProjectId?: string | null;
  breadcrumbs: { id: string; title: string }[];
};

// Paleta de colores para proyectos
export const PROJECT_COLOR_SCHEMES = [
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

const STORAGE_KEY = "mindmap-data-v1";

function nowISO(daysOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().slice(0, 10);
}

// Funciones de storage mejoradas
function loadFromStorageLocal() {
  const data = loadFromStorage();
  return data ? { nodes: data.nodes, edges: data.edges, tasks: data.tasks } : null;
}

function buildInitial(): { nodes: Node[]; edges: Edge[]; tasks: Record<string, Task> } {
  const rootId = crypto.randomUUID();
  const n1: Task = {
    id: rootId,
    title: "Mapa de Proyectos",
    status: "en_progreso",
    dueDate: nowISO(7),
    progress: 35,
    nextSteps: "Definir objetivos clave",
    notes: "Primer borrador del roadmap",
    parentId: null,
    width: 280,
    height: 200,
  };

  const nodes: Node[] = [
    {
      id: n1.id,
      type: "task",
      data: {
        title: n1.title,
        status: n1.status,
        dueDate: n1.dueDate,
        progress: n1.progress,
        width: n1.width,
        height: n1.height,
      } as TaskData,
      position: { x: 0, y: 0 },
    },
  ];
  return { nodes, edges: [], tasks: { [n1.id]: n1 } };
}

const Index = () => {
  // Base graph state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [tasks, setTasks] = useState<Record<string, Task>>({});

  // UI state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isModified, setIsModified] = useState(false);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  
  // View state for layered navigation
  const [viewState, setViewState] = useState<ViewState>({
    mode: "overview",
    currentProjectId: null,
    breadcrumbs: []
  });

  // Sidebar state
  const sidebar = useSidebar({ selectedId });

  // Helpers
  // Helper function to find optimal position for new subtask
  const findOptimalSubtaskPosition = useCallback((parentId: string) => {
    const parent = nodes.find((n) => n.id === parentId);
    if (!parent) return { x: 200, y: 200 };

    // Get all existing children of this parent
    const childrenEdges = edges.filter(e => e.source === parentId);
    const childrenNodes = childrenEdges.map(e => nodes.find(n => n.id === e.target)).filter(Boolean);

    // Base position: to the right of parent
    const baseX = parent.position.x + 350;
    const baseY = parent.position.y;

    // If no children, place at base position
    if (childrenNodes.length === 0) {
      return { x: baseX, y: baseY };
    }

    // Find the lowest Y position among children and place below
    const childrenYPositions = childrenNodes.map(child => child!.position.y);
    const lowestY = Math.max(...childrenYPositions);
    
    return { 
      x: baseX, 
      y: lowestY + 150 // Space below the lowest child
    };
  }, [nodes, edges]);

  // Color management functions
  const getNextAvailableColorScheme = useCallback(() => {
    const parentTasks = Object.values(tasks).filter(t => !t.parentId);
    const usedColors = parentTasks.map(t => t.colorScheme).filter(Boolean);
    
    // Find first unused color scheme
    const availableScheme = PROJECT_COLOR_SCHEMES.find(scheme => 
      !usedColors.includes(scheme.name)
    );
    
    // If all colors are used, cycle back based on number of parent tasks
    if (!availableScheme) {
      const colorIndex = parentTasks.length % PROJECT_COLOR_SCHEMES.length;
      return PROJECT_COLOR_SCHEMES[colorIndex].name;
    }
    
    return availableScheme.name;
  }, [tasks]);

  const getColorScheme = useCallback((colorName: string) => {
    return PROJECT_COLOR_SCHEMES.find(scheme => scheme.name === colorName) || PROJECT_COLOR_SCHEMES[0];
  }, []);

  const getTaskColorScheme = useCallback((taskId: string): string => {
    const task = tasks[taskId];
    if (!task) return PROJECT_COLOR_SCHEMES[0].name;
    
    // If task has a color scheme, use it
    if (task.colorScheme) return task.colorScheme;
    
    // If task has parent, inherit parent's color
    if (task.parentId) {
      return getTaskColorScheme(task.parentId);
    }
    
    // For parent tasks without colorScheme, assign one based on their position
    const parentTasks = Object.values(tasks).filter(t => !t.parentId);
    const taskIndex = parentTasks.findIndex(t => t.id === taskId);
    if (taskIndex >= 0) {
      const colorIndex = taskIndex % PROJECT_COLOR_SCHEMES.length;
      return PROJECT_COLOR_SCHEMES[colorIndex].name;
    }
    
    // Default color for orphaned tasks
    return PROJECT_COLOR_SCHEMES[0].name;
  }, [tasks]);

  const addTask = useCallback((title = "Nueva tarea", parentId: string | null = null, customPosition?: { x: number; y: number }) => {
    const id = crypto.randomUUID();
    
    // Determine color scheme
    let colorScheme: string;
    if (parentId) {
      // Inherit parent's color scheme
      colorScheme = getTaskColorScheme(parentId);
    } else {
      // Assign next available color for new parent task
      colorScheme = getNextAvailableColorScheme();
    }
    
    const task: Task = { 
      id, 
      title, 
      status: "pendiente", 
      progress: 0, 
      parentId, 
      width: 280, 
      height: 200,
      colorScheme
    };
    
    // Calcular posición inteligente
    let position = customPosition;
    
    if (!position) {
      if (parentId) {
        // Para subtareas, usar algoritmo optimizado
        position = findOptimalSubtaskPosition(parentId);
      } else {
        // Para tareas raíz, posición aleatoria como antes
        position = { x: (Math.random() - 0.5) * 400, y: (Math.random() - 0.5) * 200 };
      }
    }

    const node: Node = {
      id,
      type: "task",
      data: { 
        title: task.title, 
        status: task.status, 
        progress: 0,
        width: task.width,
        height: task.height,
        colorScheme
      } as TaskData,
      position,
    };

    setTasks((prev) => ({ ...prev, [id]: task }));
    setNodes((nds) => nds.concat(node));
    if (parentId) {
      const colorConfig = getColorScheme(colorScheme);
      setEdges((eds) => eds.concat({ 
        id: crypto.randomUUID(), 
        source: parentId, 
        target: id, 
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { 
          strokeWidth: 2,
          stroke: colorConfig.primary
        }
      }));
    }
    setSelectedId(id);
  }, [setEdges, setNodes, findOptimalSubtaskPosition, getNextAvailableColorScheme, getTaskColorScheme, getColorScheme]);

  // Helper function to synchronize status and progress
  const synchronizeStatusAndProgress = useCallback((partial: Partial<Task>, currentTask: Task): Partial<Task> => {
    const updated = { ...partial };
    
    // Si se actualiza el estado a "hecho", asegurar que el progreso sea 100%
    if (updated.status === "hecho") {
      updated.progress = 100;
    }
    
    // Si se actualiza el progreso
    if (updated.progress !== undefined) {
      const newProgress = updated.progress;
      const currentStatus = updated.status ?? currentTask.status;
      
      if (newProgress === 100 && currentStatus !== "hecho") {
        // Si progreso llega a 100%, marcar como completado
        updated.status = "hecho";
      } else if (newProgress < 100 && currentStatus === "hecho") {
        // Si progreso baja de 100% y estaba completado, cambiar a en progreso
        updated.status = newProgress > 0 ? "en_progreso" : "pendiente";
      } else if (newProgress > 0 && currentStatus === "pendiente") {
        // Si progreso sube de 0 y estaba pendiente, cambiar a en progreso
        updated.status = "en_progreso";
      }
    }
    
    return updated;
  }, []);

  const updateTask = useCallback((id: string, partial: Partial<Task>) => {
    setTasks((prev) => {
      const currentTask = prev[id];
      if (!currentTask) return prev;
      
      // Synchronize status and progress for the current task
      const syncedPartial = synchronizeStatusAndProgress(partial, currentTask);
      let updatedTasks = { 
        ...prev, 
        [id]: { ...currentTask, ...syncedPartial } 
      };
      
      // If progress changed, update parent tasks recursively
      if (syncedPartial.progress !== undefined) {
        const updateParentsRecursively = (taskId: string) => {
          const parentEdges = edges.filter(e => e.target === taskId);
          
          parentEdges.forEach(edge => {
            const parentId = edge.source;
            const parentTask = updatedTasks[parentId];
            
            if (parentTask) {
              // Calculate new progress based on all children
              const childrenEdges = edges.filter(e => e.source === parentId);
              
              if (childrenEdges.length > 0) {
                const childrenProgress = childrenEdges.map(childEdge => {
                  const childTask = updatedTasks[childEdge.target];
                  return childTask?.progress ?? 0;
                });
                
                const averageProgress = Math.round(
                  childrenProgress.reduce((sum, progress) => sum + progress, 0) / childrenProgress.length
                );
                
                if (averageProgress !== parentTask.progress) {
                  const parentSyncedUpdate = synchronizeStatusAndProgress(
                    { progress: averageProgress }, 
                    parentTask
                  );
                  
                  updatedTasks = {
                    ...updatedTasks,
                    [parentId]: { ...parentTask, ...parentSyncedUpdate }
                  };
                  
                  // Continue recursively up the hierarchy
                  updateParentsRecursively(parentId);
                }
              }
            }
          });
        };
        
        updateParentsRecursively(id);
      }
      
      return updatedTasks;
    });
  }, [synchronizeStatusAndProgress, edges]);

  // Update nodes when tasks change
  useEffect(() => {
    setNodes((nds) => nds.map((n) => {
      const task = tasks[n.id];
      if (task) {
        return {
          ...n,
          data: {
            ...n.data,
            title: task.title,
            status: task.status as Status,
            dueDate: task.dueDate,
            progress: task.progress,
            collapsed: task.collapsed,
            width: task.width,
            height: task.height,
          }
        };
      }
      return n;
    }));
  }, [tasks, setNodes]);

  const handleAddChild = useCallback((parentId: string) => {
    addTask("Nueva subtarea", parentId);
  }, [addTask]);

  const handleSearchResults = useCallback((results: string[]) => {
    setSearchResults(results);
  }, []);

  const handleFocusTask = useCallback((taskId: string) => {
    setSelectedId(taskId);
    
    // Encontrar el nodo y hacer zoom a él
    const node = nodes.find(n => n.id === taskId);
    if (node) {
      // Aquí podrías agregar lógica para hacer zoom al nodo
      // Por ahora solo lo seleccionamos
      console.log(`Focusing on task: ${taskId} at position:`, node.position);
    }
  }, [nodes]);

  const handleClearSelection = useCallback(() => {
    setSelectedId(null);
    setSearchResults([]);
  }, []);

  // View navigation functions
  const navigateToProject = useCallback((projectId: string) => {
    const project = tasks[projectId];
    if (project) {
      setViewState({
        mode: "project",
        currentProjectId: projectId,
        breadcrumbs: [
          { id: "overview", title: "Vista General" },
          { id: projectId, title: project.title }
        ]
      });
    }
  }, [tasks]);

  const navigateToOverview = useCallback(() => {
    setViewState({
      mode: "overview",
      currentProjectId: null,
      breadcrumbs: []
    });
  }, []);

  const navigateToFocusMode = useCallback(() => {
    setViewState({
      mode: "focus",
      currentProjectId: null,
      breadcrumbs: [{ id: "focus", title: "Modo Enfoque" }]
    });
  }, []);

  const toggleTaskFocus = useCallback((taskId: string) => {
    updateTask(taskId, { inFocus: !tasks[taskId]?.inFocus });
  }, [tasks, updateTask]);

  const navigateToBreadcrumb = useCallback((breadcrumbId: string) => {
    if (breadcrumbId === "overview") {
      navigateToOverview();
    } else if (breadcrumbId === "focus") {
      navigateToFocusMode();
    } else {
      navigateToProject(breadcrumbId);
    }
  }, [navigateToOverview, navigateToFocusMode, navigateToProject]);

  const handleResize = useCallback((id: string, width: number, height: number) => {
    updateTask(id, { width, height });
  }, [updateTask]);

  const handleDataImported = useCallback((data: MindMapData) => {
    setNodes(data.nodes);
    setEdges(data.edges);
    setTasks(data.tasks);
    setSelectedId(null);
    toast.success(`Importados ${data.metadata.totalTasks} tareas exitosamente`);
  }, [setNodes, setEdges]);

  const updateField = useCallback((field: keyof Task, value: any) => {
    if (selectedId) {
      updateTask(selectedId, { [field]: value });
    }
  }, [selectedId, updateTask]);

  const removeTaskRecursive = useCallback((id: string) => {
    const toRemove = new Set([id]);
    const stack = [id];
    
    // Find all children recursively
    while (stack.length > 0) {
      const current = stack.pop()!;
      edges.filter(e => e.source === current).forEach(e => {
        if (!toRemove.has(e.target)) {
          toRemove.add(e.target);
          stack.push(e.target);
        }
      });
    }
    
    // Remove all nodes and tasks
    setNodes(nds => nds.filter(n => !toRemove.has(n.id)));
    setTasks(prev => {
      const next = { ...prev };
      toRemove.forEach(taskId => delete next[taskId]);
      return next;
    });
    setEdges(eds => eds.filter(e => !toRemove.has(e.source) && !toRemove.has(e.target)));
    
    if (selectedId && toRemove.has(selectedId)) {
      setSelectedId(null);
    }
  }, [edges, selectedId, setNodes, setEdges]);

  // Helper function to check if a node should be visible based on current view
  const isNodeVisibleInCurrentView = useCallback((nodeId: string): boolean => {
    const task = tasks[nodeId];
    if (!task) return false;

    switch (viewState.mode) {
      case "overview":
        // Solo mostrar tareas padre (sin parentId)
        return !task.parentId;
        
      case "project":
        // Mostrar solo tareas del proyecto actual y sus descendientes
        if (!viewState.currentProjectId) return false;
        
        // Si es el proyecto actual, mostrarlo
        if (nodeId === viewState.currentProjectId) return true;
        
        // Si es descendiente del proyecto actual, mostrarlo
        return isDescendantOf(nodeId, viewState.currentProjectId);
        
      case "focus":
        // Mostrar tareas marcadas como "en foco" y sus padres necesarios para navegación
        if (task.inFocus) return true;
        
        // También mostrar si es padre de una tarea en foco (para mantener jerarquía)
        return hasDescendantInFocus(nodeId);
        
      default:
        return true;
    }
  }, [tasks, viewState]);

  // Helper function to check if a task is descendant of another
  const isDescendantOf = useCallback((taskId: string, ancestorId: string): boolean => {
    const task = tasks[taskId];
    if (!task || !task.parentId) return false;
    
    if (task.parentId === ancestorId) return true;
    return isDescendantOf(task.parentId, ancestorId);
  }, [tasks]);

  // Helper function to check if a task has any descendant in focus
  const hasDescendantInFocus = useCallback((taskId: string): boolean => {
    const childrenEdges = edges.filter(e => e.source === taskId);
    
    for (const edge of childrenEdges) {
      const childTask = tasks[edge.target];
      if (childTask?.inFocus) return true;
      if (hasDescendantInFocus(edge.target)) return true;
    }
    
    return false;
  }, [edges, tasks]);

  // Helper function to check if a node should be visible (combining search and view filters)
  const isNodeVisible = useCallback((nodeId: string): boolean => {
    // First check if visible in current view
    if (!isNodeVisibleInCurrentView(nodeId)) return false;
    
    // Si es resultado de búsqueda, siempre debe ser visible
    if (searchResults.length > 0 && searchResults.includes(nodeId)) {
      return true;
    }
    
    // Find all parent nodes by traversing edges backwards
    const parentEdges = edges.filter(e => e.target === nodeId);
    
    // If no parents, it's a root node - visible if passes view filter
    if (parentEdges.length === 0) return true;
    
    // Check each parent path
    for (const edge of parentEdges) {
      const parentTask = tasks[edge.source];
      
      // Si el padre está colapsado, verificar si algún descendiente es resultado de búsqueda
      if (parentTask?.collapsed) {
        // Si hay búsqueda activa, verificar si algún descendiente coincide
        if (searchResults.length > 0) {
          const hasSearchResultDescendant = hasDescendantInSearchResults(edge.source);
          if (hasSearchResultDescendant) {
            // No ocultar si hay descendientes que coinciden con la búsqueda
            continue;
          } else {
            return false;
          }
        } else {
          return false;
        }
      }
      
      // Recursively check if parent is visible
      if (!isNodeVisible(edge.source)) return false;
    }
    
    return true;
  }, [edges, tasks, searchResults, isNodeVisibleInCurrentView]);

  // Helper function to check if a node has descendants in search results
  const hasDescendantInSearchResults = useCallback((nodeId: string): boolean => {
    if (searchResults.length === 0) return false;
    
    // Get direct children
    const directChildren = edges.filter(e => e.source === nodeId);
    
    for (const edge of directChildren) {
      // If child is in search results, return true
      if (searchResults.includes(edge.target)) {
        return true;
      }
      // Recursively check descendants
      if (hasDescendantInSearchResults(edge.target)) {
        return true;
      }
    }
    
    return false;
  }, [edges, searchResults]);

  // Helper function to count hidden children
  const getHiddenChildrenCount = useCallback((nodeId: string): number => {
    const task = tasks[nodeId];
    if (!task?.collapsed) return 0;
    
    // Get direct children
    const directChildren = edges.filter(e => e.source === nodeId);
    let count = directChildren.length;
    
    // Recursively count all descendants
    for (const edge of directChildren) {
      count += getHiddenChildrenCount(edge.target);
    }
    
    return count;
  }, [edges, tasks]);

  // Filter visible nodes and edges
  const visibleNodes = useMemo(() => {
    return nodes.filter(node => isNodeVisible(node.id));
  }, [nodes, isNodeVisible]);

  const visibleEdges = useMemo(() => {
    return edges.filter(edge => 
      isNodeVisible(edge.source) && isNodeVisible(edge.target)
    ).map(edge => {
      // Apply project color to edge
      const sourceColorScheme = getTaskColorScheme(edge.source);
      const colorConfig = getColorScheme(sourceColorScheme);
      
      return {
        ...edge,
        style: {
          strokeWidth: 2,
          stroke: colorConfig.primary
        }
      };
    });
  }, [edges, isNodeVisible, getTaskColorScheme, getColorScheme]);

  // Compute nodes with callbacks
  const nodesWithCallbacks = useMemo(() => {
    return visibleNodes.map((n) => {
      const t = tasks[n.id];
      let highlight: TaskData["highlight"] = null;
      if (t?.dueDate) {
        const d = new Date(t.dueDate).getTime();
        const now = Date.now();
        if (d < now) highlight = "overdue";
        else if (d < now + 1000 * 60 * 60 * 48) highlight = "soon";
      }
      
      const hiddenCount = getHiddenChildrenCount(n.id);
      const isSearchResult = searchResults.length > 0 && searchResults.includes(n.id);
      const isParentTask = edges.some(e => e.source === n.id); // Tiene hijos
      const taskColorScheme = getTaskColorScheme(n.id);
      
      return {
        ...n,
        data: {
          ...(n.data as TaskData),
          highlight,
          width: t?.width || 280,
          height: t?.height || 200,
          hiddenChildrenCount: hiddenCount,
          isSearchResult,
          inFocus: t?.inFocus || false,
          isParentTask,
          colorScheme: taskColorScheme,
          onAddChild: handleAddChild,
          onToggleCollapse: (id: string) => updateTask(id, { collapsed: !tasks[id]?.collapsed }),
          onFocus: (id: string) => setSelectedId(id),
          onDelete: (id: string) => {
            setNodes((nds) => nds.filter((node) => node.id !== id));
            setTasks((prev) => {
              const next = { ...prev };
              delete next[id];
              return next;
            });
            setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
          },
          onResize: handleResize,
          onToggleFocus: toggleTaskFocus,
          onDrillDown: navigateToProject
        }
      };
    });
  }, [visibleNodes, tasks, handleAddChild, updateTask, setNodes, setEdges, handleResize, getHiddenChildrenCount, searchResults, edges, toggleTaskFocus, navigateToProject, getTaskColorScheme]);

  const onConnect = useCallback((params: Edge | Connection) => 
    setEdges((eds) => addEdge({ ...params, markerEnd: { type: MarkerType.ArrowClosed } }, eds)), 
    [setEdges]
  );

  const onSelectionChange = useCallback(({ nodes: nds }: { nodes: Node[] }) => {
    const newSelectedId = nds[0]?.id ?? null;
    setSelectedId(newSelectedId);
    
    // Si no hay selección, limpiar también los resultados de búsqueda
    if (!newSelectedId) {
      setSearchResults([]);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    const loaded = loadFromStorageLocal();
    const initial = loaded ?? buildInitial();
    setNodes(initial.nodes);
    setEdges(initial.edges);
    setTasks(initial.tasks);

    console.log("Datos cargados:", {
      tareas: Object.keys(initial.tasks).length,
      nodos: initial.nodes.length,
      conexiones: initial.edges.length
    });
  }, [setEdges, setNodes]);

  // Auto-save mejorado con tracking
  useEffect(() => {
    if (Object.keys(tasks).length > 0) {
      setIsModified(true);
      autoSave(nodes, edges, tasks);
      
      // Reset modified state after save
      const timer = setTimeout(() => setIsModified(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [nodes, edges, tasks]);

  // Node types
  const nodeTypes = useMemo(() => ({ task: TaskNode }), []);

  // Calculate stats
  const taskCount = Object.keys(tasks).length;
  const completedCount = Object.values(tasks).filter(t => t.status === "hecho").length;
  const focusedTasksCount = Object.values(tasks).filter(t => t.inFocus).length;
  const selectedTask = selectedId ? tasks[selectedId] : undefined;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-primary/5">
      <ModernHeaderSimple
        onAddTask={() => addTask("Nueva tarea", null)}
        taskCount={taskCount}
        completedCount={completedCount}
        onDataImported={handleDataImported}
        tasks={tasks}
        onSearchResults={handleSearchResults}
        onFocusTask={handleFocusTask}
        onClearSelection={handleClearSelection}
      />

      <ViewNavigation
        viewState={viewState}
        onNavigateToBreadcrumb={navigateToBreadcrumb}
        onNavigateToOverview={navigateToOverview}
        onNavigateToFocusMode={navigateToFocusMode}
        focusedTasksCount={focusedTasksCount}
      />

      <main className={cn(
        "transition-all duration-300 w-full",
        sidebar.isVisible && sidebar.isExpanded 
          ? "grid grid-cols-1 lg:grid-cols-[1fr_400px] h-[calc(100vh-128px)]"
          : "h-[calc(100vh-128px)]"
      )}>
        <section aria-label="Lienzo del Mapa Mental" className="relative overflow-hidden w-full h-full">
          {/* Mostrar estado vacío en modo enfoque si no hay tareas enfocadas */}
          {viewState.mode === "focus" && focusedTasksCount === 0 ? (
            <EmptyFocusState
              onNavigateToOverview={navigateToOverview}
              onAddTask={() => addTask("Nueva tarea", null)}
            />
          ) : (
            <ReactFlow
              nodes={nodesWithCallbacks}
              edges={visibleEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onSelectionChange={onSelectionChange}
              nodeTypes={nodeTypes}
              connectionMode={ConnectionMode.Loose}
              fitView
              className="w-full h-full bg-gradient-to-br from-background to-muted/20"
            >
              <Background 
                variant="dots" 
                gap={20} 
                size={1} 
                className="opacity-30"
              />
              <MiniMap 
                zoomable 
                pannable 
                className="!bg-card/80 !border-border/50 backdrop-blur-sm rounded-lg"
                nodeClassName="!fill-primary/60"
              />
              <Controls 
                className="!bg-card/80 !border-border/50 backdrop-blur-sm rounded-lg"
                showInteractive={false}
              />
            </ReactFlow>
          )}
        </section>

        <ModernSidebar
          selectedTask={selectedTask}
          onUpdateTask={updateField}
          onAddSubtask={() => selectedTask && addTask("Nueva subtarea", selectedTask.id)}
          onDeleteTask={() => selectedTask && removeTaskRecursive(selectedTask.id)}
          isVisible={sidebar.isVisible}
          isExpanded={sidebar.isExpanded}
          className="hidden lg:block"
        />
      </main>

      <SaveIndicator isModified={isModified} />
    </div>
  );
};

export default Index;
