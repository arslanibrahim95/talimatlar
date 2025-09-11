import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import InstructionDistribution from '../../components/InstructionDistribution';
import { instructionService } from '../../services/instructionService';

interface Instruction {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'pending' | 'approved' | 'published' | 'archived';
  author: string;
  approver?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  attachments: string[];
  targetAudience: string[];
  distributionChannels: string[];
  readCount: number;
  lastReadAt?: string;
}

const InstructionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [instruction, setInstruction] = useState<Instruction | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDistribution, setShowDistribution] = useState(false);
  const [viewMode, setViewMode] = useState<'read' | 'print' | 'export'>('read');

  useEffect(() => {
    if (id) {
      fetchInstruction(id);
    }
  }, [id]);

  const fetchInstruction = async (instructionId: string) => {
    try {
      setLoading(true);
      const instruction = await instructionService.getInstruction(instructionId);
      setInstruction(instruction);
    } catch (error) {
      console.error('Talimat yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'approved': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'archived': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: 'Taslak',
      pending: 'Beklemede',
      approved: 'Onaylandı',
      published: 'Yayınlandı',
      archived: 'Arşivlendi'
    };
    return labels[status] || status;
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      low: 'Düşük',
      medium: 'Orta',
      high: 'Yüksek',
      critical: 'Kritik'
    };
    return labels[priority] || priority;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = (format: 'pdf' | 'html' | 'txt') => {
    // TODO: Implement export functionality
    console.log(`Exporting as ${format}`);
  };

  const handleShare = () => {
    if (navigator.share && instruction) {
      navigator.share({
        title: instruction.title,
        text: instruction.description,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link kopyalandı!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!instruction) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Talimat bulunamadı</p>
        <Link to="/instructions">
          <Button className="mt-4">Talimatlara Dön</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/instructions" className="text-blue-600 dark:text-blue-400 hover:underline">
            ← Talimatlara Dön
          </Link>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleShare}>
            Paylaş
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            Yazdır
          </Button>
          {instruction.status === 'approved' && (
            <Button onClick={() => setShowDistribution(true)}>
              Dağıt
            </Button>
          )}
        </div>
      </div>

      {/* Instruction Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {instruction.title}
                </h1>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(instruction.priority)}`}>
                  {getPriorityLabel(instruction.priority)}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(instruction.status)}`}>
                  {getStatusLabel(instruction.status)}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {instruction.description}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Kategori:</span>
              <p className="text-gray-600 dark:text-gray-400 capitalize">{instruction.category}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Yazar:</span>
              <p className="text-gray-600 dark:text-gray-400">{instruction.author}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Versiyon:</span>
              <p className="text-gray-600 dark:text-gray-400">v{instruction.version}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Okunma:</span>
              <p className="text-gray-600 dark:text-gray-400">{instruction.readCount} kez</p>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Oluşturulma:</span>
              <p className="text-gray-600 dark:text-gray-400">
                {new Date(instruction.createdAt).toLocaleDateString('tr-TR')}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Güncellenme:</span>
              <p className="text-gray-600 dark:text-gray-400">
                {new Date(instruction.updatedAt).toLocaleDateString('tr-TR')}
              </p>
            </div>
            {instruction.publishedAt && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Yayınlanma:</span>
                <p className="text-gray-600 dark:text-gray-400">
                  {new Date(instruction.publishedAt).toLocaleDateString('tr-TR')}
                </p>
              </div>
            )}
            {instruction.approver && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Onaylayan:</span>
                <p className="text-gray-600 dark:text-gray-400">{instruction.approver}</p>
              </div>
            )}
          </div>

          {instruction.tags.length > 0 && (
            <div className="mt-4">
              <span className="font-medium text-gray-700 dark:text-gray-300">Etiketler:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {instruction.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {instruction.targetAudience.length > 0 && (
            <div className="mt-4">
              <span className="font-medium text-gray-700 dark:text-gray-300">Hedef Kitle:</span>
              <p className="text-gray-600 dark:text-gray-400">{instruction.targetAudience.join(', ')}</p>
            </div>
          )}

          {instruction.distributionChannels.length > 0 && (
            <div className="mt-4">
              <span className="font-medium text-gray-700 dark:text-gray-300">Dağıtım Kanalları:</span>
              <p className="text-gray-600 dark:text-gray-400">{instruction.distributionChannels.join(', ')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instruction Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Talimat İçeriği</CardTitle>
            <div className="flex space-x-2">
              <Button
                variant={viewMode === 'read' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('read')}
              >
                Okuma
              </Button>
              <Button
                variant={viewMode === 'print' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('print')}
              >
                Yazdırma
              </Button>
              <Button
                variant={viewMode === 'export' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('export')}
              >
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <div 
              className="whitespace-pre-wrap text-gray-900 dark:text-white leading-relaxed"
              dangerouslySetInnerHTML={{ 
                __html: instruction.content.replace(/\n/g, '<br>') 
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Attachments */}
      {instruction.attachments.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Ekler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {instruction.attachments.map((attachment, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">{attachment}</span>
                  <Button size="sm" variant="outline">
                    İndir
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center mt-6">
        <div className="flex space-x-2">
          <Link to={`/instructions/${instruction.id}/edit`}>
            <Button variant="outline">
              Düzenle
            </Button>
          </Link>
          <Button variant="outline">
            Versiyon Geçmişi
          </Button>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Son okunma: {instruction.lastReadAt ? new Date(instruction.lastReadAt).toLocaleString('tr-TR') : 'Henüz okunmadı'}
        </div>
      </div>

      {/* Distribution Modal */}
      {showDistribution && instruction && (
        <InstructionDistribution
          instructionId={instruction.id}
          instructionTitle={instruction.title}
          onClose={() => setShowDistribution(false)}
        />
      )}
    </div>
  );
};

export default InstructionDetail;
