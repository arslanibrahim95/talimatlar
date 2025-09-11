import React, { useState, useEffect, useCallback } from 'react';
import { 
  BulkInstructionAssignment as BulkAssignment,
  AssignmentCriteria,
  AssignmentTemplate,
  AssignmentTemplateCreate,
  BulkAssignmentResult,
  Personnel,
  Document,
  WorkShift,
  Skill,
  Location
} from '../types';
import { personnelService } from '../services/personnelService';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Label } from './ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs';
import { 
  Users, 
  Target, 
  Filter, 
  Plus, 
  Save, 
  Trash2, 
  Eye,
  Calendar,
  Clock,
  MapPin,
  Award,
  Building,
  CheckCircle,
  AlertTriangle,
  Download,
  History
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from './ui/Badge';
import { Switch } from './ui/Switch';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/Table';

export const BulkInstructionAssignment: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'assign' | 'templates' | 'history'>('assign');
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Form states
  const [selectedInstruction, setSelectedInstruction] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [notes, setNotes] = useState<string>('');
  const [sendNotifications, setSendNotifications] = useState(true);
  const [scheduleReminders, setScheduleReminders] = useState(true);

  // Criteria states
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [selectedWorkShifts, setSelectedWorkShifts] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<string>('');
  const [excludePersonnel, setExcludePersonnel] = useState<string[]>([]);
  const [includePersonnel, setIncludePersonnel] = useState<string[]>([]);

  // Data states
  const [instructions, setInstructions] = useState<Document[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [positions, setPositions] = useState<string[]>([]);
  const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [templates, setTemplates] = useState<AssignmentTemplate[]>([]);

  // Preview states
  const [previewData, setPreviewData] = useState<{
    total: number;
    by_department: Record<string, number>;
    by_position: Record<string, number>;
    preview: Personnel[];
  } | null>(null);

  // Template states
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [defaultDueDays, setDefaultDueDays] = useState(7);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [
        instructionsData,
        personnelData,
        workShiftsData,
        skillsData,
        locationsData,
        templatesData
      ] = await Promise.all([
        loadInstructions(),
        loadPersonnel(),
        personnelService.getWorkShifts(),
        personnelService.getSkills(),
        personnelService.getLocations(),
        personnelService.getAssignmentTemplates()
      ]);

      setInstructions(instructionsData);
      setPersonnel(personnelData);
      setWorkShifts(workShiftsData);
      setSkills(skillsData);
      setLocations(locationsData);
      setTemplates(templatesData);

      // Extract unique departments and positions
      const uniqueDepartments = [...new Set(personnelData.map(p => p.department))];
      const uniquePositions = [...new Set(personnelData.map(p => p.position))];
      setDepartments(uniqueDepartments);
      setPositions(uniquePositions);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadInstructions = async (): Promise<Document[]> => {
    // Mock data - gerçek uygulamada document service'den gelecek
    return [
      {
        id: '1',
        title: 'Güvenlik Talimatları',
        description: 'İş güvenliği kuralları ve prosedürler',
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
      },
      {
        id: '3',
        title: 'Üretim Standartları',
        description: 'Üretim süreçleri ve standartları',
        category: 'Üretim',
        status: 'published',
        created_by: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  };

  const loadPersonnel = async (): Promise<Personnel[]> => {
    try {
      const response = await personnelService.getPersonnel(1, 1000);
      return response.items;
    } catch (error) {
      console.error('Error loading personnel:', error);
      return [];
    }
  };

  const handlePreview = useCallback(async (): Promise<void> => {
    if (!hasValidCriteria()) {
      toast.error('Lütfen en az bir kriter seçin');
      return;
    }

    setIsPreviewLoading(true);
    try {
      const criteria = buildAssignmentCriteria();
      const preview = await personnelService.getPersonnelCountByCriteria(criteria);
      setPreviewData(preview);
      toast.success(`${preview.total} personel bulundu`);
    } catch (error) {
      toast.error('Önizleme yüklenemedi');
      console.error('Preview error:', error);
    } finally {
      setIsPreviewLoading(false);
    }
  }, [hasValidCriteria, buildAssignmentCriteria]);

  const handleBulkAssign = async () => {
    if (!selectedInstruction || !hasValidCriteria()) {
      toast.error('Lütfen talimat seçin ve kriterleri belirleyin');
      return;
    }

    setIsLoading(true);
    try {
      const assignment: BulkAssignment = {
        instruction_id: selectedInstruction,
        assignment_criteria: buildAssignmentCriteria(),
        due_date: dueDate || undefined,
        priority,
        notes: notes || undefined,
        send_notifications: sendNotifications,
        schedule_reminders: scheduleReminders
      };

      const result = await personnelService.bulkAssignByCriteria(assignment);
      
      if (result.success > 0) {
        toast.success(`${result.success} personel için talimat başarıyla atandı`);
        resetForm();
        setPreviewData(null);
      }
      
      if (result.failed > 0) {
        toast.error(`${result.failed} personel için atama başarısız`);
      }

      // Show detailed results
      showAssignmentResults(result);
    } catch (error) {
      toast.error('Toplu atama sırasında hata oluştu');
      console.error('Bulk assignment error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const buildAssignmentCriteria = (): AssignmentCriteria => {
    return {
      departments: selectedDepartments.length > 0 ? selectedDepartments : undefined,
      positions: selectedPositions.length > 0 ? selectedPositions : undefined,
      work_shifts: selectedWorkShifts.length > 0 ? selectedWorkShifts : undefined,
      locations: selectedLocations.length > 0 ? selectedLocations : undefined,
      skills: selectedSkills.length > 0 ? selectedSkills : undefined,
      experience_levels: experienceLevel ? [experienceLevel] : undefined,
      exclude_personnel: excludePersonnel.length > 0 ? excludePersonnel : undefined,
      include_personnel: includePersonnel.length > 0 ? includePersonnel : undefined
    };
  };

  const hasValidCriteria = (): boolean => {
    return selectedDepartments.length > 0 || 
           selectedPositions.length > 0 || 
           selectedWorkShifts.length > 0 || 
           selectedLocations.length > 0 || 
           selectedSkills.length > 0 || 
           experienceLevel || 
           includePersonnel.length > 0;
  };

  const resetForm = () => {
    setSelectedInstruction('');
    setDueDate('');
    setPriority('medium');
    setNotes('');
    setSelectedDepartments([]);
    setSelectedPositions([]);
    setSelectedWorkShifts([]);
    setSelectedLocations([]);
    setSelectedSkills([]);
    setExperienceLevel('');
    setExcludePersonnel([]);
    setIncludePersonnel([]);
  };

  const handleSaveTemplate = async () => {
    if (!templateName || !hasValidCriteria()) {
      toast.error('Lütfen şablon adı girin ve kriterleri belirleyin');
      return;
    }

    setIsCreatingTemplate(true);
    try {
      const template: AssignmentTemplateCreate = {
        name: templateName,
        description: templateDescription,
        criteria: buildAssignmentCriteria(),
        default_priority: priority,
        default_due_days: defaultDueDays
      };

      await personnelService.createAssignmentTemplate(template);
      toast.success('Şablon başarıyla kaydedildi');
      
      // Reset template form
      setTemplateName('');
      setTemplateDescription('');
      setDefaultDueDays(7);
      
      // Reload templates
      const updatedTemplates = await personnelService.getAssignmentTemplates();
      setTemplates(updatedTemplates);
    } catch (error) {
      toast.error('Şablon kaydedilemedi');
      console.error('Template save error:', error);
    } finally {
      setIsCreatingTemplate(false);
    }
  };

  const handleLoadTemplate = (template: AssignmentTemplate) => {
    setSelectedDepartments(template.criteria.departments || []);
    setSelectedPositions(template.criteria.positions || []);
    setSelectedWorkShifts(template.criteria.work_shifts || []);
    setSelectedLocations(template.criteria.locations || []);
    setSelectedSkills(template.criteria.skills || []);
    setExperienceLevel(template.criteria.experience_levels?.[0] || '');
    setExcludePersonnel(template.criteria.exclude_personnel || []);
    setIncludePersonnel(template.criteria.include_personnel || []);
    setPriority(template.default_priority);
    setDefaultDueDays(template.default_due_days);
    
    toast.success(`"${template.name}" şablonu yüklendi`);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Bu şablonu silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await personnelService.deleteAssignmentTemplate(templateId);
      toast.success('Şablon silindi');
      
      const updatedTemplates = await personnelService.getAssignmentTemplates();
      setTemplates(updatedTemplates);
    } catch (error) {
      toast.error('Şablon silinemedi');
      console.error('Template delete error:', error);
    }
  };

  const showAssignmentResults = (result: BulkAssignmentResult) => {
    // Bu fonksiyon detaylı sonuçları gösterecek
    // Modal veya yeni sayfa olarak implement edilebilir
    console.log('Assignment results:', result);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'low': return 'Düşük';
      case 'medium': return 'Orta';
      case 'high': return 'Yüksek';
      case 'urgent': return 'Acil';
      default: return priority;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Toplu Talimat Atama</h1>
          <p className="text-muted-foreground">
            Bölüm, pozisyon ve diğer kriterlere göre toplu talimat atama
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assign" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Toplu Atama
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            Şablonlar
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Geçmiş
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assign" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sol Panel - Atama Bilgileri */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Talimat Seçimi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="instruction">Talimat</Label>
                    <Select value={selectedInstruction} onValueChange={setSelectedInstruction}>
                      <SelectTrigger>
                        <SelectValue placeholder="Talimat seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {instructions.map((instruction) => (
                          <SelectItem key={instruction.id} value={instruction.id}>
                            {instruction.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="due_date">Son Tarih</Label>
                      <Input
                        id="due_date"
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="priority">Öncelik</Label>
                      <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Düşük</SelectItem>
                          <SelectItem value="medium">Orta</SelectItem>
                          <SelectItem value="high">Yüksek</SelectItem>
                          <SelectItem value="urgent">Acil</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notlar</Label>
                    <Input
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ek notlar..."
                      className="mt-1"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="notifications">Bildirim Gönder</Label>
                      <Switch
                        id="notifications"
                        checked={sendNotifications}
                        onCheckedChange={setSendNotifications}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="reminders">Hatırlatma Planla</Label>
                      <Switch
                        id="reminders"
                        checked={scheduleReminders}
                        onCheckedChange={setScheduleReminders}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Kriter Seçimi */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Atama Kriterleri
                  </CardTitle>
                  <CardDescription>
                    Hangi personellere atama yapılacağını belirleyin
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Departmanlar</Label>
                    <Select 
                      value={selectedDepartments[0] || ''} 
                      onValueChange={(value) => setSelectedDepartments([value])}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Departman seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Tüm departmanlar</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Pozisyonlar</Label>
                    <Select 
                      value={selectedPositions[0] || ''} 
                      onValueChange={(value) => setSelectedPositions([value])}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pozisyon seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Tüm pozisyonlar</SelectItem>
                        {positions.map((pos) => (
                          <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Vardiyalar</Label>
                    <Select 
                      value={selectedWorkShifts[0] || ''} 
                      onValueChange={(value) => setSelectedWorkShifts([value])}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Vardiya seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Tüm vardiyalar</SelectItem>
                        {workShifts.map((shift) => (
                          <SelectItem key={shift.id} value={shift.id}>
                            {shift.name} ({shift.start_time} - {shift.end_time})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Lokasyonlar</Label>
                    <Select 
                      value={selectedLocations[0] || ''} 
                      onValueChange={(value) => setSelectedLocations([value])}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Lokasyon seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Tüm lokasyonlar</SelectItem>
                        {locations.map((loc) => (
                          <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Yetenek Seviyesi</Label>
                    <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Yetenek seviyesi seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Tüm seviyeler</SelectItem>
                        <SelectItem value="beginner">Başlangıç</SelectItem>
                        <SelectItem value="intermediate">Orta</SelectItem>
                        <SelectItem value="advanced">İleri</SelectItem>
                        <SelectItem value="expert">Uzman</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sağ Panel - Önizleme ve Sonuçlar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Personel Önizlemesi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={handlePreview}
                    disabled={!hasValidCriteria() || isPreviewLoading}
                    className="w-full mb-4"
                  >
                    {isPreviewLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Önizleme Yükleniyor...
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Önizleme Göster
                      </>
                    )}
                  </Button>

                  {previewData && (
                    <div className="space-y-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {previewData.total}
                        </div>
                        <div className="text-sm text-blue-700">Toplam Personel</div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium">Departman Dağılımı</h4>
                        {Object.entries(previewData.by_department).map(([dept, count]) => (
                          <div key={dept} className="flex justify-between items-center">
                            <span className="text-sm">{dept}</span>
                            <Badge variant="outline">{count}</Badge>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium">Pozisyon Dağılımı</h4>
                        {Object.entries(previewData.by_position).map(([pos, count]) => (
                          <div key={pos} className="flex justify-between items-center">
                            <span className="text-sm">{pos}</span>
                            <Badge variant="outline">{count}</Badge>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium">Örnek Personel</h4>
                        <div className="space-y-2">
                          {previewData.preview.slice(0, 5).map((person) => (
                            <div key={person.id} className="text-sm p-2 bg-gray-50 rounded">
                              {person.first_name} {person.last_name} - {person.department}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Toplu Atama Butonu */}
              <Card>
                <CardContent className="pt-6">
                  <Button 
                    onClick={handleBulkAssign}
                    disabled={!selectedInstruction || !hasValidCriteria() || isLoading}
                    className="w-full"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Atama Yapılıyor...
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4 mr-2" />
                        Toplu Talimat Ata
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Şablon Oluşturma */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Yeni Şablon Oluştur
                </CardTitle>
                <CardDescription>
                  Sık kullanılan kriterleri şablon olarak kaydedin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="template_name">Şablon Adı</Label>
                  <Input
                    id="template_name"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Örn: Üretim Vardiyası"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="template_description">Açıklama</Label>
                  <Input
                    id="template_description"
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    placeholder="Şablon açıklaması..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="default_due_days">Varsayılan Son Tarih (Gün)</Label>
                  <Input
                    id="default_due_days"
                    type="number"
                    value={defaultDueDays}
                    onChange={(e) => setDefaultDueDays(parseInt(e.target.value))}
                    min="1"
                    max="365"
                    className="mt-1"
                  />
                </div>

                <Button 
                  onClick={handleSaveTemplate}
                  disabled={!templateName || !hasValidCriteria() || isCreatingTemplate}
                  className="w-full"
                >
                  {isCreatingTemplate ? 'Kaydediliyor...' : 'Şablon Kaydet'}
                </Button>
              </CardContent>
            </Card>

            {/* Mevcut Şablonlar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Save className="w-5 h-5" />
                  Mevcut Şablonlar
                </CardTitle>
              </CardHeader>
              <CardContent>
                {templates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Henüz şablon oluşturulmamış
                  </div>
                ) : (
                  <div className="space-y-3">
                    {templates.map((template) => (
                      <div key={template.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{template.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {template.description}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleLoadTemplate(template)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteTemplate(template.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">
                            {template.default_priority}
                          </Badge>
                          <Badge variant="outline">
                            {template.default_due_days} gün
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Toplu Atama Geçmişi
              </CardTitle>
              <CardDescription>
                Daha önce yapılan toplu atamaların listesi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Geçmiş veriler yükleniyor...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
