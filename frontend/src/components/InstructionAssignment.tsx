import React, { useState, useEffect } from 'react';
import { 
  InstructionAssignment as Assignment,
  InstructionAssignmentCreate,
  Personnel,
  Document,
  PaginatedResponse
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
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Users,
  FileText,
  Target
} from 'lucide-react';
import { toast } from 'sonner';

export const InstructionAssignment: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  const [formData, setFormData] = useState<InstructionAssignmentCreate>({
    instruction_id: '',
    personnel_id: '',
    due_date: '',
    priority: 'medium',
    notes: ''
  });

  useEffect(() => {
    loadAssignments();
    loadPersonnel();
    loadDocuments();
  }, [pagination.page, searchTerm, selectedStatus]);

  const loadAssignments = async () => {
    setIsLoading(true);
    try {
      const response = await personnelService.getInstructionAssignments(
        undefined,
        undefined,
        selectedStatus,
        pagination.page,
        pagination.limit
      );
      setAssignments(response.items);
      setPagination({
        page: response.page,
        limit: response.limit,
        total: response.total,
        total_pages: response.total_pages
      });
    } catch (error) {
      toast.error('Talimat atamaları yüklenirken hata oluştu');
      console.error('Error loading assignments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPersonnel = async () => {
    try {
      const response = await personnelService.getPersonnel(1, 1000);
      setPersonnel(response.items);
    } catch (error) {
      console.error('Error loading personnel:', error);
    }
  };

  const loadDocuments = async () => {
    try {
      // Bu kısım document service'den gelecek
      // Şimdilik mock data kullanıyoruz
      setDocuments([
        {
          id: '1',
          title: 'Güvenlik Talimatları',
          description: 'İş güvenliği kuralları',
          category: 'Güvenlik',
          status: 'published',
          created_by: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Kalite Kontrol Prosedürleri',
          description: 'Ürün kalite kontrol süreçleri',
          category: 'Kalite',
          status: 'published',
          created_by: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const handleCreateAssignment = async () => {
    try {
      await personnelService.createInstructionAssignment(formData);
      toast.success('Talimat başarıyla atandı');
      setIsCreateDialogOpen(false);
      resetForm();
      loadAssignments();
    } catch (error) {
      toast.error('Talimat atanırken hata oluştu');
      console.error('Error creating assignment:', error);
    }
  };

  const handleUpdateAssignment = async () => {
    if (!editingAssignment) return;
    
    try {
      await personnelService.updateInstructionAssignment(editingAssignment.id, formData);
      toast.success('Talimat ataması başarıyla güncellendi');
      setEditingAssignment(null);
      resetForm();
      loadAssignments();
    } catch (error) {
      toast.error('Talimat ataması güncellenirken hata oluştu');
      console.error('Error updating assignment:', error);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Bu talimat atamasını silmek istediğinizden emin misiniz?')) return;
    
    try {
      await personnelService.deleteInstructionAssignment(id);
      toast.success('Talimat ataması başarıyla silindi');
      loadAssignments();
    } catch (error) {
      toast.error('Talimat ataması silinirken hata oluştu');
      console.error('Error deleting assignment:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      instruction_id: '',
      personnel_id: '',
      due_date: '',
      priority: 'medium',
      notes: ''
    });
  };

  const handleEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      instruction_id: assignment.instruction_id,
      personnel_id: assignment.personnel_id,
      due_date: assignment.due_date || '',
      priority: assignment.priority,
      notes: assignment.notes || ''
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      assigned: "default",
      in_progress: "secondary",
      completed: "outline",
      overdue: "destructive"
    };

    const labels: Record<string, string> = {
      assigned: "Atandı",
      in_progress: "Devam Ediyor",
      completed: "Tamamlandı",
      overdue: "Gecikmiş"
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      low: "outline",
      medium: "secondary",
      high: "default",
      urgent: "destructive"
    };

    const labels: Record<string, string> = {
      low: "Düşük",
      medium: "Orta",
      high: "Yüksek",
      urgent: "Acil"
    };

    return (
      <Badge variant={variants[priority] || "secondary"}>
        {labels[priority] || priority}
      </Badge>
    );
  };

  const getPersonnelName = (personnelId: string) => {
    const person = personnel.find(p => p.id === personnelId);
    return person ? `${person.first_name} ${person.last_name}` : 'Bilinmeyen';
  };

  const getDocumentTitle = (documentId: string) => {
    const doc = documents.find(d => d.id === documentId);
    return doc ? doc.title : 'Bilinmeyen';
  };

  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Talimat Atama ve Takip</h1>
          <p className="text-muted-foreground">
            Personellere talimat atayın ve okuma durumlarını takip edin
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Talimat Ata
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Yeni Talimat Atama</DialogTitle>
              <DialogDescription>
                Personellere talimat atayın
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="instruction_id">Talimat</Label>
                <Select value={formData.instruction_id} onValueChange={(value) => setFormData({...formData, instruction_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Talimat seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {documents.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>{doc.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="personnel_id">Personel</Label>
                <Select value={formData.personnel_id} onValueChange={(value) => setFormData({...formData, personnel_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Personel seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {personnel.map((person) => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.first_name} {person.last_name} - {person.department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="due_date">Son Tarih</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="priority">Öncelik</Label>
                <Select value={formData.priority} onValueChange={(value: any) => setFormData({...formData, priority: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Öncelik seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Düşük</SelectItem>
                    <SelectItem value="medium">Orta</SelectItem>
                    <SelectItem value="high">Yüksek</SelectItem>
                    <SelectItem value="urgent">Acil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="notes">Notlar</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Ek notlar..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleCreateAssignment}>
                Ata
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="assignments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assignments">Talimat Atamaları</TabsTrigger>
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Talimat ataması ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tüm durumlar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tüm durumlar</SelectItem>
                <SelectItem value="assigned">Atandı</SelectItem>
                <SelectItem value="in_progress">Devam Ediyor</SelectItem>
                <SelectItem value="completed">Tamamlandı</SelectItem>
                <SelectItem value="overdue">Gecikmiş</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Talimat Atamaları</CardTitle>
              <CardDescription>
                Toplam {pagination.total} atama bulundu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Talimat</TableHead>
                    <TableHead>Personel</TableHead>
                    <TableHead>Son Tarih</TableHead>
                    <TableHead>Öncelik</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.id} className={isOverdue(assignment.due_date || '') ? 'bg-red-50' : ''}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          {getDocumentTitle(assignment.instruction_id)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          {getPersonnelName(assignment.personnel_id)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {assignment.due_date ? (
                            <>
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className={isOverdue(assignment.due_date) ? 'text-red-600 font-medium' : ''}>
                                {new Date(assignment.due_date).toLocaleDateString('tr-TR')}
                              </span>
                              {isOverdue(assignment.due_date) && (
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                              )}
                            </>
                          ) : (
                            <span className="text-muted-foreground">Belirtilmemiş</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getPriorityBadge(assignment.priority)}</TableCell>
                      <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(assignment)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteAssignment(assignment.id)}
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

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Atama</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pagination.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tamamlanan</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {assignments.filter(a => a.status === 'completed').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Devam Eden</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {assignments.filter(a => a.status === 'in_progress').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gecikmiş</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {assignments.filter(a => isOverdue(a.due_date || '')).length}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Öncelik Dağılımı</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['urgent', 'high', 'medium', 'low'].map((priority) => {
                    const count = assignments.filter(a => a.priority === priority).length;
                    const percentage = pagination.total > 0 ? (count / pagination.total) * 100 : 0;
                    return (
                      <div key={priority} className="flex justify-between items-center">
                        <span className="capitalize">{priority}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-muted-foreground">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Durum Dağılımı</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['assigned', 'in_progress', 'completed', 'overdue'].map((status) => {
                    const count = assignments.filter(a => a.status === status).length;
                    const percentage = pagination.total > 0 ? (count / pagination.total) * 100 : 0;
                    return (
                      <div key={status} className="flex justify-between items-center">
                        <span>{getStatusBadge(status)}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-muted-foreground">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editingAssignment} onOpenChange={() => setEditingAssignment(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Talimat Ataması Düzenle</DialogTitle>
            <DialogDescription>
              Talimat ataması bilgilerini güncelleyin
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="edit_instruction_id">Talimat</Label>
              <Select value={formData.instruction_id} onValueChange={(value) => setFormData({...formData, instruction_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Talimat seçin" />
                </SelectTrigger>
                <SelectContent>
                  {documents.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>{doc.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="edit_personnel_id">Personel</Label>
              <Select value={formData.personnel_id} onValueChange={(value) => setFormData({...formData, personnel_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Personel seçin" />
                </SelectTrigger>
                <SelectContent>
                  {personnel.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.first_name} {person.last_name} - {person.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit_due_date">Son Tarih</Label>
              <Input
                id="edit_due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit_priority">Öncelik</Label>
              <Select value={formData.priority} onValueChange={(value: any) => setFormData({...formData, priority: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Öncelik seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Düşük</SelectItem>
                  <SelectItem value="medium">Orta</SelectItem>
                  <SelectItem value="high">Yüksek</SelectItem>
                  <SelectItem value="urgent">Acil</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="edit_notes">Notlar</Label>
              <Input
                id="edit_notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Ek notlar..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setEditingAssignment(null)}>
              İptal
            </Button>
            <Button onClick={handleUpdateAssignment}>
              Güncelle
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
