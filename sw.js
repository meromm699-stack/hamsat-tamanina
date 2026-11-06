var CACHE = 'hamsa-v11';
var FILES = ['./index.html','./manifest.json','./icon-192.png','./icon-512.png','./icon-180.png','./icon-1024.png'];

self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(FILES.map(function(u){ return new Request(u, {cache:'reload'}); }))
        .catch(function(err){
          console.warn('cache addAll failed, trying one by one', err);
          return Promise.allSettled(FILES.map(function(u){
            return cache.add(new Request(u, {cache:'reload'})).catch(function(){});
          }));
        });
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
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  // only handle same-origin
  if (url.origin !== self.location.origin) return;
  
  // for navigation requests, return index.html from cache
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(function(res){
        return caches.open(CACHE).then(function(c){
          c.put(e.request, res.clone());
          return res;
        });
      }).catch(function(){
        return caches.match('./index.html');
      })
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(res) {
        if (!res || res.status !== 200) return res;
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        return res;
      });
    })
  );
});
