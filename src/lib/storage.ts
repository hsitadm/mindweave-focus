import type { Node, Edge } from "@xyflow/react";
import type { Task } from "@/pages/Index";

export interface MindMapData {
  nodes: Node[];
  edges: Edge[];
  tasks: Record<string, Task>;
  version: string;
  lastModified: string;
  metadata: {
    totalTasks: number;
    completedTasks: number;
    createdAt: string;
  };
}

const STORAGE_KEY = "mindweave-focus-data";
const BACKUP_KEY = "mindweave-focus-backup";
const VERSION = "1.0.0";

// Crear datos con metadata
function createMindMapData(
  nodes: Node[], 
  edges: Edge[], 
  tasks: Record<string, Task>
): MindMapData {
  const taskValues = Object.values(tasks);
  return {
    nodes,
    edges,
    tasks,
    version: VERSION,
    lastModified: new Date().toISOString(),
    metadata: {
      totalTasks: taskValues.length,
      completedTasks: taskValues.filter(t => t.status === "hecho").length,
      createdAt: new Date().toISOString(),
    }
  };
}

// Guardar en localStorage con respaldo
export function saveToStorage(nodes: Node[], edges: Edge[], tasks: Record<string, Task>): boolean {
  try {
    const data = createMindMapData(nodes, edges, tasks);
    
    // Crear respaldo del estado anterior
    const currentData = localStorage.getItem(STORAGE_KEY);
    if (currentData) {
      localStorage.setItem(BACKUP_KEY, currentData);
    }
    
    // Guardar nuevos datos
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    
    console.log("✅ Datos guardados exitosamente", {
      tareas: data.metadata.totalTasks,
      completadas: data.metadata.completedTasks,
      timestamp: data.lastModified
    });
    
    return true;
  } catch (error) {
    console.error("❌ Error guardando datos:", error);
    return false;
  }
}

// Cargar desde localStorage
export function loadFromStorage(): MindMapData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    
    const data = JSON.parse(raw) as MindMapData;
    
    // Validar estructura básica
    if (!data.nodes || !data.edges || !data.tasks) {
      throw new Error("Estructura de datos inválida");
    }
    
    console.log("✅ Datos cargados exitosamente", {
      tareas: data.metadata?.totalTasks || Object.keys(data.tasks).length,
      version: data.version || "legacy",
      ultimaModificacion: data.lastModified || "desconocida"
    });
    
    return data;
  } catch (error) {
    console.error("❌ Error cargando datos:", error);
    return loadBackup();
  }
}

// Cargar respaldo
function loadBackup(): MindMapData | null {
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    if (!raw) return null;
    
    const data = JSON.parse(raw) as MindMapData;
    console.log("⚠️ Cargando desde respaldo");
    return data;
  } catch (error) {
    console.error("❌ Error cargando respaldo:", error);
    return null;
  }
}

// Exportar datos como JSON
export function exportData(): string {
  const data = loadFromStorage();
  if (!data) throw new Error("No hay datos para exportar");
  
  return JSON.stringify(data, null, 2);
}

// Importar datos desde JSON
export function importData(jsonString: string): MindMapData {
  try {
    const data = JSON.parse(jsonString) as MindMapData;
    
    // Validar estructura
    if (!data.nodes || !data.edges || !data.tasks) {
      throw new Error("Formato de archivo inválido");
    }
    
    // Actualizar metadata
    const updatedData = createMindMapData(data.nodes, data.edges, data.tasks);
    
    // Guardar datos importados
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    
    return updatedData;
  } catch (error) {
    throw new Error(`Error importando datos: ${error}`);
  }
}

// Limpiar todos los datos
export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(BACKUP_KEY);
  console.log("🗑️ Todos los datos han sido eliminados");
}

// Obtener información del almacenamiento
export function getStorageInfo() {
  const data = loadFromStorage();
  const backup = loadBackup();
  
  return {
    hasData: !!data,
    hasBackup: !!backup,
    lastModified: data?.lastModified,
    version: data?.version,
    totalTasks: data?.metadata?.totalTasks || 0,
    completedTasks: data?.metadata?.completedTasks || 0,
    storageSize: new Blob([localStorage.getItem(STORAGE_KEY) || ""]).size,
  };
}

// Auto-guardar con debounce
let saveTimeout: NodeJS.Timeout;
export function autoSave(nodes: Node[], edges: Edge[], tasks: Record<string, Task>, delay = 1000): void {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveToStorage(nodes, edges, tasks);
  }, delay);
}
