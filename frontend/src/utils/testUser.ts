// Test kullanıcısı - Register olmadan test edebilmek için
export const createTestUser = () => {
  const testUser = {
    id: 'test-user-123',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'Kullanıcı',
    phone: '+90 555 123 4567',
    role: 'user' as const,
    tenant_id: 'test-tenant-123',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    // LocalStorage'a test kullanıcısını kaydet
    localStorage.setItem('test_user', JSON.stringify(testUser));
    localStorage.setItem('auth_token', 'test-token-123');
    localStorage.setItem('is_test_user', 'true');
    console.log('✅ Test kullanıcısı oluşturuldu:', testUser.email);
  } catch (error) {
    console.error('❌ Test kullanıcısı oluşturulamadı:', error);
  }

  return testUser;
};

export const getTestUser = () => {
  try {
    const testUserStr = localStorage.getItem('test_user');
    if (testUserStr) {
      const user = JSON.parse(testUserStr);
      console.log('✅ Test kullanıcısı bulundu:', user.email);
      return user;
    }
    console.log('ℹ️ Test kullanıcısı bulunamadı');
    return null;
  } catch (error) {
    console.error('❌ Test kullanıcısı alınamadı:', error);
    return null;
  }
};

export const isTestUser = () => {
  try {
    const isTest = localStorage.getItem('is_test_user') === 'true';
    console.log('ℹ️ Test kullanıcısı mı?', isTest);
    return isTest;
  } catch (error) {
    console.error('❌ Test kullanıcısı kontrolü başarısız:', error);
    return false;
  }
};

export const clearTestUser = () => {
  try {
    localStorage.removeItem('test_user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('is_test_user');
    console.log('✅ Test kullanıcısı temizlendi');
  } catch (error) {
    console.error('❌ Test kullanıcısı temizlenemedi:', error);
  }
};

// Test kullanıcısı ile giriş yapma
export const loginAsTestUser = () => {
  try {
    const testUser = createTestUser();
    console.log('✅ Test kullanıcısı ile giriş yapıldı:', testUser.email);
    return {
      success: true,
      user: testUser,
      access_token: 'test-token-123'
    };
  } catch (error) {
    console.error('❌ Test kullanıcısı ile giriş başarısız:', error);
    throw error;
  }
};
