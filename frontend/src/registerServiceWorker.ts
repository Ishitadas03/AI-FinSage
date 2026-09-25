/**
 * FinSage PWA Service Worker Registration
 * Ensures service worker is registered immediately in browser environments supporting ServiceWorker API.
 */
export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    const register = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          if (import.meta.env.DEV) {
            console.log('[FinSage PWA] Service Worker registered with scope:', registration.scope);
          }
        })
        .catch((error) => {
          console.warn('[FinSage PWA] Service Worker registration error:', error);
        });
    };

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      register();
    } else {
      window.addEventListener('load', register);
    }
  }
}
