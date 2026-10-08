const CACHE_NAME = 'sokari-cache-v1';

// عند التثبيت
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

// عند التفعيل
self.addEventListener('activate', (e) => {
  return self.clients.claim();
});

// استراتيجية (Stale-While-Revalidate)
// جلب الملفات من الكاش إن وجدت لسرعة الفتح (أوفلاين)، وتحديثها في الخلفية من الإنترنت
self.addEventListener('fetch', (event) => {
  // استثناء طلبات قاعدة البيانات والذكاء الاصطناعي من الكاش (يجب أن تكون حية)
  if (event.request.url.includes('firestore.googleapis.com') || 
      event.request.url.includes('generativelanguage.googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // حفظ نسخة جديدة في الكاش للمرات القادمة
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      }).catch(() => {
        // إذا فشل الاتصال بالإنترنت، نكتفي بالنسخة المخبأة
        return cachedResponse;
      });

      // إرجاع النسخة المخبأة فوراً إن وجدت، أو الانتظار لجلبها من الإنترنت
      return cachedResponse || fetchPromise;
    })
  );
});
