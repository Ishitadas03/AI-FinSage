/**
 * FinSage PWA Service Worker Registration
 * Ensures service worker is registered in browser environments supporting ServiceWorker API.
 */
export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          if (import.meta.env.DEV) {
            console.log('[FinSage PWA] Service worker registered with scope:', registration.scope);
          }
        })
        .catch((error) => {
          console.warn('[FinSage PWA] Service worker registration error:', error);
        });
    });
  }
}
