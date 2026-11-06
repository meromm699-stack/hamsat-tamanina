var CACHE = 'hamsa-v11';
var FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-180.png', './icon-1024.png'];

self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(c) {
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
  var url = e.request.url;
  if(url.includes('goatcounter') || url.includes('countapi') || url.includes('hits.seeyoufarm') || url.includes('counter') || url.includes('api.count')){
    e.respondWith(fetch(e.request).catch(function(){ return new Response('', {status: 204}); }));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(res) {
        return caches.open(CACHE).then(function(c) {
          try{ if(res.ok) c.put(e.request, res.clone()); }catch(err){}
          return res;
        });
      }).catch(function(){ return cached; });
    })
  );
});
