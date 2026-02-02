
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Register Service Worker for PWA and Background Notifications
// Using new URL construction to ensure the script is fetched from the current page's origin
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    try {
      const swUrl = new URL('sw.js', window.location.href).href;
      const swScope = new URL('./', window.location.href).pathname;
      
      navigator.serviceWorker.register(swUrl, { scope: swScope })
        .then(reg => console.log('Service Worker registered:', reg))
        .catch(err => {
          console.warn('Service Worker registration failed:', err);
          // In some sandboxed environments, Service Workers are restricted.
          // We log a warning instead of a hard error to allow the app to function without background features.
        });
    } catch (e) {
      console.warn('Could not construct Service Worker URL:', e);
    }
  });
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
