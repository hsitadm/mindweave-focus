import { useMemo } from "react";
import type { Task } from "@/pages/Index";

interface ProductivityStats {
  tasksCompletedToday: number;
  streakDays: number;
  weeklyProductivity: number;
  totalTasks: number;
  completedTasks: number;
}

export function useProductivityStats(tasks: Record<string, Task>): ProductivityStats {
  return useMemo(() => {
    const taskList = Object.values(tasks);
    const today = new Date().toISOString().split('T')[0];
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Tareas completadas hoy
    const tasksCompletedToday = taskList.filter(task => {
      // Simulamos que las tareas "hecho" fueron completadas hoy
      // En una app real, tendrías un campo "completedAt"
      return task.status === "hecho";
    }).length;

    // Calcular racha de días (simplificado)
    // En una app real, necesitarías un historial de actividad diaria
    const streakDays = tasksCompletedToday > 0 ? 
      Math.min(7, Math.floor(Math.random() * 10) + 1) : 0;

    // Productividad semanal
    const totalTasks = taskList.length;
    const completedTasks = taskList.filter(task => task.status === "hecho").length;
    const weeklyProductivity = totalTasks > 0 ? 
      Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      tasksCompletedToday,
      streakDays,
      weeklyProductivity,
      totalTasks,
      completedTasks
    };
  }, [tasks]);
}
