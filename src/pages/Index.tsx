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
};

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

  const addTask = useCallback((title = "Nueva tarea", parentId: string | null = null, customPosition?: { x: number; y: number }) => {
    const id = crypto.randomUUID();
    const task: Task = { id, title, status: "pendiente", progress: 0, parentId, width: 280, height: 200 };
    
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
        height: task.height
      } as TaskData,
      position,
    };

    setTasks((prev) => ({ ...prev, [id]: task }));
    setNodes((nds) => nds.concat(node));
    if (parentId) {
      setEdges((eds) => eds.concat({ 
        id: crypto.randomUUID(), 
        source: parentId, 
        target: id, 
        markerEnd: { type: MarkerType.ArrowClosed } 
      }));
    }
    setSelectedId(id);
  }, [setEdges, setNodes, findOptimalSubtaskPosition]);

  const updateTask = useCallback((id: string, partial: Partial<Task>) => {
    setTasks((prev) => ({ ...prev, [id]: { ...prev[id], ...partial } }));
    setNodes((nds) => nds.map((n) => n.id === id ? {
      ...n,
      data: {
        ...n.data,
        title: partial.title ?? (n.data as TaskData).title,
        status: (partial.status as Status | undefined) ?? (n.data as TaskData).status,
        dueDate: partial.dueDate ?? (n.data as TaskData).dueDate,
        progress: partial.progress ?? (n.data as TaskData).progress,
        collapsed: partial.collapsed ?? (n.data as TaskData).collapsed,
        width: partial.width ?? (n.data as TaskData).width,
        height: partial.height ?? (n.data as TaskData).height,
      }
    } : n));
  }, [setNodes]);

  const handleAddChild = useCallback((parentId: string) => {
    addTask("Nueva subtarea", parentId);
  }, [addTask]);

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

  // Helper function to check if a node should be visible
  const isNodeVisible = useCallback((nodeId: string): boolean => {
    // Find all parent nodes by traversing edges backwards
    const parentEdges = edges.filter(e => e.target === nodeId);
    
    // If no parents, it's a root node - always visible
    if (parentEdges.length === 0) return true;
    
    // Check each parent path
    for (const edge of parentEdges) {
      const parentTask = tasks[edge.source];
      
      // If parent is collapsed, this node should be hidden
      if (parentTask?.collapsed) return false;
      
      // Recursively check if parent is visible
      if (!isNodeVisible(edge.source)) return false;
    }
    
    return true;
  }, [edges, tasks]);

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
    );
  }, [edges, isNodeVisible]);

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
      
      return {
        ...n,
        data: {
          ...(n.data as TaskData),
          highlight,
          width: t?.width || 280,
          height: t?.height || 200,
          hiddenChildrenCount: hiddenCount,
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
          onResize: handleResize
        }
      };
    });
  }, [visibleNodes, tasks, handleAddChild, updateTask, setNodes, setEdges, handleResize, getHiddenChildrenCount]);

  const onConnect = useCallback((params: Edge | Connection) => 
    setEdges((eds) => addEdge({ ...params, markerEnd: { type: MarkerType.ArrowClosed } }, eds)), 
    [setEdges]
  );

  const onSelectionChange = useCallback(({ nodes: nds }: { nodes: Node[] }) => {
    setSelectedId(nds[0]?.id ?? null);
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
  const selectedTask = selectedId ? tasks[selectedId] : undefined;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-primary/5">
      <ModernHeaderSimple
        onAddTask={() => addTask("Nueva tarea", null)}
        taskCount={taskCount}
        completedCount={completedCount}
        onDataImported={handleDataImported}
        tasks={tasks}
      />

      <main className={cn(
        "transition-all duration-300 w-full",
        sidebar.isVisible && sidebar.isExpanded 
          ? "grid grid-cols-1 lg:grid-cols-[1fr_400px] h-[calc(100vh-64px)]"
          : "h-[calc(100vh-64px)]"
      )}>
        <section aria-label="Lienzo del Mapa Mental" className="relative overflow-hidden w-full h-full">
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
