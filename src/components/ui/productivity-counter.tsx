import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Flame, 
  TrendingUp,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductivityCounterProps {
  tasksCompletedToday: number;
  streakDays: number;
  weeklyProductivity: number;
  totalTasks: number;
  completedTasks: number;
}

export function ProductivityCounter({
  tasksCompletedToday,
  streakDays,
  weeklyProductivity,
  totalTasks,
  completedTasks
}: ProductivityCounterProps) {
  // Determinar color basado en productividad
  const getProductivityColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600 dark:text-green-400";
    if (percentage >= 60) return "text-blue-600 dark:text-blue-400";
    if (percentage >= 40) return "text-yellow-600 dark:text-yellow-400";
    return "text-gray-600 dark:text-gray-400";
  };

  const getStreakColor = (days: number) => {
    if (days >= 7) return "text-orange-600 dark:text-orange-400";
    if (days >= 3) return "text-yellow-600 dark:text-yellow-400";
    return "text-gray-600 dark:text-gray-400";
  };

  return (
    <div className="hidden md:flex items-center gap-3">
      {/* Tareas completadas hoy */}
      <Badge 
        variant="secondary" 
        className="gap-1.5 px-2 py-1 transition-all duration-200 hover:scale-105"
      >
        <CheckCircle2 className="h-3 w-3 text-green-500" />
        <span className="text-xs font-medium">
          {tasksCompletedToday} hoy
        </span>
      </Badge>

      {/* Racha de días */}
      {streakDays > 0 && (
        <Badge 
          variant="outline" 
          className={cn(
            "gap-1.5 px-2 py-1 transition-all duration-200 hover:scale-105",
            "border-orange-200 dark:border-orange-800"
          )}
        >
          <Flame className={cn("h-3 w-3", getStreakColor(streakDays))} />
          <span className={cn("text-xs font-medium", getStreakColor(streakDays))}>
            {streakDays}d racha
          </span>
        </Badge>
      )}

      {/* Productividad semanal */}
      <Badge 
        variant="outline" 
        className="gap-1.5 px-2 py-1 transition-all duration-200 hover:scale-105"
      >
        <TrendingUp className={cn("h-3 w-3", getProductivityColor(weeklyProductivity))} />
        <span className={cn("text-xs font-medium", getProductivityColor(weeklyProductivity))}>
          {weeklyProductivity}%
        </span>
      </Badge>

      {/* Indicador de progreso total (opcional, solo si hay tareas) */}
      {totalTasks > 0 && (
        <div className="hidden lg:flex items-center gap-1 text-xs text-muted-foreground">
          <Target className="h-3 w-3" />
          <span>{completedTasks}/{totalTasks}</span>
        </div>
      )}
    </div>
  );
}
