import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { corsHeaders } from "./cors.ts";

const app = new Application();
const router = new Router();

// Talimat modeli
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

// Talimat kategorileri
const categories = [
  'genel',
  'güvenlik',
  'operasyon',
  'teknik',
  'yönetim',
  'acil',
  'eğitim',
  'prosedür'
];

// Talimat dağıtım kanalları
const distributionChannels = [
  'email',
  'sms',
  'push_notification',
  'dashboard',
  'mobile_app',
  'web_portal',
  'intranet'
];

// Geçici veri deposu (gerçek uygulamada database kullanılacak)
let instructions: Instruction[] = [];
let instructionIdCounter = 1;

// CORS middleware
app.use(async (ctx, next) => {
  ctx.response.headers.set("Access-Control-Allow-Origin", "*");
  ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  ctx.response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  
  if (ctx.request.method === "OPTIONS") {
    ctx.response.status = 200;
    return;
  }
  
  await next();
});

// Talimat oluşturma
router.post("/instructions", async (ctx) => {
  try {
    const body = await ctx.request.body().value;
    
    const newInstruction: Instruction = {
      id: `inst_${instructionIdCounter++}`,
      title: body.title,
      description: body.description,
      content: body.content,
      category: body.category || 'genel',
      tags: body.tags || [],
      priority: body.priority || 'medium',
      status: 'draft',
      author: body.author || 'system',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attachments: body.attachments || [],
      targetAudience: body.targetAudience || [],
      distributionChannels: body.distributionChannels || ['dashboard'],
      readCount: 0
    };

    instructions.push(newInstruction);
    
    ctx.response.status = 201;
    ctx.response.body = {
      success: true,
      data: newInstruction
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      error: error.message
    };
  }
});

