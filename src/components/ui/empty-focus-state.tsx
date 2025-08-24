import { Button } from "@/components/ui/button";
import { Target, Plus } from "lucide-react";

interface EmptyFocusStateProps {
  onNavigateToOverview: () => void;
  onAddTask: () => void;
}

export function EmptyFocusState({ onNavigateToOverview, onAddTask }: EmptyFocusStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4">
        <Target className="w-8 h-8 text-orange-600 dark:text-orange-400" />
      </div>
      
      <h3 className="text-lg font-semibold mb-2">No hay tareas en enfoque</h3>
      
      <p className="text-muted-foreground mb-6 max-w-md">
        Marca las tareas más importantes con el botón <Target className="inline w-4 h-4 mx-1" /> 
        para mantener el foco en lo que realmente importa.
      </p>
      
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={onNavigateToOverview}
          className="gap-2"
        >
          Ver todas las tareas
        </Button>
        
        <Button 
          onClick={onAddTask}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva tarea
        </Button>
      </div>
      
      <div className="mt-8 p-4 bg-muted/50 rounded-lg max-w-md">
        <p className="text-sm text-muted-foreground">
          <strong>💡 Tip:</strong> Usa el Modo Enfoque para concentrarte solo en las tareas 
          que necesitas completar hoy o esta semana.
        </p>
      </div>
    </div>
  );
}
