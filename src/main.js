import './style.css';
import { initAuth, checkAuthStatus } from './js/auth.js';
import { initMaps } from './js/maps.js';
import { initStorage } from './js/storage.js';
import { initUI } from './js/ui.js';

/**
 * Application initialization
 */
async function initApp() {
  console.log('Initializing Kørselsregistrering app...');
  
  // Initialize authentication first
  initAuth()
    .then(() => {
      // Check if user is already authenticated
      return checkAuthStatus();
    })
    .then(isAuthenticated => {
      if (isAuthenticated) {
        // User is authenticated, initialize the rest of the app
        console.log('User is authenticated, initializing app modules');
        initMaps();
        initStorage();
        initUI();
      } else {
        // User is not authenticated, show login page
        console.log('User is not authenticated, showing login page');
        // Login UI elements are already configured in auth.js
      }
    })
    .catch(error => {
      console.error('Error initializing application:', error);
    });
}

// Start the application
document.addEventListener('DOMContentLoaded', initApp); 