// Dosya yükleme
router.post("/instructions/upload", async (ctx) => {
  try {
    const formData = await ctx.request.body({ type: 'form-data' }).value;
    const file = formData.get('file') as File;
    
    if (!file) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "Dosya bulunamadı"
      };
      return;
    }

    // Dosya bilgilerini kaydet (gerçek uygulamada dosya sistemi veya cloud storage kullanılacak)
    const fileInfo = {
      id: `file_${Date.now()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      url: `/uploads/${file.name}` // Simulated URL
    };

    ctx.response.body = {
      success: true,
      data: fileInfo
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      error: error.message
    };
  }
});

// Talimat listesi
router.get("/instructions", async (ctx) => {
  const { category, status, priority, author, search } = ctx.request.url.searchParams;
  
  let filteredInstructions = [...instructions];
  
  if (category) {
    filteredInstructions = filteredInstructions.filter(inst => inst.category === category);
  }
  
  if (status) {
    filteredInstructions = filteredInstructions.filter(inst => inst.status === status);
  }
  
  if (priority) {
    filteredInstructions = filteredInstructions.filter(inst => inst.priority === priority);
  }
  
  if (author) {
    filteredInstructions = filteredInstructions.filter(inst => inst.author === author);
  }
  
  if (search) {
    const searchLower = search.toLowerCase();
    filteredInstructions = filteredInstructions.filter(inst => 
      inst.title.toLowerCase().includes(searchLower) ||
      inst.description.toLowerCase().includes(searchLower) ||
      inst.content.toLowerCase().includes(searchLower) ||
      inst.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }
  
  // Sıralama: öncelik, sonra tarih
  filteredInstructions.sort((a, b) => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  ctx.response.body = {
    success: true,
    data: filteredInstructions,
    meta: {
      total: filteredInstructions.length,
      categories,
      distributionChannels
    }
  };
});

// Talimat detayı
router.get("/instructions/:id", async (ctx) => {
  const id = ctx.params.id;
  const instruction = instructions.find(inst => inst.id === id);
  
  if (!instruction) {
    ctx.response.status = 404;
    ctx.response.body = {
      success: false,
      error: "Talimat bulunamadı"
    };
    return;
  }
  
  // Okuma sayısını artır
  instruction.readCount++;
  instruction.lastReadAt = new Date().toISOString();
  
  ctx.response.body = {
    success: true,
    data: instruction
  };
});

// Talimat güncelleme
router.put("/instructions/:id", async (ctx) => {
  const id = ctx.params.id;
  const instructionIndex = instructions.findIndex(inst => inst.id === id);
  
  if (instructionIndex === -1) {
    ctx.response.status = 404;
    ctx.response.body = {
      success: false,
      error: "Talimat bulunamadı"
    };
    return;
  }
  
  try {
    const body = await ctx.request.body().value;
    const existingInstruction = instructions[instructionIndex];
    
    const updatedInstruction: Instruction = {
      ...existingInstruction,
      ...body,
      id: existingInstruction.id, // ID değiştirilemez
      version: existingInstruction.version + 1,
      updatedAt: new Date().toISOString()
    };
    
    instructions[instructionIndex] = updatedInstruction;
    
    ctx.response.body = {
      success: true,
      data: updatedInstruction
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      error: error.message
    };
  }
});

// Talimat onaylama
router.post("/instructions/:id/approve", async (ctx) => {
  const id = ctx.params.id;
  const instructionIndex = instructions.findIndex(inst => inst.id === id);
  
  if (instructionIndex === -1) {
    ctx.response.status = 404;
    ctx.response.body = {
      success: false,
      error: "Talimat bulunamadı"
    };
    return;
  }
  
  try {
    const body = await ctx.request.body().value;
    const instruction = instructions[instructionIndex];
    
    instruction.status = 'approved';
    instruction.approver = body.approver || 'system';
    instruction.updatedAt = new Date().toISOString();
    
    ctx.response.body = {
      success: true,
      data: instruction
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      error: error.message
    };
  }
});

// Talimat yayınlama
router.post("/instructions/:id/publish", async (ctx) => {
  const id = ctx.params.id;
  const instructionIndex = instructions.findIndex(inst => inst.id === id);
  
  if (instructionIndex === -1) {
    ctx.response.status = 404;
    ctx.response.body = {
      success: false,
      error: "Talimat bulunamadı"
    };
    return;
  }
  
  const instruction = instructions[instructionIndex];
  
  if (instruction.status !== 'approved') {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      error: "Sadece onaylanmış talimatlar yayınlanabilir"
    };
    return;
  }
  
  instruction.status = 'published';
  instruction.publishedAt = new Date().toISOString();
  instruction.updatedAt = new Date().toISOString();
  
  // TODO: Dağıtım kanallarına göre bildirim gönder
  
  ctx.response.body = {
    success: true,
    data: instruction
  };
});

// Talimat dağıtımı
router.post("/instructions/:id/distribute", async (ctx) => {
  const id = ctx.params.id;
  const instruction = instructions.find(inst => inst.id === id);
  
  if (!instruction) {
    ctx.response.status = 404;
    ctx.response.body = {
      success: false,
      error: "Talimat bulunamadı"
    };
    return;
  }
  
  try {
    const body = await ctx.request.body().value;
    const { channels, targetUsers } = body;
    
    // Dağıtım logları
    const distributionLog = {
      instructionId: id,
      channels: channels || instruction.distributionChannels,
      targetUsers: targetUsers || instruction.targetAudience,
      distributedAt: new Date().toISOString(),
      distributedBy: body.distributedBy || 'system'
    };
    
    // TODO: Gerçek dağıtım işlemleri
    // - Email gönderimi
    // - SMS gönderimi
    // - Push notification
    // - Dashboard bildirimi
    
    ctx.response.body = {
      success: true,
      data: {
        message: "Talimat başarıyla dağıtıldı",
        distributionLog
      }
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      error: error.message
    };
  }
});

// Talimat istatistikleri
router.get("/instructions/stats", async (ctx) => {
  const stats = {
    total: instructions.length,
    byStatus: {
      draft: instructions.filter(inst => inst.status === 'draft').length,
      pending: instructions.filter(inst => inst.status === 'pending').length,
      approved: instructions.filter(inst => inst.status === 'approved').length,
      published: instructions.filter(inst => inst.status === 'published').length,
      archived: instructions.filter(inst => inst.status === 'archived').length
    },
    byPriority: {
      critical: instructions.filter(inst => inst.priority === 'critical').length,
      high: instructions.filter(inst => inst.priority === 'high').length,
      medium: instructions.filter(inst => inst.priority === 'medium').length,
      low: instructions.filter(inst => inst.priority === 'low').length
    },
    byCategory: categories.reduce((acc, category) => {
      acc[category] = instructions.filter(inst => inst.category === category).length;
      return acc;
    }, {} as Record<string, number>),
    totalReads: instructions.reduce((sum, inst) => sum + inst.readCount, 0),
    recentActivity: instructions
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10)
      .map(inst => ({
        id: inst.id,
        title: inst.title,
        status: inst.status,
        updatedAt: inst.updatedAt
      }))
  };
  
  ctx.response.body = {
    success: true,
    data: stats
  };
});

// Talimat silme
router.delete("/instructions/:id", async (ctx) => {
  const id = ctx.params.id;
  const instructionIndex = instructions.findIndex(inst => inst.id === id);
  
  if (instructionIndex === -1) {
    ctx.response.status = 404;
    ctx.response.body = {
      success: false,
      error: "Talimat bulunamadı"
    };
    return;
  }
  
  instructions.splice(instructionIndex, 1);
  
  ctx.response.body = {
    success: true,
    message: "Talimat başarıyla silindi"
  };
});

// Health check endpoint
router.get("/health", (ctx) => {
  ctx.response.body = {
    status: "healthy",
    service: "instruction-service",
    timestamp: new Date().toISOString(),
    uptime: process.uptime ? process.uptime() : 0
  };
});

// QR kod oluşturma
router.post("/qr-codes", async (ctx) => {
  try {
    const body = await ctx.request.body().value;
    const { instructionId, expiresAt, customUrl } = body;
    
    // Talimatın var olduğunu kontrol et
    const instruction = instructions.find(inst => inst.id === instructionId);
    if (!instruction) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        error: "Talimat bulunamadı"
      };
      return;
    }
    
    // QR kod verisi oluştur
    const qrCodeData = customUrl || `https://example.com/instruction/${instructionId}`;
    const qrCodeId = `qr_${Date.now()}`;
    
    // QR kod resmi oluştur (gerçek uygulamada qrcode kütüphanesi kullanılacak)
    const qrCodeImage = `data:image/svg+xml;base64,${btoa(`
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="white"/>
        <text x="100" y="100" text-anchor="middle" dy=".3em" font-family="Arial" font-size="12">QR Code</text>
        <text x="100" y="120" text-anchor="middle" dy=".3em" font-family="Arial" font-size="10">${instructionId}</text>
      </svg>
    `)}`;
    
    const newQRCode = {
      id: qrCodeId,
      instructionId,
      qrCodeData,
      qrCodeImage,
      accessUrl: qrCodeData,
      expiresAt: expiresAt || null,
      isActive: true,
      createdAt: new Date().toISOString(),
      scanCount: 0,
      lastScannedAt: null
    };
    
    // QR kodu kaydet (gerçek uygulamada database kullanılacak)
    if (!ctx.state.qrCodes) {
      ctx.state.qrCodes = [];
    }
    ctx.state.qrCodes.push(newQRCode);
    
    ctx.response.status = 201;
    ctx.response.body = {
      success: true,
      data: newQRCode
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      error: error.message
    };
  }
});

