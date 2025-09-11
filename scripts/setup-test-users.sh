#!/bin/bash

# Test kullanıcılarını oluşturma scripti
echo "🔐 Test kullanıcıları oluşturuluyor..."

# PostgreSQL bağlantısı
DB_HOST="localhost"
DB_PORT="5433"
DB_NAME="safety_production"
DB_USER="safety_admin"
DB_PASSWORD="${POSTGRES_PASSWORD:-default_password}"

# Test kullanıcıları
declare -a USERS=(
    "stress1@example.com:password123:user"
    "stress2@example.com:password123:user"
    "stress3@example.com:password123:user"
    "stress4@example.com:password123:user"
    "stress5@example.com:password123:user"
    "admin@example.com:password123:admin"
    "manager@example.com:password123:manager"
    "supervisor@example.com:password123:supervisor"
)

# PostgreSQL'e bağlan ve kullanıcıları oluştur
for user_data in "${USERS[@]}"; do
    IFS=':' read -r email password role <<< "$user_data"
    
    echo "👤 Kullanıcı oluşturuluyor: $email ($role)"
    
    # Kullanıcıyı veritabanına ekle
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        INSERT INTO users (email, password, role, created_at, updated_at) 
        VALUES ('$email', '$password', '$role', NOW(), NOW())
        ON CONFLICT (email) DO UPDATE SET 
            password = EXCLUDED.password,
            role = EXCLUDED.role,
            updated_at = NOW();
    " 2>/dev/null || echo "⚠️ Kullanıcı oluşturulamadı: $email"
done

echo "✅ Test kullanıcıları oluşturma tamamlandı!"

# Kullanıcıları listele
echo "📋 Oluşturulan kullanıcılar:"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
    SELECT email, role, created_at FROM users WHERE email LIKE '%@example.com' ORDER BY created_at;
"
