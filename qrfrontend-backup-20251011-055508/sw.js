// Self-unregistering service worker: clears all caches and then unregisters itself.
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('sw.js: Cleared caches:', cacheNames);
    } catch (e) {
      console.warn('sw.js: Error clearing caches', e);
    }
    // Force activate
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      // Unregister all service workers for this scope
      const regs = await self.registration.scope ? [self.registration] : await navigator.serviceWorker.getRegistrations();
      // Note: navigator is not available in SW global scope for some hosts; attempt best-effort
      if (self.registration) {
        console.log('sw.js: unregistering self');
        await self.registration.unregister();
      }
    } catch (e) {
      console.warn('sw.js: activate error', e);
    }
  })());
});

// Do not handle fetch events - this SW simply cleans up and leaves
self.addEventListener('fetch', (event) => {
  // noop
});