// QR kod getirme
router.get("/qr-codes/:instructionId", async (ctx) => {
  const instructionId = ctx.params.instructionId;
  
  // QR kodu bul
  const qrCode = ctx.state.qrCodes?.find(qr => qr.instructionId === instructionId);
  
  if (!qrCode) {
    ctx.response.status = 404;
    ctx.response.body = {
      success: false,
      error: "QR kod bulunamadı"
    };
    return;
  }
  
  ctx.response.body = {
    success: true,
    data: qrCode
  };
});

// QR kod tarama logu
router.post("/qr-codes/:qrCodeId/scan", async (ctx) => {
  const qrCodeId = ctx.params.qrCodeId;
  const body = await ctx.request.body().value;
  
  try {
    // QR kodu bul
    const qrCode = ctx.state.qrCodes?.find(qr => qr.id === qrCodeId);
    if (!qrCode) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        error: "QR kod bulunamadı"
      };
      return;
    }
    
    // Tarama sayısını artır
    qrCode.scanCount++;
    qrCode.lastScannedAt = new Date().toISOString();
    
    // Erişim logu oluştur
    const accessLog = {
      id: `log_${Date.now()}`,
      instructionId: qrCode.instructionId,
      personnelId: body.personnelId || null,
      deviceInfo: body.deviceInfo || null,
      accessMethod: 'qr_code',
      accessTime: new Date().toISOString(),
      ipAddress: ctx.request.ip,
      userAgent: ctx.request.headers.get('user-agent') || null,
      location: body.location || null
    };
    
    // Logu kaydet (gerçek uygulamada database kullanılacak)
    if (!ctx.state.accessLogs) {
      ctx.state.accessLogs = [];
    }
    ctx.state.accessLogs.push(accessLog);
    
    ctx.response.body = {
      success: true,
      message: "QR kod tarama logu kaydedildi"
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      error: error.message
    };
  }
});

