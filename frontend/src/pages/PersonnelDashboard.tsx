import React, { useState } from 'react';
import { PersonnelManagement } from '../components/PersonnelManagement';
import { InstructionAssignment } from '../components/InstructionAssignment';
import { BulkPersonnelUpload } from '../components/BulkPersonnelUpload';
import { BulkInstructionAssignment } from '../components/BulkInstructionAssignment';
import { NewInstructionSender } from '../components/NewInstructionSender';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { 
  Users, 
  Target, 
  Plus,
  Upload, 
  BarChart3,
  Calendar,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

export const PersonnelDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('management');

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Personel Yönetim Sistemi</h1>
              <p className="text-muted-foreground">
                Personel yönetimi, talimat atama ve okuma takibi
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">247</div>
                <div className="text-sm text-muted-foreground">Aktif Personel</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">89%</div>
                <div className="text-sm text-muted-foreground">Tamamlanma Oranı</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-orange-600">12</div>
                <div className="text-sm text-muted-foreground">Gecikmiş Talimat</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                  <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Personel Yönetimi
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Talimat Atama
          </TabsTrigger>
          <TabsTrigger value="new-instructions" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Yeni Talimat
          </TabsTrigger>
          <TabsTrigger value="bulk-assignments" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Toplu Atama
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Toplu Yükleme
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analitik
          </TabsTrigger>
        </TabsList>

          <TabsContent value="management" className="space-y-6">
            <PersonnelManagement />
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6">
            <InstructionAssignment />
          </TabsContent>

          <TabsContent value="new-instructions" className="space-y-6">
            <NewInstructionSender />
          </TabsContent>

          <TabsContent value="bulk-assignments" className="space-y-6">
            <BulkInstructionAssignment />
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <BulkPersonnelUpload />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Quick Stats */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Toplam Personel</p>
                    <p className="text-3xl font-bold">247</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-200" />
                </div>
                <div className="mt-4 flex items-center text-blue-100">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="text-sm">+12% geçen aya göre</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">Aktif Talimat</p>
                    <p className="text-3xl font-bold">156</p>
                  </div>
                  <Target className="w-8 h-8 text-green-200" />
                </div>
                <div className="mt-4 flex items-center text-green-100">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="text-sm">+8% geçen aya göre</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">Tamamlanan</p>
                    <p className="text-3xl font-bold">89%</p>
                  </div>
                  <Calendar className="w-8 h-8 text-purple-200" />
                </div>
                <div className="mt-4 flex items-center text-purple-100">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="text-sm">+3% geçen aya göre</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100">Gecikmiş</p>
                    <p className="text-3xl font-bold">12</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-orange-200" />
                </div>
                <div className="mt-4 flex items-center text-orange-100">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="text-sm">-5% geçen aya göre</span>
                </div>
              </div>
            </div>

            {/* Department Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4">Departman Performansı</h3>
                <div className="space-y-4">
                  {[
                    { name: 'Üretim', completion: 95, personnel: 45 },
                    { name: 'Kalite', completion: 88, personnel: 23 },
                    { name: 'Satış', completion: 82, personnel: 34 },
                    { name: 'Muhasebe', completion: 91, personnel: 18 },
                    { name: 'İnsan Kaynakları', completion: 87, personnel: 12 }
                  ].map((dept) => (
                    <div key={dept.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="font-medium">{dept.name}</span>
                        <span className="text-sm text-muted-foreground">({dept.personnel})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${dept.completion}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{dept.completion}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4">Aylık Trend</h3>
                <div className="space-y-4">
                  {[
                    { month: 'Ocak', personnel: 235, assignments: 142, completed: 89 },
                    { month: 'Şubat', personnel: 238, assignments: 148, completed: 91 },
                    { month: 'Mart', personnel: 242, assignments: 151, completed: 93 },
                    { month: 'Nisan', personnel: 245, assignments: 154, completed: 94 },
                    { month: 'Mayıs', personnel: 247, assignments: 156, completed: 95 }
                  ].map((data) => (
                    <div key={data.month} className="flex items-center justify-between">
                      <span className="font-medium">{data.month}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          {data.personnel} personel
                        </span>
                        <span className="text-muted-foreground">
                          {data.assignments} talimat
                        </span>
                        <span className="text-green-600 font-medium">
                          {data.completed}% tamamlandı
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">Son Aktiviteler</h3>
              <div className="space-y-3">
                {[
                  { action: 'Yeni personel eklendi', detail: 'Ahmet Yılmaz - Üretim Departmanı', time: '2 saat önce' },
                  { action: 'Talimat atandı', detail: 'Güvenlik Talimatları → 15 personel', time: '4 saat önce' },
                  { action: 'Toplu yükleme tamamlandı', detail: '23 personel başarıyla yüklendi', time: '6 saat önce' },
                  { action: 'Talimat tamamlandı', detail: 'Kalite Kontrol → Mehmet Kaya', time: '8 saat önce' },
                  { action: 'Departman güncellendi', detail: 'Satış departmanı yeniden yapılandırıldı', time: '1 gün önce' }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.detail}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
