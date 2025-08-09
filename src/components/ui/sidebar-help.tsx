import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, PanelRightOpen, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function SidebarHelp() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenHelp = localStorage.getItem("sidebar-help-seen");
    if (!hasSeenHelp) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem("sidebar-help-seen", "true");
  };

  if (!isVisible) return null;

  return (
    <div className={cn(
      "fixed top-20 right-4 z-50 max-w-sm",
      "glass rounded-lg p-4 animate-slide-up",
      "border border-border/50 shadow-lg"
    )}>
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
          <Zap className="h-4 w-4 text-blue-500" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1">
            ¡Panel inteligente activado!
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            El panel lateral ahora se oculta automáticamente para darte más espacio. 
            Se mostrará cuando selecciones una tarea y se ocultará cuando no haya nada seleccionado.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <PanelRightOpen className="h-3 w-3" />
            <span>Usa los controles del header para cambiar este comportamiento</span>
          </div>
          <Button 
            size="sm" 
            variant="secondary" 
            onClick={handleClose}
            className="h-7 text-xs"
          >
            ¡Perfecto!
          </Button>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleClose}
          className="h-6 w-6 p-0 shrink-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