// QR kod erişim logları
router.get("/qr-codes/:instructionId/access-logs", async (ctx) => {
  const instructionId = ctx.params.instructionId;
  const { page = 1, limit = 50 } = ctx.request.url.searchParams;
  
  try {
    // Erişim loglarını filtrele
    const logs = ctx.state.accessLogs?.filter(log => log.instructionId === instructionId) || [];
    
    // Sayfalama
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedLogs = logs.slice(startIndex, endIndex);
    
    ctx.response.body = {
      success: true,
      data: paginatedLogs,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: logs.length,
        totalPages: Math.ceil(logs.length / parseInt(limit))
      }
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      error: error.message
    };
  }
});

// QR kod istatistikleri
router.get("/qr-codes/:instructionId/stats", async (ctx) => {
  const instructionId = ctx.params.instructionId;
  
  try {
    const qrCode = ctx.state.qrCodes?.find(qr => qr.instructionId === instructionId);
    const logs = ctx.state.accessLogs?.filter(log => log.instructionId === instructionId) || [];
    
    // Benzersiz tarayıcı sayısı
    const uniqueScanners = new Set(logs.map(log => log.personnelId || log.ipAddress)).size;
    
    // Son 7 günlük trend
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();
    
    const scanTrends = last7Days.map(date => {
      const dayLogs = logs.filter(log => log.accessTime.startsWith(date));
      return {
        date,
        scanCount: dayLogs.length
      };
    });
    
    const stats = {
      totalScans: qrCode?.scanCount || 0,
      uniqueScanners: uniqueScanners,
      lastScannedAt: qrCode?.lastScannedAt || null,
      scanTrends
    };
    
    ctx.response.body = {
      success: true,
      data: stats
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      error: error.message
    };
  }
});

// QR kodu devre dışı bırak
router.put("/qr-codes/:qrCodeId/deactivate", async (ctx) => {
  const qrCodeId = ctx.params.qrCodeId;
  
  try {
    const qrCode = ctx.state.qrCodes?.find(qr => qr.id === qrCodeId);
    if (!qrCode) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        error: "QR kod bulunamadı"
      };
      return;
    }
    
    qrCode.isActive = false;
    
    ctx.response.body = {
      success: true,
      message: "QR kod devre dışı bırakıldı"
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      error: error.message
    };
  }
});

// QR kodu etkinleştir
router.put("/qr-codes/:qrCodeId/activate", async (ctx) => {
  const qrCodeId = ctx.params.qrCodeId;
  
  try {
    const qrCode = ctx.state.qrCodes?.find(qr => qr.id === qrCodeId);
    if (!qrCode) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        error: "QR kod bulunamadı"
      };
      return;
    }
    
    qrCode.isActive = true;
    
    ctx.response.body = {
      success: true,
      message: "QR kod etkinleştirildi"
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      error: error.message
    };
  }
});

