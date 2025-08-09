# 🧠 MindWeave Focus

> **Una aplicación inteligente de mapas mentales con sidebar auto-ocultable y seguimiento de productividad**

MindWeave Focus es una herramienta moderna para la gestión visual de tareas y proyectos, diseñada para maximizar tu espacio de trabajo y mantener el foco en lo importante.

## ✨ Funcionalidades Principales

### 🎯 **Sidebar Inteligente**
- **Auto-ocultar**: Se oculta automáticamente cuando no hay tarea seleccionada
- **Máximo espacio**: Canvas se expande para aprovechar toda la pantalla
- **Transiciones suaves**: Animaciones fluidas al mostrar/ocultar
- **Responsive**: Se adapta perfectamente a diferentes tamaños de pantalla

### 📊 **Contador de Productividad**
- **📈 Tareas completadas hoy**: Seguimiento diario con indicador visual
- **🔥 Racha de días**: Motivación con contador de días consecutivos trabajando
- **📊 Productividad semanal**: Porcentaje de completitud con colores dinámicos
- **🎯 Progreso total**: Vista general de todas tus tareas

### 🎨 **Gestión Visual de Tareas**
- **Redimensionamiento**: Ajusta el tamaño de las tarjetas según tus necesidades
- **Estados dinámicos**: Pendiente, En Progreso, Completado con colores distintivos
- **Fechas de vencimiento**: Alertas visuales para tareas próximas a vencer
- **Conexiones intuitivas**: Crea relaciones entre tareas arrastrando

### 💾 **Sistema de Persistencia Robusto**
- **Auto-guardado**: Todos los cambios se guardan automáticamente
- **Sistema de respaldos**: Protección contra pérdida de datos
- **Exportar/Importar**: Portabilidad completa de tus datos
- **Indicador de guardado**: Feedback visual del estado de sincronización

## 🚀 Guía de Uso Rápida

### **Primeros Pasos**
1. **Crear tarea**: Haz clic en "Nueva Tarea" en el header
2. **Editar tarea**: Selecciona cualquier tarjeta para ver el panel de edición
3. **Conectar tareas**: Arrastra desde el punto de conexión de una tarjeta a otra
4. **Redimensionar**: Selecciona una tarjeta y arrastra las esquinas

### **Maximizar Espacio de Trabajo**
- **Haz clic en espacio vacío** → El sidebar se oculta automáticamente
- **Haz clic en una tarjeta** → El sidebar aparece con los detalles
- **Usa el minimapa** → Navega fácilmente por mapas grandes

### **Seguimiento de Productividad**
- **Marca tareas como completadas** → Ve tu progreso en tiempo real
- **Observa tu racha** → Mantén la motivación día a día
- **Revisa tu porcentaje semanal** → Colores indican tu rendimiento

## 🛠️ Desarrollo Local

### **Requisitos**
- Node.js 18+ 
- npm o yarn

### **Instalación**
```bash
# Clonar el repositorio
git clone https://github.com/hsitadm/mindweave-focus.git

# Navegar al directorio
cd mindweave-focus

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

### **Scripts Disponibles**
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run preview      # Preview del build
npm run lint         # Linting del código
```

## 🏗️ Arquitectura Técnica

### **Stack Tecnológico**
- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Mapas**: ReactFlow para visualización interactiva
- **Build**: Vite para desarrollo rápido
- **Estado**: React Hooks + Context API

### **Componentes Principales**
```
src/
├── components/
│   ├── mindmap/
│   │   └── TaskNode.tsx          # Nodo de tarea redimensionable
│   └── ui/
│       ├── modern-sidebar.tsx    # Sidebar inteligente
│       ├── productivity-counter.tsx # Contador de productividad
│       ├── data-manager.tsx      # Gestión de datos
│       └── save-indicator.tsx    # Indicador de guardado
├── hooks/
│   ├── useSidebar.ts            # Lógica del sidebar auto-hide
│   └── useProductivityStats.ts  # Cálculos de productividad
└── lib/
    └── storage.ts               # Sistema de persistencia robusto
```

## 🎨 Funcionalidades Avanzadas

### **Sistema de Temas**
- Modo claro/oscuro automático
- Colores adaptativos según productividad
- Animaciones suaves y transiciones

### **Gestión de Datos**
- Exportación en formato JSON
- Importación con validación
- Migración automática de versiones
- Respaldos automáticos locales

### **Experiencia de Usuario**
- Atajos de teclado intuitivos
- Feedback visual inmediato
- Diseño responsive completo
- Accesibilidad optimizada

## 🔄 Flujo de Desarrollo

Este proyecto sigue un flujo Git profesional:

```bash
# 1. Crear rama para nueva funcionalidad
git checkout -b feature/nueva-funcionalidad

# 2. Desarrollar y probar
# ... hacer cambios ...

# 3. Commit descriptivo
git add .
git commit -m "feat: descripción clara"

# 4. Merge a main
git checkout main
git merge feature/nueva-funcionalidad
git push origin main

# 5. Limpiar rama temporal
git branch -d feature/nueva-funcionalidad
```

## 📈 Roadmap

### **Próximas Funcionalidades**
- [ ] **Templates de tareas**: Plantillas predefinidas para proyectos comunes
- [ ] **Colaboración en tiempo real**: Trabajo en equipo sincronizado
- [ ] **Integración con calendarios**: Sincronización con Google Calendar
- [ ] **Modo presentación**: Vista optimizada para mostrar mapas
- [ ] **Análisis avanzado**: Métricas detalladas de productividad

### **Mejoras Técnicas**
- [ ] **PWA**: Aplicación web progresiva para uso offline
- [ ] **Sincronización en la nube**: Backup automático en servicios cloud
- [ ] **API REST**: Backend para funcionalidades avanzadas
- [ ] **Tests automatizados**: Cobertura completa de testing

## 🤝 Contribuir

¿Quieres contribuir? ¡Genial! Sigue estos pasos:

1. **Fork** el repositorio
2. **Crea una rama** para tu funcionalidad (`git checkout -b feature/mi-funcionalidad`)
3. **Commit** tus cambios (`git commit -m 'feat: agregar mi funcionalidad'`)
4. **Push** a la rama (`git push origin feature/mi-funcionalidad`)
5. **Abre un Pull Request**

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🔗 Enlaces

- **🌐 Demo en vivo**: [MindWeave Focus](https://lovable.dev/projects/41dcd8c3-517e-4d96-8f3f-b7ba93b3b68d)
- **📚 Documentación**: Este README
- **🐛 Reportar bugs**: [GitHub Issues](https://github.com/hsitadm/mindweave-focus/issues)
- **💡 Solicitar funcionalidades**: [GitHub Discussions](https://github.com/hsitadm/mindweave-focus/discussions)

---

**Desarrollado con ❤️ para maximizar tu productividad y mantener el foco en lo importante.**
