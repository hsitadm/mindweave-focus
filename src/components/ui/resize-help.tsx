import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Move3D } from "lucide-react";
import { cn } from "@/lib/utils";

export function ResizeHelp() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenHelp = localStorage.getItem("resize-help-seen");
    if (!hasSeenHelp) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem("resize-help-seen", "true");
  };

  if (!isVisible) return null;

  return (
    <div className={cn(
      "fixed bottom-4 right-4 z-50 max-w-sm",
      "glass rounded-lg p-4 animate-slide-up",
      "border border-border/50 shadow-lg"
    )}>
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Move3D className="h-4 w-4 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1">
            ¡Nuevas tarjetas redimensionables!
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Selecciona cualquier tarjeta y arrastra las esquinas para cambiar su tamaño. 
            Perfecto para organizar mejor tu información.
          </p>
          <Button 
            size="sm" 
            variant="secondary" 
            onClick={handleClose}
            className="h-7 text-xs"
          >
            ¡Entendido!
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
