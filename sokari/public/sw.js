const CACHE_NAME = 'sokari-cache-v2';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png'
];

// عند التثبيت: حفظ الملفات الأساسية مسبقاً لضمان توفرها أوفلاين
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
});

// عند التفعيل: مسح الكاش القديم إن وجد للترقية
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// عند طلب أي ملف: استراتيجية (الإنترنت أولاً، ثم الكاش)
self.addEventListener('fetch', (event) => {
  // تجاهل طلبات قواعد البيانات والذكاء الاصطناعي وطلبات إضافات المتصفح
  if (event.request.url.includes('firestore.googleapis.com') || 
      event.request.url.includes('generativelanguage.googleapis.com') ||
      !event.request.url.startsWith('http')) {
    return;
  }

  // تجاهل الطلبات غير الـ GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    (async () => {
      try {
        const networkResponse = await fetch(event.request);
        
        // حفظ نسخة جديدة في الكاش فقط إذا كانت الاستجابة صالحة ومحلية (basic) 
        // هذا يمنع خطأ "Response body is already used" للطلبات الخارجية
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseClone = networkResponse.clone();
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, responseClone);
        }
        
        return networkResponse;
      } catch (error) {
        // إذا فشل الاتصال (أوفلاين)، ابحث في الكاش
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // كحل أخير: إذا كان الطلب لتصفح صفحة ولم يجدها، افتح الصفحة الرئيسية المخبأة
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html') || caches.match('/');
        }
        
        throw error;
      }
    })()
  );
});
