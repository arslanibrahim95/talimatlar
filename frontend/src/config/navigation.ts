// Navigation Item Interface
export interface NavigationItem {
  id: string;
  title: string;
  label: string; // Keep label for backward compatibility
  href: string;
  icon: string; // Icon name as string
  description?: string;
  badge?: number;
  isNew?: boolean;
  isBeta?: boolean;
  isExternal?: boolean; // Add for Search component
  children?: NavigationItem[];
}

// Main Navigation
export const mainNavigation: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'dashboard',
    description: 'Sistem genel durumu ve özet bilgiler'
  },
  {
    id: 'documents',
    title: 'Dokümanlar',
    label: 'Dokümanlar',
    href: '/documents',
    icon: 'document',
    badge: 12,
    description: 'Doküman yönetimi ve arşivleme'
  },
  {
    id: 'categories',
    title: 'Kategoriler',
    label: 'Kategoriler',
    href: '/categories',
    icon: 'category',
    description: 'Doküman kategorileri ve organizasyon'
  },
  {
    id: 'analytics',
    title: 'Analitik',
    label: 'Analitik',
    href: '/analytics',
    icon: 'analytics',
    description: 'Detaylı raporlar ve istatistikler'
  },
  {
    id: 'notifications',
    title: 'Bildirimler',
    label: 'Bildirimler',
    href: '/notifications',
    icon: 'notification',
    badge: 3,
    description: 'Sistem bildirimleri ve uyarılar'
  },
  {
    id: 'users',
    title: 'Kullanıcılar',
    label: 'Kullanıcılar',
    href: '/users',
    icon: 'users',
    description: 'Kullanıcı yönetimi ve yetkilendirme'
  },
  {
    id: 'instructions',
    title: 'Talimatlar',
    label: 'Talimatlar',
    href: '/instructions',
    icon: 'clipboard',
    description: 'Sistem talimatları ve prosedürler'
  },
  {
    id: 'ai',
    title: 'AI Yönetici',
    label: 'AI Yönetici',
    href: '/ai',
    icon: 'ai',
    description: 'AI destekli sistem yönetimi',
    isNew: true,
    isBeta: true
  },
  {
    id: 'personnel',
    title: 'Personel Yönetimi',
    label: 'Personel Yönetimi',
    href: '/personnel',
    icon: 'users',
    description: 'Personel yönetimi ve talimat takibi',
    isNew: true
  },
  {
    id: 'file-management',
    title: 'Dosya Yönetimi',
    label: 'Dosya Yönetimi',
    href: '/file-management',
    icon: 'folder',
    description: 'Dosya yükleme, görüntüleme ve yönetim',
    isNew: true
  },
  {
    id: 'settings',
    title: 'Ayarlar',
    label: 'Ayarlar',
    href: '/settings',
    icon: 'settings',
    description: 'Sistem ayarları ve konfigürasyon'
  },
  {
    id: 'help',
    title: 'Yardım',
    label: 'Yardım',
    href: '/help',
    icon: 'help',
    description: 'Sistem yardımı ve destek'
  },
  {
    id: 'about',
    title: 'Hakkında',
    label: 'Hakkında',
    href: '/about',
    icon: 'about',
    description: 'Sistem hakkında bilgiler'
  },
  {
    id: 'contact',
    title: 'İletişim',
    label: 'İletişim',
    href: '/contact',
    icon: 'contact',
    description: 'İletişim bilgileri ve destek'
  }
];

// Quick Actions
export const quickActions: NavigationItem[] = [
  {
    id: 'new-document',
    title: 'Yeni Doküman',
    label: 'Yeni Doküman',
    href: '/documents/new',
    icon: 'document',
    description: 'Yeni doküman oluştur',
    isNew: true
  },
  {
    id: 'upload-document',
    title: 'Doküman Yükle',
    label: 'Doküman Yükle',
    href: '/documents/upload',
    icon: 'document',
    description: 'Mevcut doküman yükle'
  },
  {
    id: 'new-report',
    title: 'Yeni Rapor',
    label: 'Yeni Rapor',
    href: '/analytics/reports/new',
    icon: 'analytics',
    description: 'Yeni rapor oluştur'
  },
  {
    id: 'user-management',
    title: 'Kullanıcı Yönetimi',
    label: 'Kullanıcı Yönetimi',
    href: '/users/management',
    icon: 'users',
    description: 'Kullanıcı yetkilerini yönet'
  },
  {
    id: 'new-instruction',
    title: 'Yeni Talimat',
    label: 'Yeni Talimat',
    href: '/instructions/new',
    icon: 'document',
    description: 'Yeni talimat oluştur',
    isNew: true
  }
];

// Footer Navigation
export const footerNavigation: NavigationItem[] = [
  {
    id: 'help',
    title: 'Yardım',
    label: 'Yardım',
    href: '/help',
    icon: 'help',
    description: 'Kullanım kılavuzu ve destek'
  },
  {
    id: 'about',
    title: 'Hakkında',
    label: 'Hakkında',
    href: '/about',
    icon: 'document',
    description: 'Sistem hakkında bilgiler'
  },
  {
    id: 'contact',
    title: 'İletişim',
    label: 'İletişim',
    href: '/contact',
    icon: 'users',
    description: 'Destek ekibi ile iletişim'
  }
];

// Utility Functions
export const getBreadcrumbs = (pathname: string): NavigationItem[] => {
  const breadcrumbs: NavigationItem[] = [];
  const pathSegments = pathname.split('/').filter(Boolean);
  
  let currentPath = '';
  pathSegments.forEach((segment) => {
    currentPath += `/${segment}`;
    const item = getNavigationItemByHref(currentPath);
    if (item) {
      breadcrumbs.push(item);
    }
  });
  
  return breadcrumbs;
};

export const searchableItems = (): NavigationItem[] => {
  return [
    ...mainNavigation,
    ...quickActions,
    ...footerNavigation
  ];
};

export const getNavigationItem = (id: string): NavigationItem | undefined => {
  const allItems = searchableItems();
  return allItems.find(item => item.id === id);
};

export const getNavigationItemByHref = (href: string): NavigationItem | undefined => {
  const allItems = searchableItems();
  return allItems.find(item => item.href === href);
};
