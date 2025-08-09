import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { DataManager } from "@/components/ui/data-manager";
import { Plus, Focus, Minimize2, Sparkles, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModernHeaderSimpleProps {
  onAddTask: () => void;
  taskCount: number;
  completedCount: number;
  onDataImported: (data: any) => void;
}

export function ModernHeaderSimple({
  onAddTask,
  taskCount,
  completedCount,
  onDataImported
}: ModernHeaderSimpleProps) {
  const completionRate = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;

  return (
    <header className="sticky top-0 z-50 w-full border-b glass backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gradient">MindWeave Focus</h1>
          </div>
          
          {/* Stats */}
          <div className="hidden md:flex items-center gap-3">
            <Badge variant="secondary" className="gap-1">
              <BarChart3 className="h-3 w-3" />
              {taskCount} tareas
            </Badge>
            <Badge 
              variant="outline" 
              className={cn(
                "gap-1 transition-colors",
                completionRate >= 80 ? "border-green-500 text-green-700 dark:border-green-400 dark:text-green-300" : 
                completionRate >= 50 ? "border-yellow-500 text-yellow-700 dark:border-yellow-400 dark:text-yellow-300" : 
                "border-gray-500 text-gray-700 dark:border-gray-400 dark:text-gray-300"
              )}
            >
              {completionRate}% completado
            </Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button 
            variant="secondary" 
            size="sm"
            onClick={onAddTask}
            className="gap-2 shadow-soft hover:shadow-glow transition-all duration-300"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nueva Tarea</span>
          </Button>

          <ThemeToggle />
          
          <DataManager onDataImported={onDataImported} />
        </div>
      </div>
    </header>
  );
}
