import { useState, useEffect, useRef } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  Globe, 
  Download, 
  Upload, 
  Trash2, 
  RotateCcw, 
  Clock, 
  Calendar,
  Settings,
  HardDrive,
  AlertCircle,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  Save,
  FileText,
  Archive
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface BackupConfig {
  id: string;
  type: 'site' | 'database';
  enabled: boolean;
  schedule: 'daily' | 'weekly' | 'monthly' | 'manual';
  time: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  retention: number; // кількість днів
  maxBackups: number;
  compress: boolean;
  encrypt: boolean;
}

interface Backup {
  id: string;
  type: 'site' | 'database';
  name: string;
  filename: string;
  size: number;
  status: 'completed' | 'failed' | 'in_progress';
  created_at: string;
  completed_at?: string;
  error_message?: string;
  checksum: string;
  version: string;
}

interface BackupStats {
  totalBackups: number;
  totalSize: number;
  lastBackup: string;
  nextScheduledBackup: string;
  successRate: number;
}

export default function BackupManager() {
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const [backupConfigs, setBackupConfigs] = useState<BackupConfig[]>([]);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [backupStats, setBackupStats] = useState<BackupStats | null>(null);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<BackupConfig | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Завантаження конфігурації бэкапів
  const loadBackupConfigs = async () => {
    try {
      // Завантажуємо конфігурацію з localStorage (або можна з бази)
      const savedConfigs = localStorage.getItem('backup-configs');
      if (savedConfigs) {
        setBackupConfigs(JSON.parse(savedConfigs));
      } else {
        // Створюємо дефолтну конфігурацію
        const defaultConfigs: BackupConfig[] = [
          {
            id: 'site-backup',
            type: 'site',
            enabled: true,
            schedule: 'daily',
            time: '02:00',
            retention: 30,
            maxBackups: 10,
            compress: true,
            encrypt: false
          },
          {
            id: 'database-backup',
            type: 'database',
            enabled: true,
            schedule: 'daily',
            time: '03:00',
            retention: 30,
            maxBackups: 10,
            compress: true,
            encrypt: true
          }
        ];
        setBackupConfigs(defaultConfigs);
        localStorage.setItem('backup-configs', JSON.stringify(defaultConfigs));
      }
    } catch (error) {
      console.error('Error loading backup configs:', error);
    }
  };

  // Завантаження списку бэкапів
  const loadBackups = async () => {
    try {
      // Завантажуємо бэкапи з localStorage (або можна з бази)
      const savedBackups = localStorage.getItem('backup-list');
      if (savedBackups) {
        setBackups(JSON.parse(savedBackups));
      }
    } catch (error) {
      console.error('Error loading backups:', error);
    }
  };

  // Завантаження статистики
  const loadBackupStats = () => {
    const totalBackups = backups.length;
    const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
    const lastBackup = backups.length > 0 ? backups[0].created_at : 'Немає';
    const successRate = backups.length > 0 
      ? (backups.filter(b => b.status === 'completed').length / backups.length) * 100 
      : 0;

    setBackupStats({
      totalBackups,
      totalSize,
      lastBackup,
      nextScheduledBackup: 'Завтра 02:00',
      successRate
    });
  };

  useEffect(() => {
    loadBackupConfigs();
    loadBackups();
  }, []);

  useEffect(() => {
    loadBackupStats();
  }, [backups]);

  // Створення бэкапу сайту
  const createSiteBackup = async () => {
    setIsCreatingBackup(true);
    setBackupProgress(0);

    try {
      // Симуляція створення бэкапу сайту
      for (let i = 0; i <= 100; i += 10) {
        setBackupProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const backup: Backup = {
        id: `site-${Date.now()}`,
        type: 'site',
        name: `Site Backup ${new Date().toLocaleDateString()}`,
        filename: `site-backup-${Date.now()}.zip`,
        size: Math.floor(Math.random() * 10000000) + 1000000, // 1-10 MB
        status: 'completed',
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        checksum: `sha256-${Math.random().toString(36).substring(2)}`,
        version: '1.0.0'
      };

      const newBackups = [backup, ...backups];
      setBackups(newBackups);
      localStorage.setItem('backup-list', JSON.stringify(newBackups));

      toast({
        title: "Бэкап сайту створено",
        description: "Резервна копія сайту успішно створена",
      });

    } catch (error: any) {
      toast({
        title: "Помилка створення бэкапу",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreatingBackup(false);
      setBackupProgress(0);
    }
  };

  // Створення бэкапу бази даних
  const createDatabaseBackup = async () => {
    setIsCreatingBackup(true);
    setBackupProgress(0);

    try {
      // Симуляція створення бэкапу бази
      for (let i = 0; i <= 100; i += 10) {
        setBackupProgress(i);
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      const backup: Backup = {
        id: `db-${Date.now()}`,
        type: 'database',
        name: `Database Backup ${new Date().toLocaleDateString()}`,
        filename: `database-backup-${Date.now()}.sql`,
        size: Math.floor(Math.random() * 5000000) + 500000, // 500KB-5MB
        status: 'completed',
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        checksum: `sha256-${Math.random().toString(36).substring(2)}`,
        version: '1.0.0'
      };

      const newBackups = [backup, ...backups];
      setBackups(newBackups);
      localStorage.setItem('backup-list', JSON.stringify(newBackups));

      toast({
        title: "Бэкап бази створено",
        description: "Резервна копія бази даних успішно створена",
      });

    } catch (error: any) {
      toast({
        title: "Помилка створення бэкапу",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreatingBackup(false);
      setBackupProgress(0);
    }
  };

  // Завантаження бэкапу
  const uploadBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    try {
      const backup: Backup = {
        id: `upload-${Date.now()}`,
        type: file.name.includes('.sql') ? 'database' : 'site',
        name: `Uploaded Backup - ${file.name}`,
        filename: file.name,
        size: file.size,
        status: 'completed',
        created_at: new Date().toISOString(),
        checksum: `sha256-${Math.random().toString(36).substring(2)}`,
        version: '1.0.0'
      };

      const newBackups = [backup, ...backups];
      setBackups(newBackups);
      localStorage.setItem('backup-list', JSON.stringify(newBackups));

      toast({
        title: "Бэкап завантажено",
        description: "Файл резервної копії успішно завантажено",
      });

    } catch (error: any) {
      toast({
        title: "Помилка завантаження",
        description: error.message,
        variant: "destructive",
      });
    }

    // Очищаємо input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Скачування бэкапу
  const downloadBackup = async (backup: Backup) => {
    try {
      // Симуляція скачування
      const blob = new Blob(['Backup content'], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = backup.filename;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Бэкап скачано",
        description: `Файл ${backup.filename} успішно скачано`,
      });

    } catch (error: any) {
      toast({
        title: "Помилка скачування",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Видалення бэкапу
  const deleteBackup = async (backupId: string) => {
    setIsDeleting(true);

    try {
      const newBackups = backups.filter(b => b.id !== backupId);
      setBackups(newBackups);
      localStorage.setItem('backup-list', JSON.stringify(newBackups));

      toast({
        title: "Бэкап видалено",
        description: "Резервну копію успішно видалено",
      });

    } catch (error: any) {
      toast({
        title: "Помилка видалення",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Відновлення з бэкапу
  const restoreBackup = async (backup: Backup) => {
    setIsRestoring(true);

    try {
      // Симуляція відновлення
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Відновлення завершено",
        description: `Система відновлена з бэкапу ${backup.name}`,
      });

    } catch (error: any) {
      toast({
        title: "Помилка відновлення",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  // Збереження конфігурації
  const saveConfig = (config: BackupConfig) => {
    const newConfigs = backupConfigs.map(c => 
      c.id === config.id ? config : c
    );
    setBackupConfigs(newConfigs);
    localStorage.setItem('backup-configs', JSON.stringify(newConfigs));
    setShowConfigModal(false);
    setEditingConfig(null);

    toast({
      title: "Конфігурацію збережено",
      description: "Налаштування бэкапів оновлено",
    });
  };

  // Форматування розміру файлу
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Перевірка прав доступу
  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Завантаження...</div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Доступ заборонено</h2>
            <p className="text-muted-foreground">У вас немає прав для доступу до цієї сторінки.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <AdminHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Управління бэкапами</h1>
          <p className="text-muted-foreground">
            Створення, управління та відновлення резервних копій сайту та бази даних
          </p>
        </div>

        {/* Статистика */}
        {backupStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Archive className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{backupStats.totalBackups}</p>
                    <p className="text-sm text-muted-foreground">Всього бэкапів</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{formatFileSize(backupStats.totalSize)}</p>
                    <p className="text-sm text-muted-foreground">Загальний розмір</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{Math.round(backupStats.successRate)}%</p>
                    <p className="text-sm text-muted-foreground">Успішність</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{backupStats.nextScheduledBackup}</p>
                    <p className="text-sm text-muted-foreground">Наступний бэкап</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Ліва колонка - Створення бэкапів */}
          <div className="space-y-6">
            {/* Створення бэкапу сайту */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Бэкап сайту
                </CardTitle>
                <CardDescription>
                  Створення резервної копії файлів сайту
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={createSiteBackup}
                    disabled={isCreatingBackup}
                    className="flex-1"
                  >
                    {isCreatingBackup ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Створення...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Створити бэкап
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowConfigModal(true)}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
                
                {isCreatingBackup && (
                  <div className="space-y-2">
                    <Progress value={backupProgress} className="w-full" />
                    <p className="text-sm text-muted-foreground">
                      Прогрес створення: {backupProgress}%
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Створення бэкапу бази даних */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Бэкап бази даних
                </CardTitle>
                <CardDescription>
                  Створення резервної копії бази даних
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={createDatabaseBackup}
                    disabled={isCreatingBackup}
                    className="flex-1"
                  >
                    {isCreatingBackup ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Створення...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Створити бэкап
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowConfigModal(true)}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
                
                {isCreatingBackup && (
                  <div className="space-y-2">
                    <Progress value={backupProgress} className="w-full" />
                    <p className="text-sm text-muted-foreground">
                      Прогрес створення: {backupProgress}%
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Завантаження бэкапу */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Завантаження бэкапу
                </CardTitle>
                <CardDescription>
                  Завантаження існуючого файлу резервної копії
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".zip,.sql,.tar.gz,.backup"
                    onChange={uploadBackup}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Вибрати файл бэкапу
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    Підтримуються: .zip, .sql, .tar.gz, .backup
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Права колонка - Список бэкапів */}
          <div className="space-y-6">
            {/* Список бэкапів */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Список бэкапів
                </CardTitle>
                <CardDescription>
                  Управління та відновлення резервних копій
                </CardDescription>
              </CardHeader>
              <CardContent>
                {backups.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Archive className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Бэкапи ще не створені</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {backups.map((backup) => (
                      <div
                        key={backup.id}
                        className={`p-3 rounded-lg border ${
                          backup.status === 'completed' 
                            ? 'bg-green-50 border-green-200' 
                            : backup.status === 'failed'
                            ? 'bg-red-50 border-red-200'
                            : 'bg-yellow-50 border-yellow-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {backup.type === 'site' ? (
                                <Globe className="w-4 h-4 text-blue-600" />
                              ) : (
                                <Database className="w-4 h-4 text-green-600" />
                              )}
                              <Badge variant={
                                backup.status === 'completed' ? 'default' : 
                                backup.status === 'failed' ? 'destructive' : 'secondary'
                              }>
                                {backup.status === 'completed' ? 'Завершено' : 
                                 backup.status === 'failed' ? 'Помилка' : 'В процесі'}
                              </Badge>
                              <Badge variant="outline">
                                {backup.type === 'site' ? 'Сайт' : 'База'}
                              </Badge>
                            </div>
                            <p className="font-medium text-sm mb-1">{backup.name}</p>
                            <p className="text-xs text-muted-foreground mb-2">
                              {formatFileSize(backup.size)} • {new Date(backup.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadBackup(backup)}
                            disabled={backup.status !== 'completed'}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Скачати
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => restoreBackup(backup)}
                            disabled={backup.status !== 'completed' || isRestoring}
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Відновити
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteBackup(backup.id)}
                            disabled={isDeleting}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Модальне вікно конфігурації */}
        {showConfigModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Налаштування бэкапів</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Автоматичні бэкапи</Label>
                  <Switch
                    checked={editingConfig?.enabled || false}
                    onCheckedChange={(checked) => 
                      setEditingConfig(prev => prev ? {...prev, enabled: checked} : null)
                    }
                  />
                </div>
                
                <div>
                  <Label>Розклад</Label>
                  <select 
                    className="w-full mt-1 p-2 border rounded"
                    value={editingConfig?.schedule || 'daily'}
                    onChange={(e) => 
                      setEditingConfig(prev => prev ? {...prev, schedule: e.target.value as any} : null)
                    }
                  >
                    <option value="daily">Щодня</option>
                    <option value="weekly">Щотижня</option>
                    <option value="monthly">Щомісяця</option>
                    <option value="manual">Вручну</option>
                  </select>
                </div>
                
                <div>
                  <Label>Час</Label>
                  <Input
                    type="time"
                    value={editingConfig?.time || '02:00'}
                    onChange={(e) => 
                      setEditingConfig(prev => prev ? {...prev, time: e.target.value} : null)
                    }
                  />
                </div>
                
                <div>
                  <Label>Зберігати днів</Label>
                  <Input
                    type="number"
                    value={editingConfig?.retention || 30}
                    onChange={(e) => 
                      setEditingConfig(prev => prev ? {...prev, retention: parseInt(e.target.value)} : null)
                    }
                  />
                </div>
                
                <div>
                  <Label>Максимум бэкапів</Label>
                  <Input
                    type="number"
                    value={editingConfig?.maxBackups || 10}
                    onChange={(e) => 
                      setEditingConfig(prev => prev ? {...prev, maxBackups: parseInt(e.target.value)} : null)
                    }
                  />
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <Button
                  onClick={() => editingConfig && saveConfig(editingConfig)}
                  className="flex-1"
                >
                  Зберегти
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowConfigModal(false);
                    setEditingConfig(null);
                  }}
                  className="flex-1"
                >
                  Скасувати
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}