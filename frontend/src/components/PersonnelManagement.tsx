import React, { useState, useEffect } from 'react';
import { 
  Personnel, 
  PersonnelCreate, 
  PersonnelUpdate,
  PaginatedResponse,
  InstructionReadingStats,
  DepartmentStats
} from '../types';
import { personnelService } from '../services/personnelService';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/Table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from './ui/Dialog';
import { Label } from './ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Users, 
  BookOpen, 
  TrendingUp,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

export const PersonnelManagement: React.FC = () => {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<InstructionReadingStats[]>([]);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState<Personnel | null>(null);

  const [formData, setFormData] = useState<PersonnelCreate>({
    employee_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    hire_date: '',
    manager_id: ''
  });

  useEffect(() => {
    loadPersonnel();
    loadStats();
  }, [pagination.page, searchTerm, selectedDepartment]);

  const loadPersonnel = async () => {
    setIsLoading(true);
    try {
      const response = await personnelService.getPersonnel(
        pagination.page,
        pagination.limit,
        searchTerm,
        selectedDepartment
      );
      setPersonnel(response.items);
      setPagination({
        page: response.page,
        limit: response.limit,
        total: response.total,
        total_pages: response.total_pages
      });
    } catch (error) {
      toast.error('Personel listesi yüklenirken hata oluştu');
      console.error('Error loading personnel:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [statsData, deptStats] = await Promise.all([
        personnelService.getPersonnelReadingStats(),
        personnelService.getDepartmentStats()
      ]);
      setStats(statsData);
      setDepartmentStats(deptStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleCreatePersonnel = async () => {
    try {
      await personnelService.createPersonnel(formData);
      toast.success('Personel başarıyla oluşturuldu');
      setIsCreateDialogOpen(false);
      resetForm();
      loadPersonnel();
    } catch (error) {
      toast.error('Personel oluşturulurken hata oluştu');
      console.error('Error creating personnel:', error);
    }
  };

  const handleUpdatePersonnel = async () => {
    if (!editingPersonnel) return;
    
    try {
      await personnelService.updatePersonnel(editingPersonnel.id, formData);
      toast.success('Personel başarıyla güncellendi');
      setEditingPersonnel(null);
      resetForm();
      loadPersonnel();
    } catch (error) {
      toast.error('Personel güncellenirken hata oluştu');
      console.error('Error updating personnel:', error);
    }
  };

  const handleDeletePersonnel = async (id: string) => {
    if (!confirm('Bu personeli silmek istediğinizden emin misiniz?')) return;
    
    try {
      await personnelService.deletePersonnel(id);
      toast.success('Personel başarıyla silindi');
      loadPersonnel();
    } catch (error) {
      toast.error('Personel silinirken hata oluştu');
      console.error('Error deleting personnel:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      department: '',
      position: '',
      hire_date: '',
      manager_id: ''
    });
  };

  const handleEdit = (personnel: Personnel) => {
    setEditingPersonnel(personnel);
    setFormData({
      employee_id: personnel.employee_id,
      first_name: personnel.first_name,
      last_name: personnel.last_name,
      email: personnel.email,
      phone: personnel.phone || '',
      department: personnel.department,
      position: personnel.position,
      hire_date: personnel.hire_date,
      manager_id: personnel.manager_id || ''
    });
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const blob = await personnelService.exportPersonnelData(format, {
        search: searchTerm,
        department: selectedDepartment
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `personel-listesi.${format === 'csv' ? 'csv' : 'xlsx'}`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success(`${format.toUpperCase()} dosyası başarıyla indirildi`);
    } catch (error) {
      toast.error('Dosya indirilirken hata oluştu');
      console.error('Error exporting data:', error);
    }
  };

  const departments = ['İnsan Kaynakları', 'Muhasebe', 'Satış', 'Pazarlama', 'Üretim', 'Kalite', 'Bakım', 'Güvenlik'];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Personel Yönetimi</h1>
          <p className="text-muted-foreground">
            Personel bilgilerini yönetin ve talimat okuma durumlarını takip edin
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleExport('csv')} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            CSV İndir
          </Button>
          <Button onClick={() => handleExport('excel')} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Excel İndir
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Yeni Personel
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Yeni Personel Ekle</DialogTitle>
                <DialogDescription>
                  Yeni personel bilgilerini girin
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employee_id">Personel No</Label>
                  <Input
                    id="employee_id"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                    placeholder="P001"
                  />
                </div>
                <div>
                  <Label htmlFor="first_name">Ad</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    placeholder="Ahmet"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Soyad</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    placeholder="Yılmaz"
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-posta</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="ahmet@firma.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+90 555 123 45 67"
                  />
                </div>
                <div>
                  <Label htmlFor="department">Departman</Label>
                  <Select value={formData.department} onValueChange={(value) => setFormData({...formData, department: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Departman seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="position">Pozisyon</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                    placeholder="Mühendis"
                  />
                </div>
                <div>
                  <Label htmlFor="hire_date">İşe Başlama Tarihi</Label>
                  <Input
                    id="hire_date"
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  İptal
                </Button>
                <Button onClick={handleCreatePersonnel}>
                  Kaydet
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="personnel" className="space-y-4">
        <TabsList>
          <TabsTrigger value="personnel">Personel Listesi</TabsTrigger>
          <TabsTrigger value="stats">İstatistikler</TabsTrigger>
          <TabsTrigger value="departments">Departman Analizi</TabsTrigger>
        </TabsList>

        <TabsContent value="personnel" className="space-y-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Personel ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tüm departmanlar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tüm departmanlar</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Personel Listesi</CardTitle>
              <CardDescription>
                Toplam {pagination.total} personel bulundu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Personel No</TableHead>
                    <TableHead>Ad Soyad</TableHead>
                    <TableHead>Departman</TableHead>
                    <TableHead>Pozisyon</TableHead>
                    <TableHead>E-posta</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {personnel.map((person) => (
                    <TableRow key={person.id}>
                      <TableCell className="font-medium">{person.employee_id}</TableCell>
                      <TableCell>{person.first_name} {person.last_name}</TableCell>
                      <TableCell>{person.department}</TableCell>
                      <TableCell>{person.position}</TableCell>
                      <TableCell>{person.email}</TableCell>
                      <TableCell>
                        <Badge variant={person.is_active ? "default" : "secondary"}>
                          {person.is_active ? "Aktif" : "Pasif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(person)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeletePersonnel(person.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Sayfa {pagination.page} / {pagination.total_pages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={pagination.page === 1}
                onClick={() => setPagination({...pagination, page: pagination.page - 1})}
              >
                Önceki
              </Button>
              <Button
                variant="outline"
                disabled={pagination.page === pagination.total_pages}
                onClick={() => setPagination({...pagination, page: pagination.page + 1})}
              >
                Sonraki
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Personel</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pagination.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ortalama Tamamlanma</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.length > 0 
                    ? Math.round(stats.reduce((acc, stat) => acc + stat.completion_rate, 0) / stats.length)
                    : 0}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ortalama Quiz Skoru</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.length > 0 
                    ? Math.round(stats.reduce((acc, stat) => acc + (stat.average_quiz_score || 0), 0) / stats.length)
                    : 0}/100
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aktif Okuyucular</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.filter(stat => stat.last_read_at && 
                    new Date(stat.last_read_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                  ).length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Personel Okuma İstatistikleri</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Personel</TableHead>
                    <TableHead>Toplam Talimat</TableHead>
                    <TableHead>Okunan</TableHead>
                    <TableHead>Tamamlanma Oranı</TableHead>
                    <TableHead>Ortalama Quiz Skoru</TableHead>
                    <TableHead>Son Okuma</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.map((stat) => (
                    <TableRow key={stat.personnel_id}>
                      <TableCell className="font-medium">{stat.personnel_name}</TableCell>
                      <TableCell>{stat.total_instructions}</TableCell>
                      <TableCell>{stat.read_instructions}</TableCell>
                      <TableCell>
                        <Badge variant={stat.completion_rate >= 80 ? "default" : stat.completion_rate >= 60 ? "secondary" : "destructive"}>
                          {stat.completion_rate}%
                        </Badge>
                      </TableCell>
                      <TableCell>{stat.average_quiz_score || 0}/100</TableCell>
                      <TableCell>
                        {stat.last_read_at 
                          ? new Date(stat.last_read_at).toLocaleDateString('tr-TR')
                          : 'Hiç okunmamış'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Departman Bazında Analiz</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Departman</TableHead>
                    <TableHead>Personel Sayısı</TableHead>
                    <TableHead>Ortalama Tamamlanma</TableHead>
                    <TableHead>Toplam Talimat</TableHead>
                    <TableHead>Tamamlanan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departmentStats.map((dept) => (
                    <TableRow key={dept.department}>
                      <TableCell className="font-medium">{dept.department}</TableCell>
                      <TableCell>{dept.total_personnel}</TableCell>
                      <TableCell>
                        <Badge variant={dept.average_completion_rate >= 80 ? "default" : dept.average_completion_rate >= 60 ? "secondary" : "destructive"}>
                          {dept.average_completion_rate}%
                        </Badge>
                      </TableCell>
                      <TableCell>{dept.total_instructions_assigned}</TableCell>
                      <TableCell>{dept.completed_instructions}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editingPersonnel} onOpenChange={() => setEditingPersonnel(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Personel Düzenle</DialogTitle>
            <DialogDescription>
              Personel bilgilerini güncelleyin
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit_employee_id">Personel No</Label>
              <Input
                id="edit_employee_id"
                value={formData.employee_id}
                onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                placeholder="P001"
              />
            </div>
            <div>
              <Label htmlFor="edit_first_name">Ad</Label>
              <Input
                id="edit_first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                placeholder="Ahmet"
              />
            </div>
            <div>
              <Label htmlFor="edit_last_name">Soyad</Label>
              <Input
                id="edit_last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                placeholder="Yılmaz"
              />
            </div>
            <div>
              <Label htmlFor="edit_email">E-posta</Label>
              <Input
                id="edit_email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="ahmet@firma.com"
              />
            </div>
            <div>
              <Label htmlFor="edit_phone">Telefon</Label>
              <Input
                id="edit_phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+90 555 123 45 67"
              />
            </div>
            <div>
              <Label htmlFor="edit_department">Departman</Label>
              <Select value={formData.department} onValueChange={(value) => setFormData({...formData, department: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Departman seçin" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit_position">Pozisyon</Label>
              <Input
                id="edit_position"
                value={formData.position}
                onChange={(e) => setFormData({...formData, position: e.target.value})}
                placeholder="Mühendis"
              />
            </div>
            <div>
              <Label htmlFor="edit_hire_date">İşe Başlama Tarihi</Label>
              <Input
                id="edit_hire_date"
                type="date"
                value={formData.hire_date}
                onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setEditingPersonnel(null)}>
              İptal
            </Button>
            <Button onClick={handleUpdatePersonnel}>
              Güncelle
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
