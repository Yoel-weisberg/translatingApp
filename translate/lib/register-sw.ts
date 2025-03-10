// lib/register-sw.ts
export function registerServiceWorker() {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('SW registered: ', registration);
            
            // Check for updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              console.log('SW update found!');
              
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New service worker is installed, but waiting to activate
                    console.log('New SW installed, waiting to activate');
                    
                    // You could show a notification to the user here
                    if (window.confirm('New version available! Reload to update?')) {
                      // Send message to skip waiting
                      newWorker.postMessage({ type: 'SKIP_WAITING' });
                      window.location.reload();
                    }
                  }
                });
              }
            });
          })
          .catch(error => {
            console.error('SW registration failed: ', error);
          });
          
        // Handle controller change (when a new SW takes over)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('New service worker activated');
        });
      });
    }
  }