var CACHE = 'hamsa-v10';
var FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-180.png', './icon-1024.png'];

self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(c) {
      // نحاول نحفظ كل ملف لوحده عشان لو واحد ناقص مايبوظش التثبيت كله
      return Promise.allSettled(FILES.map(function(f){ return c.add(f).catch(function(){}); }));
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(res) {
        return caches.open(CACHE).then(function(c) {
          try{ c.put(e.request, res.clone()); }catch(err){}
          return res;
        });
      }).catch(function(){ return cached; });
    })
  );
});
