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
  
  try {
    // Initialize authentication first
    const auth = await initAuth();
    console.log('Auth initialized, checking status');
    
    // Check if user is already authenticated
    const isAuthenticated = await checkAuthStatus();
    console.log('Auth status checked, user is authenticated:', isAuthenticated);
    
    // Set up authentication event listeners
    window.addEventListener('userAuthenticated', (event) => {
      console.log('Authentication event received, user authenticated:', event.detail);
      // Initialize the rest of the app when user authenticates
      initRestOfApp();
    });
    
    window.addEventListener('userSignedOut', () => {
      console.log('User signed out event received');
      // Hide app sections, can be handled by auth.js updateUIForUnauthenticatedUser
    });
    
    // If already authenticated, initialize the app components
    if (isAuthenticated) {
      initRestOfApp();
    }
  } catch (error) {
    console.error('Error initializing application:', error);
  }
}

/**
 * Initialize all non-auth app components
 */
function initRestOfApp() {
  console.log('Initializing rest of app components');
  initMaps();
  initStorage();
  initUI();
}

// Start the application
document.addEventListener('DOMContentLoaded', initApp); 