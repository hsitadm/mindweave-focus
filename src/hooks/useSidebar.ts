import { useState, useEffect } from "react";

export type SidebarMode = 'always-visible' | 'auto-hide' | 'always-hidden';

interface UseSidebarOptions {
  selectedId: string | null;
  defaultMode?: SidebarMode;
}

export function useSidebar({ selectedId, defaultMode = 'auto-hide' }: UseSidebarOptions) {
  const [mode, setMode] = useState<SidebarMode>(() => {
    const saved = localStorage.getItem('sidebar-mode');
    return (saved as SidebarMode) || defaultMode;
  });
  
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Guardar preferencia en localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-mode', mode);
  }, [mode]);

  // Lógica de visibilidad basada en el modo
  useEffect(() => {
    switch (mode) {
      case 'always-visible':
        setIsVisible(true);
        setIsExpanded(true);
        break;
      case 'always-hidden':
        setIsVisible(false);
        setIsExpanded(false);
        break;
      case 'auto-hide':
        if (selectedId) {
          setIsVisible(true);
          // Pequeño delay para animación suave
          setTimeout(() => setIsExpanded(true), 50);
        } else {
          setIsExpanded(false);
          // Ocultar después de la animación
          setTimeout(() => setIsVisible(false), 300);
        }
        break;
    }
  }, [mode, selectedId]);

  const toggleMode = () => {
    const modes: SidebarMode[] = ['auto-hide', 'always-visible', 'always-hidden'];
    const currentIndex = modes.indexOf(mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setMode(modes[nextIndex]);
  };

  const forceShow = () => {
    setIsVisible(true);
    setIsExpanded(true);
  };

  const forceHide = () => {
    setIsExpanded(false);
    setTimeout(() => setIsVisible(false), 300);
  };

  return {
    mode,
    setMode,
    isVisible,
    isExpanded,
    toggleMode,
    forceShow,
    forceHide,
  };
}
