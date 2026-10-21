// Cambia la versión cada vez que subas cambios, para que los celulares tomen la nueva versión.
const VERSION = 'viaticos-v2';
const ARCHIVOS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Página: primero internet (para ver cambios), si no hay señal usa la copia guardada.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => { const copia = res.clone(); caches.open(VERSION).then(c => c.put('./index.html', copia)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Resto (íconos, tipografías): primero la copia guardada, si no existe se descarga y se guarda.
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) {
        const copia = res.clone();
        caches.open(VERSION).then(c => c.put(req, copia));
      }
      return res;
    }).catch(() => hit))
  );
});
