import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { 
  Building2, 
  Users, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Shield,
  Database,
  Globe,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  domain: string;
  plan: 'basic' | 'professional' | 'enterprise';
  status: 'active' | 'inactive' | 'suspended';
  userCount: number;
  maxUsers: number;
  createdAt: string;
  updatedAt: string;
  settings: {
    branding: {
      logo?: string;
      primaryColor: string;
      secondaryColor: string;
    };
    features: {
      aiAssistant: boolean;
      qrCodes: boolean;
      analytics: boolean;
      apiAccess: boolean;
      customDomain: boolean;
    };
    limits: {
      maxInstructions: number;
      maxDocuments: number;
      maxStorage: number; // in MB
    };
  };
}

interface TenantManagementProps {
  onTenantSelect?: (tenant: Tenant) => void;
}

const TenantManagement: React.FC<TenantManagementProps> = ({ onTenantSelect }) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    plan: 'basic' as Tenant['plan'],
    maxUsers: 10,
    settings: {
      branding: {
        primaryColor: '#3B82F6',
        secondaryColor: '#1E40AF'
      },
      features: {
        aiAssistant: true,
        qrCodes: true,
        analytics: true,
        apiAccess: false,
        customDomain: false
      },
      limits: {
        maxInstructions: 100,
        maxDocuments: 50,
        maxStorage: 1000
      }
    }
  });

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockTenants: Tenant[] = [
        {
          id: '1',
          name: 'Acme Corporation',
          domain: 'acme.claude-talimat.com',
          plan: 'enterprise',
          status: 'active',
          userCount: 45,
          maxUsers: 100,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-20T14:30:00Z',
          settings: {
            branding: {
              primaryColor: '#3B82F6',
              secondaryColor: '#1E40AF'
            },
            features: {
              aiAssistant: true,
              qrCodes: true,
              analytics: true,
              apiAccess: true,
              customDomain: true
            },
            limits: {
              maxInstructions: 1000,
              maxDocuments: 500,
              maxStorage: 10000
            }
          }
        },
        {
          id: '2',
          name: 'TechStart Inc',
          domain: 'techstart.claude-talimat.com',
          plan: 'professional',
          status: 'active',
          userCount: 12,
          maxUsers: 25,
          createdAt: '2024-02-01T09:00:00Z',
          updatedAt: '2024-02-05T16:20:00Z',
          settings: {
            branding: {
              primaryColor: '#10B981',
              secondaryColor: '#059669'
            },
            features: {
              aiAssistant: true,
              qrCodes: true,
              analytics: true,
              apiAccess: false,
              customDomain: false
            },
            limits: {
              maxInstructions: 500,
              maxDocuments: 250,
              maxStorage: 5000
            }
          }
        },
        {
          id: '3',
          name: 'Small Business Ltd',
          domain: 'smallbiz.claude-talimat.com',
          plan: 'basic',
          status: 'active',
          userCount: 5,
          maxUsers: 10,
          createdAt: '2024-02-10T11:30:00Z',
          updatedAt: '2024-02-12T13:45:00Z',
          settings: {
            branding: {
              primaryColor: '#8B5CF6',
              secondaryColor: '#7C3AED'
            },
            features: {
              aiAssistant: false,
              qrCodes: true,
              analytics: false,
              apiAccess: false,
              customDomain: false
            },
            limits: {
              maxInstructions: 100,
              maxDocuments: 50,
              maxStorage: 1000
            }
          }
        }
      ];
      
      setTenants(mockTenants);
    } catch (error) {
      console.error('Error loading tenants:', error);
      setError('Kiracılar yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTenant = async () => {
    if (!formData.name.trim() || !formData.domain.trim()) {
      setError('Ad ve domain alanları gereklidir');
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newTenant: Tenant = {
        id: Date.now().toString(),
        name: formData.name,
        domain: formData.domain,
        plan: formData.plan,
        status: 'active',
        userCount: 0,
        maxUsers: formData.maxUsers,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        settings: formData.settings
      };
      
      setTenants(prev => [...prev, newTenant]);
      setShowCreateForm(false);
      setSuccess('Kiracı başarıyla oluşturuldu');
      
      // Reset form
      setFormData({
        name: '',
        domain: '',
        plan: 'basic',
        maxUsers: 10,
        settings: {
          branding: {
            primaryColor: '#3B82F6',
            secondaryColor: '#1E40AF'
          },
          features: {
            aiAssistant: true,
            qrCodes: true,
            analytics: true,
            apiAccess: false,
            customDomain: false
          },
          limits: {
            maxInstructions: 100,
            maxDocuments: 50,
            maxStorage: 1000
          }
        }
      });
    } catch (error) {
      console.error('Error creating tenant:', error);
      setError('Kiracı oluşturulurken bir hata oluştu');
    }
  };

  const handleEditTenant = async (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setFormData({
      name: tenant.name,
      domain: tenant.domain,
      plan: tenant.plan,
      maxUsers: tenant.maxUsers,
      settings: tenant.settings
    });
    setShowEditForm(true);
  };

  const handleUpdateTenant = async () => {
    if (!selectedTenant) return;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const updatedTenant = {
        ...selectedTenant,
        name: formData.name,
        domain: formData.domain,
        plan: formData.plan,
        maxUsers: formData.maxUsers,
        settings: formData.settings,
        updatedAt: new Date().toISOString()
      };
      
      setTenants(prev => prev.map(t => t.id === selectedTenant.id ? updatedTenant : t));
      setShowEditForm(false);
      setSelectedTenant(null);
      setSuccess('Kiracı başarıyla güncellendi');
    } catch (error) {
      console.error('Error updating tenant:', error);
      setError('Kiracı güncellenirken bir hata oluştu');
    }
  };

  const handleDeleteTenant = async (tenantId: string) => {
    if (!confirm('Bu kiracıyı silmek istediğinizden emin misiniz?')) return;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTenants(prev => prev.filter(t => t.id !== tenantId));
      setSuccess('Kiracı başarıyla silindi');
    } catch (error) {
      console.error('Error deleting tenant:', error);
      setError('Kiracı silinirken bir hata oluştu');
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'basic':
        return 'bg-gray-100 text-gray-800';
      case 'professional':
        return 'bg-blue-100 text-blue-800';
      case 'enterprise':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Kiracı Yönetimi
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Multi-tenant sistem yönetimi ve konfigürasyonu
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Yeni Kiracı
        </Button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center space-x-2 text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm">{success}</span>
        </div>
      )}

      {/* Tenants List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tenants.map((tenant) => (
          <Card key={tenant.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <span>{tenant.name}</span>
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {tenant.domain}
                  </p>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditTenant(tenant)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTenant(tenant.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Plan:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${getPlanColor(tenant.plan)}`}>
                    {tenant.plan}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Durum:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(tenant.status)}`}>
                    {tenant.status}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Kullanıcılar:</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {tenant.userCount} / {tenant.maxUsers}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {tenant.settings.limits.maxInstructions} talimat
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {tenant.settings.limits.maxStorage} MB depolama
                    </span>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => onTenantSelect?.(tenant)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Detayları Görüntüle
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Tenant Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Yeni Kiracı Oluştur</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Kiracı Adı *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Şirket adı"
                  />
                </div>
                <div>
                  <Label htmlFor="domain">Domain *</Label>
                  <Input
                    id="domain"
                    value={formData.domain}
                    onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                    placeholder="company.claude-talimat.com"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="plan">Plan</Label>
                  <Select
                    value={formData.plan}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, plan: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="maxUsers">Maksimum Kullanıcı</Label>
                  <Input
                    id="maxUsers"
                    type="number"
                    value={formData.maxUsers}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxUsers: parseInt(e.target.value) || 10 }))}
                    min="1"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium">Özellikler</h4>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(formData.settings.features).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={key}
                        checked={value}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            features: {
                              ...prev.settings.features,
                              [key]: e.target.checked
                            }
                          }
                        }))}
                        className="rounded"
                      />
                      <Label htmlFor={key} className="text-sm">
                        {key === 'aiAssistant' && 'AI Asistan'}
                        {key === 'qrCodes' && 'QR Kodlar'}
                        {key === 'analytics' && 'Analitik'}
                        {key === 'apiAccess' && 'API Erişimi'}
                        {key === 'customDomain' && 'Özel Domain'}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  İptal
                </Button>
                <Button onClick={handleCreateTenant}>
                  Oluştur
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Tenant Modal */}
      {showEditForm && selectedTenant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Kiracı Düzenle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editName">Kiracı Adı *</Label>
                  <Input
                    id="editName"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Şirket adı"
                  />
                </div>
                <div>
                  <Label htmlFor="editDomain">Domain *</Label>
                  <Input
                    id="editDomain"
                    value={formData.domain}
                    onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                    placeholder="company.claude-talimat.com"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowEditForm(false)}>
                  İptal
                </Button>
                <Button onClick={handleUpdateTenant}>
                  Güncelle
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TenantManagement;
