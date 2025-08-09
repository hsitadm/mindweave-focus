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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import TaskNode, { TaskData, Status } from "@/components/mindmap/TaskNode";
import { Plus, Focus, Minimize2 } from "lucide-react";

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
};

const STORAGE_KEY = "mindmap-data-v1";

function nowISO(daysOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().slice(0, 10);
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
      } as TaskData,
      position: { x: 0, y: 0 },
    },
  ];
  return { nodes, edges: [], tasks: { [n1.id]: n1 } };
}

function loadFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { nodes: Node[]; edges: Edge[]; tasks: Record<string, Task> };
  } catch {
    return null;
  }
}

function saveToStorage(state: { nodes: Node[]; edges: Edge[]; tasks: Record<string, Task> }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const Index = () => {
  // Base graph state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [tasks, setTasks] = useState<Record<string, Task>>({});

  // UI state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);

  // Inspector form state
  const selectedTask = selectedId ? tasks[selectedId] : undefined;

  // Load/Save persistence
  useEffect(() => {
    const loaded = loadFromStorage();
    const initial = loaded ?? buildInitial();
    setNodes(initial.nodes);
    setEdges(initial.edges);
    setTasks(initial.tasks);

    // Alarms
    const soon = Object.values(initial.tasks).filter((t) => t.dueDate && new Date(t.dueDate) < new Date(Date.now() + 1000 * 60 * 60 * 48) && new Date(t.dueDate) >= new Date());
    const overdue = Object.values(initial.tasks).filter((t) => t.dueDate && new Date(t.dueDate) < new Date());
    if (overdue.length) toast.warning(`Tareas vencidas: ${overdue.length}`);
    if (soon.length) toast.info(`Próximos vencimientos: ${soon.length}`);
  }, [setEdges, setNodes]);

  useEffect(() => {
    saveToStorage({ nodes, edges, tasks });
  }, [nodes, edges, tasks]);

  // Helpers
  const getChildren = useCallback((id: string) => edges.filter((e) => e.source === id).map((e) => e.target), [edges]);

  const addTask = useCallback((title = "Nueva tarea", parentId: string | null = null, position?: { x: number; y: number }) => {
    const id = crypto.randomUUID();
    const task: Task = { id, title, status: "pendiente", progress: 0, parentId };
    const node: Node = {
      id,
      type: "task",
      data: { title: task.title, status: task.status, progress: 0 } as TaskData,
      position: position ?? { x: (Math.random() - 0.5) * 400, y: (Math.random() - 0.5) * 200 },
    };

    setTasks((prev) => ({ ...prev, [id]: task }));
    setNodes((nds) => nds.concat(node));
    if (parentId) {
      setEdges((eds) => eds.concat({ id: crypto.randomUUID(), source: parentId, target: id, markerEnd: { type: MarkerType.ArrowClosed } }));
    }
    setSelectedId(id);
  }, [setEdges, setNodes]);

  const removeTaskRecursive = useCallback((id: string) => {
    const descendants: string[] = [];
    const stack = [id];
    while (stack.length) {
      const cur = stack.pop()!;
      descendants.push(cur);
      getChildren(cur).forEach((c) => stack.push(c));
    }
    setEdges((eds) => eds.filter((e) => !descendants.includes(e.source) && !descendants.includes(e.target)));
    setNodes((nds) => nds.filter((n) => !descendants.includes(n.id)));
    setTasks((prev) => {
      const next = { ...prev };
      descendants.forEach((d) => delete next[d]);
      return next;
    });
    if (descendants.includes(selectedId || "")) setSelectedId(null);
    if (descendants.includes(focusId || "")) setFocusId(null);
  }, [getChildren, selectedId, focusId]);

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
      }
    } : n));
  }, [setNodes]);

  const onConnect = useCallback((params: Edge | Connection) => setEdges((eds) => addEdge({ ...params, markerEnd: { type: MarkerType.ArrowClosed } }, eds)), [setEdges]);

  const handleAddChild = useCallback((parentId: string) => {
    const parent = nodes.find((n) => n.id === parentId);
    const pos = parent ? { x: parent.position.x + 220, y: parent.position.y + 60 } : undefined;
    addTask("Nueva subtarea", parentId, pos);
  }, [addTask, nodes]);

  // Compute highlights for due
  const nodesWithHighlight = useMemo(() => {
    const res = nodes.map((n) => {
      const t = tasks[n.id];
      let highlight: TaskData["highlight"] = null;
      if (t?.dueDate) {
        const d = new Date(t.dueDate).getTime();
        const now = Date.now();
        if (d < now) highlight = "overdue";
        else if (d < now + 1000 * 60 * 60 * 48) highlight = "soon";
      }
      return { ...n, data: { ...(n.data as TaskData), highlight, onAddChild: handleAddChild, onToggleCollapse: (id: string) => updateTask(id, { collapsed: !tasks[id]?.collapsed }), onFocus: (id: string) => setFocusId(id), onDelete: (id: string) => removeTaskRecursive(id) } } as Node;
    });

    // Filter by collapse & focus
    const hidden = new Set<string>();
    if (focusId) {
      // keep only subtree of focusId
      const keep = new Set<string>();
      const stack = [focusId];
      while (stack.length) {
        const cur = stack.pop()!;
        keep.add(cur);
        edges.filter((e) => e.source === cur).forEach((e) => stack.push(e.target));
      }
      res.forEach((n) => { if (!keep.has(n.id)) hidden.add(n.id); });
    }

    // Collapse hiding
    const collapseStack = res.filter((n) => (n.data as TaskData).collapsed).map((n) => n.id);
    while (collapseStack.length) {
      const cur = collapseStack.pop()!;
      edges.filter((e) => e.source === cur).forEach((e) => {
        hidden.add(e.target);
        collapseStack.push(e.target);
      });
    }

    return res.map((n) => ({ ...n, hidden: hidden.has(n.id) }));
  }, [nodes, tasks, handleAddChild, updateTask, removeTaskRecursive, edges, focusId]);

  const edgesFiltered = useMemo(() => {
    if (!focusId) return edges;
    const keep = new Set<string>();
    const stack = [focusId];
    while (stack.length) {
      const cur = stack.pop()!;
      edges.filter((e) => e.source === cur).forEach((e) => {
        keep.add(e.id);
        stack.push(e.target);
      });
    }
    return edges.filter((e) => keep.has(e.id));
  }, [edges, focusId]);

  // Node types
  const nodeTypes = useMemo(() => ({ task: TaskNode }), []);
  const defaultEdgeOptions = useMemo(() => ({
    type: 'smoothstep' as const,
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: 'hsl(var(--muted-foreground))' }
  }), []);

  // Selection handler
  const onSelectionChange = useCallback(({ nodes: nds }: { nodes: Node[] }) => {
    setSelectedId(nds[0]?.id ?? null);
  }, []);

  // Inspector inputs
  const updateField = (field: keyof Task, value: any) => {
    if (!selectedId) return;
    updateTask(selectedId, { [field]: value } as Partial<Task>);
  };

  return (
    <div className="min-h-screen w-full">
      <header className="border-b">
        <nav className="container flex items-center justify-between py-4">
          <a href="#" className="story-link text-xl font-semibold">MindMap de Proyectos</a>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => addTask("Nueva tarea", null)}> <Plus className="h-4 w-4 mr-1"/> Añadir</Button>
            {focusId ? (
              <Button variant="outline" onClick={() => setFocusId(null)}><Minimize2 className="h-4 w-4 mr-1"/>Salir foco</Button>
            ) : (
              <Button variant="outline" onClick={() => selectedId && setFocusId(selectedId)} disabled={!selectedId}><Focus className="h-4 w-4 mr-1"/>Foco</Button>
            )}
          </div>
        </nav>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-[1fr_360px]">
        <section aria-label="Lienzo" className="h-[calc(100vh-64px)]">
          <ReactFlow
            nodes={nodesWithHighlight}
            edges={edgesFiltered}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onSelectionChange={onSelectionChange}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
          >
            <Background />
            <MiniMap zoomable pannable />
            <Controls />
          </ReactFlow>
        </section>

        <aside className="hidden lg:block border-l h-[calc(100vh-64px)] overflow-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold">Inspector</h2>
            <p className="text-sm text-muted-foreground">Edita la tarea seleccionada</p>
            <Separator className="my-3" />

            {!selectedTask ? (
              <p className="text-sm text-muted-foreground">Selecciona un nodo para editar.</p>
            ) : (
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input id="title" value={selectedTask.title} onChange={(e) => updateField("title", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select value={selectedTask.status} onValueChange={(v: Status) => updateField("status", v)}>
                      <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="en_progreso">En progreso</SelectItem>
                        <SelectItem value="hecho">Hecho</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Vencimiento</Label>
                    <Input type="date" value={selectedTask.dueDate ?? ""} onChange={(e) => updateField("dueDate", e.target.value || undefined)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Progreso</Label>
                  <div className="px-1"><Slider value={[selectedTask.progress]} onValueChange={([v]) => updateField("progress", v)} /></div>
                </div>
                <div className="space-y-2">
                  <Label>Próximos pasos</Label>
                  <Textarea value={selectedTask.nextSteps ?? ""} onChange={(e) => updateField("nextSteps", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Notas</Label>
                  <Textarea value={selectedTask.notes ?? ""} onChange={(e) => updateField("notes", e.target.value)} />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Button type="button" variant="secondary" onClick={() => addTask("Nueva subtarea", selectedTask.id)}>Añadir subtarea</Button>
                  <Button type="button" variant="destructive" onClick={() => removeTaskRecursive(selectedTask.id)}>Eliminar</Button>
                </div>
              </form>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
};

export default Index;
