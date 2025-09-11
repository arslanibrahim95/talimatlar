import React, { useState, useRef } from 'react';
import { PersonnelCreate, BulkPersonnelResult } from '../types';
import { personnelService } from '../services/personnelService';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';
import { Label } from './ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Users,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

export const BulkPersonnelUpload: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [department, setDepartment] = useState<string>('');
  const [managerId, setManagerId] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<BulkPersonnelResult | null>(null);
  const [previewData, setPreviewData] = useState<PersonnelCreate[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const departments = ['İnsan Kaynakları', 'Muhasebe', 'Satış', 'Pazarlama', 'Üretim', 'Kalite', 'Bakım', 'Güvenlik'];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'text/csv' || 
          file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.type === 'application/vnd.ms-excel') {
        setSelectedFile(file);
        previewFile(file);
      } else {
        toast.error('Lütfen geçerli bir CSV veya Excel dosyası seçin');
      }
    }
  };

  const previewFile = async (file: File) => {
    try {
      if (file.type === 'text/csv') {
        const text = await file.text();
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        const data: PersonnelCreate[] = [];
        for (let i = 1; i < Math.min(lines.length, 6); i++) { // Preview first 5 rows
          if (lines[i].trim()) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            const row: any = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });
            
            if (row.employee_id && row.first_name && row.last_name && row.email) {
              data.push({
                employee_id: row.employee_id,
                first_name: row.first_name,
                last_name: row.last_name,
                email: row.email,
                phone: row.phone || '',
                department: row.department || department,
                position: row.position || '',
                hire_date: row.hire_date || new Date().toISOString().split('T')[0],
                manager_id: row.manager_id || managerId
              });
            }
          }
        }
        setPreviewData(data);
      } else {
        // Excel files will be processed on the server
        setPreviewData([]);
      }
    } catch (error) {
      console.error('Error previewing file:', error);
      toast.error('Dosya önizlemesi yapılamadı');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Lütfen bir dosya seçin');
      return;
    }

    setIsUploading(true);
    try {
      const result = await personnelService.bulkUploadPersonnel(selectedFile, department, managerId);
      setUploadResult(result);
      
      if (result.success > 0) {
        toast.success(`${result.success} personel başarıyla yüklendi`);
      }
      
      if (result.failed > 0) {
        toast.error(`${result.failed} personel yüklenemedi`);
      }
      
      // Reset form
      setSelectedFile(null);
      setPreviewData([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast.error('Dosya yüklenirken hata oluştu');
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `employee_id,first_name,last_name,email,phone,department,position,hire_date,manager_id
P001,Ahmet,Yılmaz,ahmet@firma.com,+90 555 123 45 67,Üretim,Mühendis,2024-01-15,
P002,Fatma,Demir,fatma@firma.com,+90 555 234 56 78,Satış,Temsilci,2024-02-01,
P003,Mehmet,Kaya,mehmet@firma.com,+90 555 345 67 89,Kalite,Uzman,2024-01-20,`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'personel_sablonu.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewData([]);
    setUploadResult(null);
    setDepartment('');
    setManagerId('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Toplu Personel Yükleme</h1>
          <p className="text-muted-foreground">
            CSV veya Excel dosyası ile toplu personel ekleyin
          </p>
        </div>
        <Button onClick={downloadTemplate} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Şablon İndir
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Dosya Yükleme
            </CardTitle>
            <CardDescription>
              Personel bilgilerini içeren dosyayı seçin ve yükleyin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="file">Dosya Seç</Label>
              <Input
                id="file"
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Desteklenen formatlar: CSV, Excel (.xlsx, .xls)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="department">Varsayılan Departman</Label>
                <Select value={department} onValueChange={setDepartment}>
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
                <Label htmlFor="manager_id">Varsayılan Yönetici ID</Label>
                <Input
                  id="manager_id"
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  placeholder="M001"
                />
              </div>
            </div>

            {selectedFile && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-800">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="font-medium">{selectedFile.name}</span>
                </div>
                <p className="text-sm text-blue-600 mt-1">
                  Boyut: {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={handleUpload} 
                disabled={!selectedFile || isUploading}
                className="flex-1"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Yükleniyor...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Yükle
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Temizle
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Kullanım Talimatları
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium">Gerekli Alanlar</p>
                  <p className="text-sm text-muted-foreground">
                    employee_id, first_name, last_name, email alanları zorunludur
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium">İsteğe Bağlı Alanlar</p>
                  <p className="text-sm text-muted-foreground">
                    phone, department, position, hire_date, manager_id
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium">Tarih Formatı</p>
                  <p className="text-sm text-muted-foreground">
                    YYYY-MM-DD formatında (örn: 2024-01-15)
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium">E-posta Doğrulama</p>
                  <p className="text-sm text-muted-foreground">
                    Geçerli e-posta formatında olmalıdır
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Önemli Notlar</span>
              </div>
              <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                <li>• Dosya UTF-8 kodlamasında olmalıdır</li>
                <li>• İlk satır başlık satırı olarak kullanılır</li>
                <li>• Boş satırlar otomatik olarak atlanır</li>
                <li>• Hatalı satırlar raporlanır ve yüklenmez</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Section */}
      {previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Dosya Önizlemesi
            </CardTitle>
            <CardDescription>
              İlk 5 satır önizlemesi (toplam {previewData.length} satır)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">Personel No</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">Ad</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">Soyad</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">E-posta</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">Telefon</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">Departman</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">Pozisyon</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((person, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-3 py-2 text-sm">{person.employee_id}</td>
                      <td className="border border-gray-200 px-3 py-2 text-sm">{person.first_name}</td>
                      <td className="border border-gray-200 px-3 py-2 text-sm">{person.last_name}</td>
                      <td className="border border-gray-200 px-3 py-2 text-sm">{person.email}</td>
                      <td className="border border-gray-200 px-3 py-2 text-sm">{person.phone || '-'}</td>
                      <td className="border border-gray-200 px-3 py-2 text-sm">{person.department || '-'}</td>
                      <td className="border border-gray-200 px-3 py-2 text-sm">{person.position || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Results */}
      {uploadResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Yükleme Sonuçları
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">{uploadResult.success}</div>
                <div className="text-sm text-green-700">Başarılı</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-600">{uploadResult.failed}</div>
                <div className="text-sm text-red-700">Başarısız</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">{uploadResult.success + uploadResult.failed}</div>
                <div className="text-sm text-blue-700">Toplam</div>
              </div>
            </div>

            {uploadResult.errors.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-red-700">Hata Detayları:</h4>
                <div className="space-y-2">
                  {uploadResult.errors.map((error, index) => (
                    <div key={index} className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center gap-2 text-red-700">
                        <XCircle className="w-4 h-4" />
                        <span className="font-medium">Satır {error.row}</span>
                      </div>
                      <p className="text-sm text-red-600 mt-1">
                        <span className="font-medium">{error.field}:</span> {error.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