// QR kod süresini uzat
router.put("/qr-codes/:qrCodeId/extend", async (ctx) => {
  const qrCodeId = ctx.params.qrCodeId;
  const body = await ctx.request.body().value;
  
  try {
    const qrCode = ctx.state.qrCodes?.find(qr => qr.id === qrCodeId);
    if (!qrCode) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        error: "QR kod bulunamadı"
      };
      return;
    }
    
    qrCode.expiresAt = body.expiresAt;
    
    ctx.response.body = {
      success: true,
      message: "QR kod süresi uzatıldı"
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      error: error.message
    };
  }
});

// Toplu QR kod oluşturma
router.post("/qr-codes/bulk", async (ctx) => {
  try {
    const body = await ctx.request.body().value;
    const { instructionIds } = body;
    
    const createdQRCodes = [];
    
    for (const instructionId of instructionIds) {
      const instruction = instructions.find(inst => inst.id === instructionId);
      if (instruction) {
        const qrCodeData = `https://example.com/instruction/${instructionId}`;
        const qrCodeId = `qr_${Date.now()}_${Math.random()}`;
        
        const qrCodeImage = `data:image/svg+xml;base64,${btoa(`
          <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="200" fill="white"/>
            <text x="100" y="100" text-anchor="middle" dy=".3em" font-family="Arial" font-size="12">QR Code</text>
            <text x="100" y="120" text-anchor="middle" dy=".3em" font-family="Arial" font-size="10">${instructionId}</text>
          </svg>
        `)}`;
        
        const newQRCode = {
          id: qrCodeId,
          instructionId,
          qrCodeData,
          qrCodeImage,
          accessUrl: qrCodeData,
          expiresAt: null,
          isActive: true,
          createdAt: new Date().toISOString(),
          scanCount: 0,
          lastScannedAt: null
        };
        
        if (!ctx.state.qrCodes) {
          ctx.state.qrCodes = [];
        }
        ctx.state.qrCodes.push(newQRCode);
        createdQRCodes.push(newQRCode);
      }
    }
    
    ctx.response.status = 201;
    ctx.response.body = {
      success: true,
      data: createdQRCodes
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      error: error.message
    };
  }
});

// QR kod şablonları
router.get("/qr-codes/templates", async (ctx) => {
  const templates = [
    {
      id: "default",
      name: "Varsayılan",
      description: "Standart QR kod tasarımı",
      defaultExpiryDays: 365,
      includeLogo: false,
      customStyling: null
    },
    {
      id: "premium",
      name: "Premium",
      description: "Logo ile gelişmiş tasarım",
      defaultExpiryDays: 730,
      includeLogo: true,
      logoUrl: "/assets/logo.png",
      customStyling: {
        primaryColor: "#1f2937",
        secondaryColor: "#3b82f6"
      }
    },
    {
      id: "temporary",
      name: "Geçici",
      description: "Kısa süreli kullanım için",
      defaultExpiryDays: 30,
      includeLogo: false,
      customStyling: {
        primaryColor: "#dc2626",
        secondaryColor: "#fca5a5"
      }
    }
  ];
  
  ctx.response.body = {
    success: true,
    data: templates
  };
});

// QR kod önizlemesi
router.get("/qr-codes/:instructionId/preview", async (ctx) => {
  const instructionId = ctx.params.instructionId;
  const { templateId } = ctx.request.url.searchParams;
  
  try {
    const instruction = instructions.find(inst => inst.id === instructionId);
    if (!instruction) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        error: "Talimat bulunamadı"
      };
      return;
    }
    
    // Önizleme QR kodu oluştur
    const previewUrl = `https://example.com/instruction/${instructionId}/preview`;
    const qrCodeImage = `data:image/svg+xml;base64,${btoa(`
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="white"/>
        <text x="100" y="100" text-anchor="middle" dy=".3em" font-family="Arial" font-size="12">Preview</text>
        <text x="100" y="120" text-anchor="middle" dy=".3em" font-family="Arial" font-size="10">${instructionId}</text>
      </svg>
    `)}`;
    
    const preview = {
      qrCodeImage,
      previewUrl,
      estimatedSize: {
        width: 200,
        height: 200
      }
    };
    
    ctx.response.body = {
      success: true,
      data: preview
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      error: error.message
    };
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

const PORT = 8005;
console.log(`Talimat Servisi ${PORT} portunda çalışıyor...`);
await app.listen({ port: PORT });
