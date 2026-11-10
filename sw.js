// Service worker: la página siempre intenta la versión más nueva cuando hay internet
// (network-first para el HTML), y usa la copia guardada si está sin conexión.
var CACHE="ciclo-v7";
var ASSETS=["./","index.html","manifest.json","icon-192.png","icon-512.png","icon-180.png"];

self.addEventListener("install",function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(ASSETS);}).then(function(){return self.skipWaiting();}));
});
self.addEventListener("activate",function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
  }).then(function(){return self.clients.claim();}));
});
self.addEventListener("fetch",function(e){
  var req=e.request;
  var isHTML = req.mode==="navigate" ||
               (req.headers.get("accept")||"").indexOf("text/html")>-1 ||
               /\/(index\.html)?(\?|$)/.test(new URL(req.url).pathname);
  if(isHTML){
    // network-first: trae lo último, actualiza la copia, y si no hay red usa la guardada.
    e.respondWith(
      fetch(req).then(function(resp){
        var copy=resp.clone();
        caches.open(CACHE).then(function(c){ c.put("index.html", copy); });
        return resp;
      }).catch(function(){
        return caches.match("index.html").then(function(r){ return r || caches.match("./"); });
      })
    );
  } else {
    // íconos y demás: cache-first (rápido y offline).
    e.respondWith(caches.match(req).then(function(r){ return r || fetch(req); }));
  }
});
