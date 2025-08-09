import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Download, 
  Upload, 
  Database, 
  Trash2, 
  Info,
  CheckCircle2,
  AlertCircle,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { 
  exportData, 
  importData, 
  clearAllData, 
  getStorageInfo 
} from "@/lib/storage";

interface DataManagerProps {
  onDataImported: (data: any) => void;
}

export function DataManager({ onDataImported }: DataManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const storageInfo = getStorageInfo();

  const handleExport = () => {
    try {
      const data = exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mindweave-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Datos exportados exitosamente");
    } catch (error) {
      toast.error("Error al exportar datos");
      console.error(error);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error("Selecciona un archivo primero");
      return;
    }

    try {
      const text = await importFile.text();
      const data = importData(text);
      onDataImported(data);
      setImportFile(null);
      setIsOpen(false);
      toast.success("Datos importados exitosamente");
    } catch (error) {
      toast.error("Error al importar datos: " + error);
      console.error(error);
    }
  };

  const handleClearData = () => {
    clearAllData();
    window.location.reload();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Desconocida';
    return new Date(dateString).toLocaleString('es-ES');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Database className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Gestión de Datos
          </DialogTitle>
          <DialogDescription>
            Exporta, importa o gestiona tus datos del mapa mental
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estado del almacenamiento */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Estado del Almacenamiento</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${storageInfo.hasData ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs text-muted-foreground">
                  {storageInfo.hasData ? 'Datos guardados' : 'Sin datos'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${storageInfo.hasBackup ? 'bg-blue-500' : 'bg-gray-400'}`} />
                <span className="text-xs text-muted-foreground">
                  {storageInfo.hasBackup ? 'Respaldo disponible' : 'Sin respaldo'}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Tareas totales:</span>
                <Badge variant="secondary">{storageInfo.totalTasks}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Completadas:</span>
                <Badge variant="outline">{storageInfo.completedTasks}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Tamaño:</span>
                <span>{formatFileSize(storageInfo.storageSize)}</span>
              </div>
              <div className="flex justify-between">
                <span>Última modificación:</span>
                <span>{formatDate(storageInfo.lastModified)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Exportar datos */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Exportar Datos</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Descarga una copia de seguridad de todos tus datos
            </p>
            <Button 
              onClick={handleExport} 
              disabled={!storageInfo.hasData}
              className="w-full gap-2"
            >
              <Download className="h-4 w-4" />
              Descargar Respaldo
            </Button>
          </div>

          <Separator />

          {/* Importar datos */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Importar Datos</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Restaura datos desde un archivo de respaldo
            </p>
            <div className="space-y-2">
              <Label htmlFor="import-file">Seleccionar archivo</Label>
              <Input
                id="import-file"
                type="file"
                accept=".json"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
            </div>
            <Button 
              onClick={handleImport} 
              disabled={!importFile}
              variant="secondary"
              className="w-full gap-2"
            >
              <Upload className="h-4 w-4" />
              Importar Datos
            </Button>
          </div>

          <Separator />

          {/* Limpiar datos */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">Zona Peligrosa</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Elimina permanentemente todos los datos almacenados
            </p>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="w-full gap-2"
                  disabled={!storageInfo.hasData}
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar Todos los Datos
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    ¿Estás seguro?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción eliminará permanentemente todos tus datos, incluyendo:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>{storageInfo.totalTasks} tareas</li>
                      <li>Todas las conexiones y relaciones</li>
                      <li>Configuraciones personalizadas</li>
                      <li>Respaldos automáticos</li>
                    </ul>
                    <strong className="text-destructive">Esta acción no se puede deshacer.</strong>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleClearData}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Sí, eliminar todo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
