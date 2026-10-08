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
  // تجاهل طلبات قواعد البيانات والذكاء الاصطناعي
  if (event.request.url.includes('firestore.googleapis.com') || 
      event.request.url.includes('generativelanguage.googleapis.com')) {
    return;
  }

  // تجاهل الطلبات غير الـ GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // إذا نجح الاتصال بالإنترنت، احفظ نسخة جديدة في الكاش للمستقبل
        if (networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // إذا فشل الاتصال (أوفلاين)، ابحث في الكاش
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // كحل أخير: إذا كان الطلب لتصفح صفحة ولم يجدها، افتح الصفحة الرئيسية المخبأة
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      })
  );
});
