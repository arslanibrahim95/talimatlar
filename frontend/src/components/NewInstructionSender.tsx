import React, { useState, useEffect, useCallback } from 'react';
import { 
  Document,
  Personnel,
  BulkInstructionAssignment,
  AssignmentCriteria
} from '../types';
import { personnelService } from '../services/personnelService';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Label } from './ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs';
import { 
  FileText, 
  Users, 
  Send, 
  Plus, 
  Eye,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Building,
  Target,
  Filter,
  Upload,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from './ui/Badge';
import { Switch } from './ui/Switch';
import { Textarea } from './ui/Textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/Table';

export const NewInstructionSender: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'send' | 'templates'>('create');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Talimat oluşturma states
  const [instructionTitle, setInstructionTitle] = useState('');
  const [instructionDescription, setInstructionDescription] = useState('');
  const [instructionCategory, setInstructionCategory] = useState('');
  const [instructionContent, setInstructionContent] = useState('');
  const [instructionPriority, setInstructionPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [instructionDueDays, setInstructionDueDays] = useState(7);
  const [instructionTags, setInstructionTags] = useState<string[]>([]);
  const [instructionFile, setInstructionFile] = useState<File | null>(null);

  // Gönderme states
  const [selectedPersonnel, setSelectedPersonnel] = useState<string[]>([]);
  const [sendImmediately, setSendImmediately] = useState(true);
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [sendNotifications, setSendNotifications] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSMS, setSendSMS] = useState(false);
  const [sendPush, setSendPush] = useState(true);
  const [customMessage, setCustomMessage] = useState('');

  // Kriter bazlı gönderim states
  const [useCriteria, setUseCriteria] = useState(false);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [selectedWorkShifts, setSelectedWorkShifts] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<string>('');

  // Data states
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [positions, setPositions] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<{
    total: number;
    by_department: Record<string, number>;
    by_position: Record<string, number>;
    preview: Personnel[];
  } | null>(null);

  // Template states
  const [templates, setTemplates] = useState<Document[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = useCallback(async (): Promise<void> => {
    try {
      const [personnelData, templatesData] = await Promise.all([
        loadPersonnel(),
        loadTemplates()
      ]);

      setPersonnel(personnelData);
      setTemplates(templatesData);

      // Extract unique departments, positions, and categories
      const uniqueDepartments = [...new Set(personnelData.map(p => p.department).filter(Boolean))];
      const uniquePositions = [...new Set(personnelData.map(p => p.position).filter(Boolean))];
      const uniqueCategories = [...new Set(templatesData.map(t => t.category).filter(Boolean))];
      
      setDepartments(uniqueDepartments);
      setPositions(uniquePositions);
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Veri yüklenirken hata oluştu');
    }
  }, []);

  const loadPersonnel = useCallback(async (): Promise<Personnel[]> => {
    try {
      const response = await personnelService.getPersonnel(1, 1000);
      return response.items;
    } catch (error) {
      console.error('Error loading personnel:', error);
      toast.error('Personel verileri yüklenirken hata oluştu');
      return [];
    }
  }, []);

  const loadTemplates = useCallback(async (): Promise<Document[]> => {
    try {
      // Mock data - gerçek uygulamada document service'den gelecek
      return [
        {
          id: '1',
          title: 'Güvenlik Talimatları Şablonu',
          description: 'Genel güvenlik kuralları ve prosedürler',
          category: 'Güvenlik',
          status: 'published',
          created_by: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Kalite Kontrol Şablonu',
          description: 'Kalite kontrol süreçleri ve standartları',
          category: 'Kalite',
          status: 'published',
          created_by: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          title: 'Üretim Prosedürleri Şablonu',
          description: 'Üretim süreçleri ve standartları',
          category: 'Üretim',
          status: 'published',
          created_by: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Şablonlar yüklenirken hata oluştu');
      return [];
    }
  }, []);

  const handleCreateInstruction = useCallback(async (): Promise<void> => {
    if (!instructionTitle || !instructionDescription || !instructionContent) {
      toast.error('Lütfen gerekli alanları doldurun');
      return;
    }

    setIsLoading(true);
    try {
      // Burada yeni talimat oluşturulacak
      // Gerçek uygulamada document service'e gönderilecek
      const newInstruction: Document = {
        id: Date.now().toString(),
        title: instructionTitle,
        description: instructionDescription,
        category: instructionCategory,
        status: 'draft',
        created_by: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      toast.success('Talimat başarıyla oluşturuldu');
      
      // Form'u temizle
      resetInstructionForm();
      
      // Talimatlar listesini güncelle
      const updatedTemplates = await loadTemplates();
      setTemplates(updatedTemplates);
    } catch (error) {
      toast.error('Talimat oluşturulamadı');
      console.error('Create instruction error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [instructionTitle, instructionDescription, instructionContent, instructionCategory, loadTemplates]);

  const handleSendInstruction = async () => {
    if (!selectedTemplate && !instructionTitle) {
      toast.error('Lütfen bir talimat seçin veya oluşturun');
      return;
    }

    if (useCriteria && !hasValidCriteria()) {
      toast.error('Lütfen en az bir kriter seçin');
      return;
    }

    if (!useCriteria && selectedPersonnel.length === 0) {
      toast.error('Lütfen en az bir personel seçin');
      return;
    }

    setIsSending(true);
    try {
      if (useCriteria) {
        // Kriter bazlı toplu gönderim
        await sendByCriteria();
      } else {
        // Seçili personellere gönderim
        await sendToSelectedPersonnel();
      }

      toast.success('Talimat başarıyla gönderildi');
      resetSendForm();
    } catch (error) {
      toast.error('Talimat gönderilemedi');
      console.error('Send instruction error:', error);
    } finally {
      setIsSending(false);
    }
  };

  const sendByCriteria = async () => {
    const criteria: AssignmentCriteria = {
      departments: selectedDepartments.length > 0 ? selectedDepartments : undefined,
      positions: selectedPositions.length > 0 ? selectedPositions : undefined,
      work_shifts: selectedWorkShifts.length > 0 ? selectedWorkShifts : undefined,
      locations: selectedLocations.length > 0 ? selectedLocations : undefined,
      skills: selectedSkills.length > 0 ? selectedSkills : undefined,
      experience_levels: experienceLevel ? [experienceLevel] : undefined
    };

    const assignment: BulkInstructionAssignment = {
      instruction_id: selectedTemplate || 'new',
      assignment_criteria: criteria,
      due_date: getDueDate(),
      priority: instructionPriority,
      notes: customMessage || undefined,
      send_notifications: sendNotifications,
      schedule_reminders: true
    };

    await personnelService.bulkAssignByCriteria(assignment);
  };

  const sendToSelectedPersonnel = async () => {
    // Seçili personellere talimat atama
    const instructionId = selectedTemplate || 'new';
    
    for (const personnelId of selectedPersonnel) {
      await personnelService.createInstructionAssignment({
        instruction_id: instructionId,
        personnel_id: personnelId,
        due_date: getDueDate(),
        priority: instructionPriority,
        notes: customMessage || undefined
      });
    }
  };

  const getDueDate = (): string | undefined => {
    if (sendImmediately) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + instructionDueDays);
      return dueDate.toISOString().split('T')[0];
    }
    return scheduledDate;
  };

  const handlePreviewCriteria = async () => {
    if (!hasValidCriteria()) {
      toast.error('Lütfen en az bir kriter seçin');
      return;
    }

    try {
      const criteria: AssignmentCriteria = {
        departments: selectedDepartments.length > 0 ? selectedDepartments : undefined,
        positions: selectedPositions.length > 0 ? selectedPositions : undefined,
        work_shifts: selectedWorkShifts.length > 0 ? selectedWorkShifts : undefined,
        locations: selectedLocations.length > 0 ? selectedLocations : undefined,
        skills: selectedSkills.length > 0 ? selectedSkills : undefined,
        experience_levels: experienceLevel ? [experienceLevel] : undefined
      };

      const preview = await personnelService.getPersonnelCountByCriteria(criteria);
      setPreviewData(preview);
      toast.success(`${preview.total} personel bulundu`);
    } catch (error) {
      toast.error('Önizleme yüklenemedi');
      console.error('Preview error:', error);
    }
  };

  const hasValidCriteria = (): boolean => {
    return selectedDepartments.length > 0 || 
           selectedPositions.length > 0 || 
           selectedWorkShifts.length > 0 || 
           selectedLocations.length > 0 || 
           selectedSkills.length > 0 || 
           experienceLevel;
  };

  const resetInstructionForm = () => {
    setInstructionTitle('');
    setInstructionDescription('');
    setInstructionCategory('');
    setInstructionContent('');
    setInstructionPriority('medium');
    setInstructionDueDays(7);
    setInstructionTags([]);
    setInstructionFile(null);
  };

  const resetSendForm = () => {
    setSelectedPersonnel([]);
    setSendImmediately(true);
    setScheduledDate('');
    setScheduledTime('');
    setSendNotifications(true);
    setSendEmail(true);
    setSendSMS(false);
    setSendPush(true);
    setCustomMessage('');
    setUseCriteria(false);
    setSelectedDepartments([]);
    setSelectedPositions([]);
    setSelectedWorkShifts([]);
    setSelectedLocations([]);
    setSelectedSkills([]);
    setExperienceLevel('');
    setPreviewData(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setInstructionFile(file);
      toast.success(`Dosya yüklendi: ${file.name}`);
    }
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
          <h1 className="text-3xl font-bold">Yeni Talimat Oluştur ve Gönder</h1>
          <p className="text-muted-foreground">
            Yeni talimatlar oluşturun ve personellere gönderin
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Talimat Oluştur
          </TabsTrigger>
          <TabsTrigger value="send" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Talimat Gönder
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Şablonlar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Yeni Talimat Oluştur
              </CardTitle>
              <CardDescription>
                Personellere gönderilecek yeni talimatı oluşturun
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Talimat Başlığı *</Label>
                  <Input
                    id="title"
                    value={instructionTitle}
                    onChange={(e) => setInstructionTitle(e.target.value)}
                    placeholder="Örn: Yeni Güvenlik Prosedürleri"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Kategori</Label>
                  <Select value={instructionCategory} onValueChange={setInstructionCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Kısa Açıklama</Label>
                <Input
                  id="description"
                  value={instructionDescription}
                  onChange={(e) => setInstructionDescription(e.target.value)}
                  placeholder="Talimatın kısa açıklaması..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="content">Talimat İçeriği *</Label>
                <Textarea
                  id="content"
                  value={instructionContent}
                  onChange={(e) => setInstructionContent(e.target.value)}
                  placeholder="Talimatın detaylı içeriği..."
                  rows={8}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="priority">Öncelik</Label>
                  <Select value={instructionPriority} onValueChange={(value: any) => setInstructionPriority(value)}>
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

                <div>
                  <Label htmlFor="due_days">Varsayılan Son Tarih (Gün)</Label>
                  <Input
                    id="due_days"
                    type="number"
                    value={instructionDueDays}
                    onChange={(e) => setInstructionDueDays(parseInt(e.target.value))}
                    min="1"
                    max="365"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="file">Ek Dosya</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.txt,.jpg,.png"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleCreateInstruction}
                  disabled={!instructionTitle || !instructionContent || isLoading}
                  className="min-w-[150px]"
                >
                  {isLoading ? 'Oluşturuluyor...' : 'Talimat Oluştur'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="send" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sol Panel - Talimat Seçimi ve Gönderim Ayarları */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Talimat Seçimi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="instruction_template">Talimat Şablonu</Label>
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Talimat şablonu seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Yeni oluşturulan talimat</SelectItem>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="priority">Öncelik</Label>
                      <Select value={instructionPriority} onValueChange={(value: any) => setInstructionPriority(value)}>
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

                    <div>
                      <Label htmlFor="due_days">Son Tarih (Gün)</Label>
                      <Input
                        id="due_days"
                        type="number"
                        value={instructionDueDays}
                        onChange={(e) => setInstructionDueDays(parseInt(e.target.value))}
                        min="1"
                        max="365"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="custom_message">Özel Mesaj</Label>
                    <Textarea
                      id="custom_message"
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      placeholder="Personellere gönderilecek özel mesaj..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Gönderim Ayarları */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    Gönderim Ayarları
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="send_immediately">Hemen Gönder</Label>
                      <Switch
                        id="send_immediately"
                        checked={sendImmediately}
                        onCheckedChange={setSendImmediately}
                      />
                    </div>

                    {!sendImmediately && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="scheduled_date">Planlanan Tarih</Label>
                          <Input
                            id="scheduled_date"
                            type="date"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="scheduled_time">Planlanan Saat</Label>
                          <Input
                            id="scheduled_time"
                            type="time"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    )}
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

                    {sendNotifications && (
                      <div className="space-y-2 pl-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="email" className="text-sm">E-posta</Label>
                          <Switch
                            id="email"
                            checked={sendEmail}
                            onCheckedChange={setSendEmail}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="sms" className="text-sm">SMS</Label>
                          <Switch
                            id="sms"
                            checked={sendSMS}
                            onCheckedChange={setSendSMS}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="push" className="text-sm">Push Bildirim</Label>
                          <Switch
                            id="push"
                            checked={sendPush}
                            onCheckedChange={setSendPush}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sağ Panel - Personel Seçimi ve Kriterler */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Personel Seçimi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="use_criteria">Kriter Bazlı Seçim</Label>
                      <Switch
                        id="use_criteria"
                        checked={useCriteria}
                        onCheckedChange={setUseCriteria}
                      />
                    </div>

                    {!useCriteria ? (
                      <div>
                        <Label>Personel Seçin</Label>
                        <div className="max-h-60 overflow-y-auto border rounded-md p-2 mt-1">
                          {personnel.map((person) => (
                            <div key={person.id} className="flex items-center space-x-2 py-1">
                              <input
                                type="checkbox"
                                id={person.id}
                                checked={selectedPersonnel.includes(person.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedPersonnel([...selectedPersonnel, person.id]);
                                  } else {
                                    setSelectedPersonnel(selectedPersonnel.filter(id => id !== person.id));
                                  }
                                }}
                              />
                              <label htmlFor={person.id} className="text-sm cursor-pointer">
                                {person.first_name} {person.last_name} - {person.department}
                              </label>
                            </div>
                          ))}
                        </div>
                        <div className="text-sm text-muted-foreground mt-2">
                          {selectedPersonnel.length} personel seçildi
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
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

                        <Button 
                          onClick={handlePreviewCriteria}
                          disabled={!hasValidCriteria()}
                          variant="outline"
                          className="w-full"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Önizleme Göster
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Önizleme ve Gönderim */}
              {previewData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Personel Önizlemesi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center p-4 bg-blue-50 rounded-lg mb-4">
                      <div className="text-2xl font-bold text-blue-600">
                        {previewData.total}
                      </div>
                      <div className="text-sm text-blue-700">Hedef Personel</div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Departman Dağılımı</h4>
                      {Object.entries(previewData.by_department).map(([dept, count]) => (
                        <div key={dept} className="flex justify-between items-center text-sm">
                          <span>{dept}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Gönderim Butonu */}
              <Card>
                <CardContent className="pt-6">
                  <Button 
                    onClick={handleSendInstruction}
                    disabled={isSending || (!useCriteria && selectedPersonnel.length === 0)}
                    className="w-full"
                    size="lg"
                  >
                    {isSending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Talimatı Gönder
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Mevcut Talimat Şablonları
              </CardTitle>
              <CardDescription>
                Daha önce oluşturulan talimat şablonları
              </CardDescription>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Henüz talimat şablonu oluşturulmamış
                </div>
              ) : (
                <div className="space-y-4">
                  {templates.map((template) => (
                    <div key={template.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-lg">{template.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {template.description}
                          </p>
                        </div>
                        <Badge variant="outline">{template.category}</Badge>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedTemplate(template.id);
                            setActiveTab('send');
                          }}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Bu Şablonu Kullan
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          İndir
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
