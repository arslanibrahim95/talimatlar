-- =============================================================================
-- CLAUDE TALİMAT MOCK DATA SETUP
-- =============================================================================
-- Bu script, test ve geliştirme için kapsamlı mock veriler oluşturur

-- =============================================================================
-- TEMİZLEME (Dikkatli kullanın!)
-- =============================================================================
-- TRUNCATE TABLE analytics.events CASCADE;
-- TRUNCATE TABLE analytics.user_activity CASCADE;
-- TRUNCATE TABLE analytics.company_metrics CASCADE;
-- TRUNCATE TABLE notifications.notifications CASCADE;
-- TRUNCATE TABLE documents.documents CASCADE;
-- TRUNCATE TABLE documents.categories CASCADE;
-- TRUNCATE TABLE auth.users CASCADE;
-- TRUNCATE TABLE auth.companies CASCADE;

-- =============================================================================
-- ŞİRKETLER
-- =============================================================================
INSERT INTO auth.companies (id, name, tax_number, address, phone, email, contact_person, subscription_plan, created_at, updated_at)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'Örnek Şirket A.Ş.', '1234567890', 'İstanbul, Türkiye', '+90 212 123 45 67', 'info@orneksirket.com', 'Ahmet Yılmaz', 'premium', NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440001', 'Güvenlik Teknolojileri Ltd.', '9876543210', 'Ankara, Türkiye', '+90 312 987 65 43', 'info@guvenliktech.com', 'Mehmet Demir', 'standard', NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440002', 'İnşaat ve Mühendislik A.Ş.', '1122334455', 'İzmir, Türkiye', '+90 232 555 44 33', 'info@insaatmuhendislik.com', 'Ayşe Kaya', 'basic', NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440003', 'Üretim Sanayi Ltd.', '5566778899', 'Bursa, Türkiye', '+90 224 777 88 99', 'info@uretim.com', 'Ali Özkan', 'premium', NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440004', 'Teknoloji Çözümleri A.Ş.', '9988776655', 'Antalya, Türkiye', '+90 242 333 22 11', 'info@teknoloji.com', 'Fatma Şen', 'standard', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- KULLANICILAR
-- =============================================================================
INSERT INTO auth.users (id, email, username, password_hash, first_name, last_name, phone, company_id, role, is_verified, is_active, created_at, updated_at)
VALUES 
    -- Örnek Şirket A.Ş. kullanıcıları
    ('550e8400-e29b-41d4-a716-446655440100', 'admin@orneksirket.com', 'admin', crypt('admin123', gen_salt('bf')), 'Admin', 'User', '+90 555 123 45 67', '550e8400-e29b-41d4-a716-446655440000', 'admin', true, true, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440101', 'ahmet.yilmaz@orneksirket.com', 'ahmetyilmaz', crypt('password123', gen_salt('bf')), 'Ahmet', 'Yılmaz', '+90 555 234 56 78', '550e8400-e29b-41d4-a716-446655440000', 'manager', true, true, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440102', 'mehmet.demir@orneksirket.com', 'mehmetdemir', crypt('password123', gen_salt('bf')), 'Mehmet', 'Demir', '+90 555 345 67 89', '550e8400-e29b-41d4-a716-446655440000', 'user', true, true, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440103', 'ayse.kaya@orneksirket.com', 'aysekaya', crypt('password123', gen_salt('bf')), 'Ayşe', 'Kaya', '+90 555 456 78 90', '550e8400-e29b-41d4-a716-446655440000', 'user', true, true, NOW(), NOW()),
    
    -- Güvenlik Teknolojileri Ltd. kullanıcıları
    ('550e8400-e29b-41d4-a716-446655440200', 'admin@guvenliktech.com', 'admin_gt', crypt('admin123', gen_salt('bf')), 'Admin', 'GT', '+90 555 111 22 33', '550e8400-e29b-41d4-a716-446655440001', 'admin', true, true, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440201', 'mehmet.demir@guvenliktech.com', 'mehmet_gt', crypt('password123', gen_salt('bf')), 'Mehmet', 'Demir', '+90 555 222 33 44', '550e8400-e29b-41d4-a716-446655440001', 'manager', true, true, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440202', 'fatma.sen@guvenliktech.com', 'fatma_gt', crypt('password123', gen_salt('bf')), 'Fatma', 'Şen', '+90 555 333 44 55', '550e8400-e29b-41d4-a716-446655440001', 'user', true, true, NOW(), NOW()),
    
    -- İnşaat ve Mühendislik A.Ş. kullanıcıları
    ('550e8400-e29b-41d4-a716-446655440300', 'admin@insaatmuhendislik.com', 'admin_im', crypt('admin123', gen_salt('bf')), 'Admin', 'IM', '+90 555 444 55 66', '550e8400-e29b-41d4-a716-446655440002', 'admin', true, true, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440301', 'ayse.kaya@insaatmuhendislik.com', 'ayse_im', crypt('password123', gen_salt('bf')), 'Ayşe', 'Kaya', '+90 555 555 66 77', '550e8400-e29b-41d4-a716-446655440002', 'manager', true, true, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440302', 'ali.ozkan@insaatmuhendislik.com', 'ali_im', crypt('password123', gen_salt('bf')), 'Ali', 'Özkan', '+90 555 666 77 88', '550e8400-e29b-41d4-a716-446655440002', 'user', true, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- DOKÜMAN KATEGORİLERİ
-- =============================================================================
INSERT INTO documents.categories (id, name, description, company_id, created_at, updated_at)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440400', 'Güvenlik Prosedürleri', 'İş güvenliği prosedürleri ve talimatları', '550e8400-e29b-41d4-a716-446655440000', NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440401', 'Kalite Kontrol', 'Kalite kontrol süreçleri ve standartları', '550e8400-e29b-41d4-a716-446655440000', NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440402', 'İnsan Kaynakları', 'İK süreçleri ve politikaları', '550e8400-e29b-41d4-a716-446655440000', NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440403', 'Teknik Dokümantasyon', 'Teknik çizimler ve spesifikasyonlar', '550e8400-e29b-41d4-a716-446655440000', NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440404', 'Eğitim Materyalleri', 'Çalışan eğitim dokümanları', '550e8400-e29b-41d4-a716-446655440000', NOW(), NOW()),
    
    -- Güvenlik Teknolojileri Ltd. kategorileri
    ('550e8400-e29b-41d4-a716-446655440500', 'Güvenlik Sistemleri', 'Güvenlik sistemleri dokümantasyonu', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440501', 'Teknik Servis', 'Teknik servis prosedürleri', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),
    
    -- İnşaat ve Mühendislik A.Ş. kategorileri
    ('550e8400-e29b-41d4-a716-446655440600', 'İnşaat Projeleri', 'İnşaat proje dokümantasyonu', '550e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440601', 'Mühendislik Hesapları', 'Mühendislik hesaplama dokümanları', '550e8400-e29b-41d4-a716-446655440002', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- DOKÜMANLAR
-- =============================================================================
INSERT INTO documents.documents (id, title, description, file_path, file_size, file_type, category_id, company_id, uploaded_by, status, tags, metadata, created_at, updated_at)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440700', 'Güvenlik Protokolü ve Acil Durum Prosedürleri', 'Çalışan güvenliği için kapsamlı rehber', '/documents/guvenlik-protokolu.pdf', 2048576, 'application/pdf', '550e8400-e29b-41d4-a716-446655440400', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440100', 'active', ARRAY['güvenlik', 'prosedür', 'acil-durum'], '{"version": "2.1", "author": "Güvenlik Müdürlüğü", "review_date": "2024-12-01"}', NOW() - INTERVAL '30 days', NOW()),
    
    ('550e8400-e29b-41d4-a716-446655440701', 'Kalite Kontrol Prosedürleri', 'Üretim kalite kontrol süreçleri', '/documents/kalite-kontrol.docx', 1048576, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '550e8400-e29b-41d4-a716-446655440401', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440101', 'active', ARRAY['kalite', 'kontrol', 'üretim'], '{"version": "1.5", "author": "Kalite Müdürlüğü", "review_date": "2024-11-15"}', NOW() - INTERVAL '25 days', NOW()),
    
    ('550e8400-e29b-41d4-a716-446655440702', 'Yıllık Eğitim Planı', 'Çalışan eğitim programları ve takvimi', '/documents/egitim-planı.xlsx', 512000, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '550e8400-e29b-41d4-a716-446655440404', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440102', 'active', ARRAY['eğitim', 'plan', 'çalışan'], '{"version": "1.0", "author": "İK Müdürlüğü", "review_date": "2024-10-01"}', NOW() - INTERVAL '20 days', NOW()),
    
    ('550e8400-e29b-41d4-a716-446655440703', 'İş Kazası Raporlama Formu', 'İş kazası raporlama süreçleri', '/documents/kaza-raporlama.pdf', 256000, 'application/pdf', '550e8400-e29b-41d4-a716-446655440400', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440100', 'active', ARRAY['kaza', 'rapor', 'güvenlik'], '{"version": "3.0", "author": "Güvenlik Müdürlüğü", "review_date": "2024-09-01"}', NOW() - INTERVAL '15 days', NOW()),
    
    ('550e8400-e29b-41d4-a716-446655440704', 'Çalışan Performans Değerlendirme', 'Çalışan performans değerlendirme kriterleri', '/documents/performans-degerlendirme.docx', 768000, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '550e8400-e29b-41d4-a716-446655440402', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440101', 'active', ARRAY['performans', 'değerlendirme', 'çalışan'], '{"version": "2.0", "author": "İK Müdürlüğü", "review_date": "2024-08-15"}', NOW() - INTERVAL '10 days', NOW()),
    
    -- Güvenlik Teknolojileri Ltd. dokümanları
    ('550e8400-e29b-41d4-a716-446655440800', 'Güvenlik Sistemleri Kurulum Kılavuzu', 'Güvenlik sistemleri kurulum prosedürleri', '/documents/guvenlik-sistemleri.pdf', 1536000, 'application/pdf', '550e8400-e29b-41d4-a716-446655440500', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440200', 'active', ARRAY['güvenlik', 'sistem', 'kurulum'], '{"version": "1.2", "author": "Teknik Ekip", "review_date": "2024-07-01"}', NOW() - INTERVAL '5 days', NOW()),
    
    -- İnşaat ve Mühendislik A.Ş. dokümanları
    ('550e8400-e29b-41d4-a716-446655440900', 'İnşaat Projesi Teknik Şartnamesi', 'İnşaat projesi teknik şartnameleri', '/documents/teknik-sartname.pdf', 3072000, 'application/pdf', '550e8400-e29b-41d4-a716-446655440600', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440300', 'active', ARRAY['inşaat', 'proje', 'teknik'], '{"version": "1.0", "author": "Mühendislik Ekibi", "review_date": "2024-06-01"}', NOW() - INTERVAL '3 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- ANALYTICS EVENTS
-- =============================================================================
-- Son 30 gün için mock analytics verileri
INSERT INTO analytics.events (id, event_type, user_id, company_id, metadata, created_at)
SELECT 
    gen_random_uuid(),
    (ARRAY['login', 'document_view', 'document_download', 'search', 'upload', 'share'])[floor(random() * 6 + 1)],
    (ARRAY['550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440200', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440300', '550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440302'])[floor(random() * 10 + 1)],
    (ARRAY['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'])[floor(random() * 3 + 1)],
    jsonb_build_object(
        'page', (ARRAY['/dashboard', '/documents', '/analytics', '/users', '/settings'])[floor(random() * 5 + 1)],
        'duration', floor(random() * 300 + 10),
        'device', (ARRAY['desktop', 'mobile', 'tablet'])[floor(random() * 3 + 1)]
    ),
    NOW() - (random() * INTERVAL '30 days')
FROM generate_series(1, 1000);

-- =============================================================================
-- USER ACTIVITY
-- =============================================================================
-- Son 30 gün için kullanıcı aktivite verileri
INSERT INTO analytics.user_activity (id, user_id, company_id, date, login_count, document_views, document_downloads, search_count, upload_count, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    u.id,
    u.company_id,
    CURRENT_DATE - (random() * 30)::integer,
    floor(random() * 5 + 1),
    floor(random() * 20 + 1),
    floor(random() * 10 + 1),
    floor(random() * 15 + 1),
    floor(random() * 3 + 1),
    NOW(),
    NOW()
FROM auth.users u
CROSS JOIN generate_series(1, 30);

-- =============================================================================
-- COMPANY METRICS
-- =============================================================================
-- Şirket metrikleri
INSERT INTO analytics.company_metrics (id, company_id, date, total_users, active_users, total_documents, total_downloads, total_uploads, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    c.id,
    CURRENT_DATE - (random() * 30)::integer,
    floor(random() * 50 + 10),
    floor(random() * 30 + 5),
    floor(random() * 100 + 20),
    floor(random() * 200 + 50),
    floor(random() * 20 + 5),
    NOW(),
    NOW()
FROM auth.companies c
CROSS JOIN generate_series(1, 30);

-- =============================================================================
-- NOTIFICATIONS
-- =============================================================================
INSERT INTO notifications.notifications (id, user_id, company_id, title, message, type, status, metadata, created_at, updated_at)
VALUES 
    ('550e8400-e29b-41d4-a716-446655441000', '550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440000', 'Yeni Doküman Yüklendi', 'Güvenlik Protokolü dokümanı güncellendi', 'info', 'unread', '{"document_id": "550e8400-e29b-41d4-a716-446655440700"}', NOW() - INTERVAL '2 hours', NOW()),
    
    ('550e8400-e29b-41d4-a716-446655441001', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440000', 'Eğitim Hatırlatması', 'Güvenlik eğitimi tamamlanması gerekiyor', 'warning', 'unread', '{"training_id": "safety-training-001"}', NOW() - INTERVAL '1 day', NOW()),
    
    ('550e8400-e29b-41d4-a716-446655441002', '550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440000', 'Sistem Bakımı', 'Sistem bakımı 15 Ocak 2024 tarihinde yapılacak', 'maintenance', 'read', '{"maintenance_date": "2024-01-15", "duration": "2 hours"}', NOW() - INTERVAL '3 days', NOW()),
    
    ('550e8400-e29b-41d4-a716-446655441003', '550e8400-e29b-41d4-a716-446655440200', '550e8400-e29b-41d4-a716-446655440001', 'Yeni Kullanıcı Kaydı', 'Mehmet Demir sisteme kaydoldu', 'info', 'read', '{"new_user_id": "550e8400-e29b-41d4-a716-446655440201"}', NOW() - INTERVAL '5 days', NOW()),
    
    ('550e8400-e29b-41d4-a716-446655441004', '550e8400-e29b-41d4-a716-446655440300', '550e8400-e29b-41d4-a716-446655440002', 'Proje Güncellemesi', 'İnşaat projesi durumu güncellendi', 'success', 'unread', '{"project_id": "construction-project-001"}', NOW() - INTERVAL '1 week', NOW())
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- BAŞARILI KURULUM MESAJI
-- =============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Mock data başarıyla oluşturuldu!';
    RAISE NOTICE '📊 Oluşturulan veriler:';
    RAISE NOTICE '   - % şirket', (SELECT COUNT(*) FROM auth.companies);
    RAISE NOTICE '   - % kullanıcı', (SELECT COUNT(*) FROM auth.users);
    RAISE NOTICE '   - % doküman kategorisi', (SELECT COUNT(*) FROM documents.categories);
    RAISE NOTICE '   - % doküman', (SELECT COUNT(*) FROM documents.documents);
    RAISE NOTICE '   - % analytics event', (SELECT COUNT(*) FROM analytics.events);
    RAISE NOTICE '   - % bildirim', (SELECT COUNT(*) FROM notifications.notifications);
    RAISE NOTICE '';
    RAISE NOTICE '🔑 Test kullanıcıları:';
    RAISE NOTICE '   - admin@orneksirket.com / admin123 (Admin)';
    RAISE NOTICE '   - ahmet.yilmaz@orneksirket.com / password123 (Manager)';
    RAISE NOTICE '   - mehmet.demir@orneksirket.com / password123 (User)';
    RAISE NOTICE '';
    RAISE NOTICE '🌐 Test URL''leri:';
    RAISE NOTICE '   - Frontend: http://localhost:3000';
    RAISE NOTICE '   - API: http://localhost:8004';
    RAISE NOTICE '   - Grafana: http://localhost:3004';
END $$;
