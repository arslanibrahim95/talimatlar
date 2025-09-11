# Database Layer

Bu modül, tüm mikroservisler için ortak veritabanı katmanını sağlar. PostgreSQL tabanlı, çok dilli destekli (Python, TypeScript, Go) bir veritabanı yönetim sistemi.

## Özellikler

- **Çok Dilli Destek**: Python (SQLAlchemy), TypeScript (Deno), Go (database/sql)
- **Mikroservis Mimarisi**: Her servis için ayrı veritabanı bağlantıları
- **Migration Sistemi**: Otomatik şema güncellemeleri
- **Connection Pooling**: Performans optimizasyonu
- **Health Monitoring**: Veritabanı sağlık kontrolü
- **Multi-tenant**: Çoklu şirket desteği

## Yapı

```
database-layer/
├── schemas/           # Veritabanı şemaları
├── connections/       # Bağlantı yönetimi
├── migrations/        # Migration sistemi
├── repositories/      # Veri erişim katmanı
├── config/           # Konfigürasyon
└── utils/            # Yardımcı fonksiyonlar
```

## Kullanım

### Python Servisleri

```python
from database_layer.connections import PythonDatabaseConnection
from database_layer.schemas import *

# Bağlantı oluştur
conn = PythonDatabaseConnection(connection_string)
await conn.connect()

# Sorgu çalıştır
result = await conn.execute_query("SELECT * FROM users")
```

### TypeScript Servisleri

```typescript
import { TypeScriptDatabaseConnection } from './database-layer/connections/typescript_connection.ts';

// Bağlantı oluştur
const conn = new TypeScriptDatabaseConnection(connectionString);
await conn.connect();

// Sorgu çalıştır
const result = await conn.executeQuery("SELECT * FROM users");
```

### Go Servisleri

```go
import "database-layer/connections"

// Bağlantı oluştur
conn := connections.NewGoDatabaseConnection(connectionString)
err := conn.Connect()

// Sorgu çalıştır
result, err := conn.ExecuteQuery("SELECT * FROM users")
```

## Migration Sistemi

```bash
# Yeni migration oluştur
python -m database_layer.migrations create "add_user_table"

# Migration'ları çalıştır
python -m database_layer.migrations up

# Migration'ları geri al
python -m database_layer.migrations down
```

## Konfigürasyon

```yaml
database:
  host: localhost
  port: 5432
  database: talimatlar
  username: postgres
  password: password
  ssl_mode: prefer
  pool_size: 10
  max_overflow: 20
```

## Şemalar

- **auth_schema**: Kullanıcı yönetimi ve kimlik doğrulama
- **document_schema**: Doküman yönetimi
- **analytics_schema**: Analitik ve raporlama
- **notification_schema**: Bildirim sistemi
- **compliance_schema**: Uyumluluk yönetimi
- **personnel_schema**: Personel yönetimi
- **risk_schema**: Risk yönetimi
- **training_schema**: Eğitim yönetimi
- **incident_schema**: Olay yönetimi
- **kpi_schema**: KPI yönetimi
- **instruction_schema**: Talimat yönetimi
- **qr_schema**: QR kod yönetimi
