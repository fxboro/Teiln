import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register service worker for offline support and push notifications
if ('serviceWorker' in navigator && !window.location.host.includes('localhost:5173')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        // Trigger periodic update checks when online
        if (reg.update) {
          reg.update().catch(() => {});
        }
      })
      .catch((err) => {
        // May fail in cross-origin sandbox iframes, gracefully continue
        console.info('Service Worker registration skipped or restricted:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
