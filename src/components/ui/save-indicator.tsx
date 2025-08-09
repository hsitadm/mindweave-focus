import { useState, useEffect } from "react";
import { Check, Cloud, CloudOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SaveIndicatorProps {
  isModified: boolean;
}

export function SaveIndicator({ isModified }: SaveIndicatorProps) {
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (isModified) {
      setSaveState('saving');
      
      // Simular guardado después de un delay
      const timer = setTimeout(() => {
        setSaveState('saved');
        setLastSaved(new Date());
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isModified]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getIcon = () => {
    switch (saveState) {
      case 'saving':
        return <Loader2 className="h-3 w-3 animate-spin" />;
      case 'saved':
        return <Check className="h-3 w-3" />;
      case 'error':
        return <CloudOff className="h-3 w-3" />;
    }
  };

  const getText = () => {
    switch (saveState) {
      case 'saving':
        return 'Guardando...';
      case 'saved':
        return lastSaved ? `Guardado ${formatTime(lastSaved)}` : 'Guardado';
      case 'error':
        return 'Error al guardar';
    }
  };

  const getColor = () => {
    switch (saveState) {
      case 'saving':
        return 'text-blue-600 dark:text-blue-400';
      case 'saved':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
    }
  };

  return (
    <div className={cn(
      "fixed bottom-4 left-4 z-40",
      "glass rounded-lg px-3 py-2",
      "flex items-center gap-2 text-xs",
      "transition-all duration-300",
      getColor(),
      saveState === 'saving' ? 'opacity-100' : 'opacity-60 hover:opacity-100'
    )}>
      {getIcon()}
      <span className="font-medium">{getText()}</span>
    </div>
  );
}
