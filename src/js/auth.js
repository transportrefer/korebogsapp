/**
 * Authentication Module
 * Handles Google OAuth authentication using Google Identity Services
 */

// Configuration for Google OAuth
const AUTH_CONFIG = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '129709058864-dmk39lre4jrop8ch05t1taeggmchhoqs.apps.googleusercontent.com',
  apiKey: import.meta.env.VITE_GOOGLE_API_KEY || 'AIzaSyApeC-_5XObrNatcG_yxUna853dpkyHmlM',
  scopes: [
    'https://www.googleapis.com/auth/drive.file', // For Google Sheets
    'https://www.googleapis.com/auth/spreadsheets', // For Google Sheets
    'https://www.googleapis.com/auth/userinfo.profile', // For user profile info
    'https://www.googleapis.com/auth/userinfo.email' // For user email
  ]
};

// LocalStorage keys for authentication
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  TOKEN_EXPIRY: 'auth_token_expiry',
  USER_DATA: 'auth_user_data'
};

// Log configuration for debugging
console.log('Auth configuration:', {
  clientId: AUTH_CONFIG.clientId,
  hasApiKey: !!AUTH_CONFIG.apiKey,
  origin: window.location.origin,
  pathname: window.location.pathname
});

// Auth state
let isSignedIn = false;
let userData = null;
let tokenClient = null;

// DOM elements for authentication
let loginBtn;
let loginMainBtn;
let logoutBtn;
let authSection;
let appSection;
let userProfile;
let userAvatar;
let userName;

/**
 * Initialize the authentication module
 */
export async function initAuth() {
  console.log('Initializing auth module');
  
  // Initialize DOM elements
  loginBtn = document.getElementById('login-btn');
  loginMainBtn = document.getElementById('login-main-btn');
  logoutBtn = document.getElementById('logout-btn');
  authSection = document.getElementById('auth-section');
  appSection = document.getElementById('app-section');
  userProfile = document.getElementById('user-profile');
  userAvatar = document.getElementById('user-avatar');
  userName = document.getElementById('user-name');
  
  // Set up event listeners
  if (loginBtn) loginBtn.addEventListener('click', handleLogin);
  if (loginMainBtn) loginMainBtn.addEventListener('click', handleLogin);
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
  
  // Load the Google Identity Services
  await loadGoogleIdentityServices();
  
  // Check for existing auth state (tokens in localStorage)
  const authStatus = await checkAuthStatus();
  console.log('Initial auth status check:', authStatus ? 'Authenticated' : 'Not authenticated');
  
  // If authenticated, make sure UI is updated correctly
  if (authStatus && userData) {
    updateUIForAuthenticatedUser();
    
    // Dispatch event that user is authenticated to ensure all components are notified
    window.dispatchEvent(new CustomEvent('userAuthenticated', { detail: userData }));
  } else {
    updateUIForUnauthenticatedUser();
  }
  
  return {
    isAuthenticated: () => isSignedIn,
    getCurrentUser: () => userData,
    login: handleLogin,
    logout: handleLogout
  };
}

/**
 * Load the Google Identity Services script
 */
function loadGoogleIdentityServices() {
  return new Promise((resolve, reject) => {
    console.log('Loading Google Identity Services');
    
    // Check if the Google Identity Services script is already loaded
    if (window.google && window.google.accounts) {
      console.log('Google Identity Services already loaded');
      initializeGIS();
      resolve();
      return;
    }
    
    // Load the GIS script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('Google Identity Services script loaded');
      initializeGIS();
      resolve();
    };
    script.onerror = (error) => {
      console.error('Error loading Google Identity Services script:', error);
      reject(error);
    };
    document.body.appendChild(script);
  });
}

/**
 * Initialize Google Identity Services
 */
function initializeGIS() {
  console.log('Initializing Google Identity Services');
  
  // Create token client for handling authorization
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: AUTH_CONFIG.clientId,
    scope: AUTH_CONFIG.scopes.join(' '),
    prompt: 'consent',
    ux_mode: 'popup',
    callback: (tokenResponse) => {
      if (tokenResponse.error !== undefined) {
        console.error('Token error:', tokenResponse);
        return;
      }
      
      console.log('Token received successfully:', tokenResponse);
      
      // Store tokens in localStorage for session persistence
      if (tokenResponse.access_token) {
        // Calculate expiry time
        const expiryTime = Date.now() + (tokenResponse.expires_in * 1000);
        
        // Store token and expiry time
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokenResponse.access_token);
        localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
        
        console.log('Token stored in localStorage with expiry:', new Date(expiryTime).toISOString());
      }
      
      // Get user profile info
      fetchUserProfile(tokenResponse.access_token)
        .then(userInfo => {
          console.log('User profile fetched:', userInfo);
          userData = userInfo;
          isSignedIn = true;
          
          // Store user data for session persistence
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userInfo));
          
          // Make sure to update the UI
          updateUIForAuthenticatedUser();
          console.log('UI updated for authenticated user');
          
          // Dispatch event that user is authenticated
          window.dispatchEvent(new CustomEvent('userAuthenticated', { detail: userData }));
        })
        .catch(error => {
          console.error('Error fetching user profile:', error);
        });
    },
  });
}

/**
 * Fetch user profile information using the access token
 */
async function fetchUserProfile(accessToken) {
  console.log('Fetching user profile with access token:', accessToken.substring(0, 10) + '...');
  
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      console.error('Failed to fetch user profile:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      throw new Error(`Failed to fetch user profile: ${response.status}`);
    }
    
    const userData = await response.json();
    console.log('User profile data received:', userData);
    return userData;
  } catch (error) {
    console.error('Exception when fetching user profile:', error);
    throw error;
  }
}

/**
 * Handle login button click
 */
async function handleLogin() {
  console.log('Login clicked');
  
  if (!tokenClient) {
    console.error('Token client not initialized');
    return;
  }
  
  // Request the token
  tokenClient.requestAccessToken({
    prompt: 'consent',
  });
}

/**
 * Handle logout button click
 */
async function handleLogout() {
  console.log('Logout clicked');
  
  // Store access token before clearing
  const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  
  // First update UI state for immediate feedback
  isSignedIn = false;
  userData = null;
  updateUIForUnauthenticatedUser();
  
  // Revoke the access token with Google if possible
  let revocationSuccess = false;
  
  if (accessToken) {
    try {
      console.log('Attempting to revoke access token');
      const revokeEndpoint = 'https://oauth2.googleapis.com/revoke';
      const response = await fetch(`${revokeEndpoint}?token=${accessToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      if (response.ok) {
        console.log('Access token successfully revoked');
        revocationSuccess = true;
      } else {
        console.warn('Failed to revoke access token:', response.status);
      }
    } catch (error) {
      console.error('Error revoking access token:', error);
    }
  } else {
    console.log('No access token available to revoke');
  }
  
  // Always clear local storage regardless of revocation success
  clearAuthData();
  
  // Dispatch signout event to notify other components
  window.dispatchEvent(new CustomEvent('userSignedOut'));
  
  console.log('Logout complete, revocation ' + (revocationSuccess ? 'successful' : 'may not have completed'));
}

/**
 * Update UI for authenticated user
 */
function updateUIForAuthenticatedUser() {
  console.log('Updating UI for authenticated user');
  
  // Update menu display
  if (loginBtn) loginBtn.style.display = 'none';
  if (userProfile) userProfile.style.display = 'flex';
  
  // Update profile info
  if (userAvatar && userData && userData.picture) {
    userAvatar.src = userData.picture || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(userData.name || 'User');
  }
  if (userName && userData) {
    userName.textContent = userData.name || 'User';
  }
  
  // Show app, hide auth section
  if (authSection) authSection.style.display = 'none';
  if (appSection) appSection.style.display = 'block';
  
  // Dispatch event that user is authenticated
  window.dispatchEvent(new CustomEvent('userAuthenticated', { detail: userData }));
}

/**
 * Update UI for unauthenticated user
 */
function updateUIForUnauthenticatedUser() {
  console.log('Updating UI for unauthenticated user');
  
  // Update menu display
  if (loginBtn) loginBtn.style.display = 'block';
  if (userProfile) userProfile.style.display = 'none';
  
  // Show auth section, hide app
  if (authSection) authSection.style.display = 'flex';
  if (appSection) appSection.style.display = 'none';
  
  // Reset user avatar and name if they exist
  if (userAvatar) userAvatar.src = '';
  if (userName) userName.textContent = '';
  
  // Dispatch event that user is not authenticated
  window.dispatchEvent(new CustomEvent('userSignedOut'));
}

/**
 * Clear all authentication data
 */
function clearAuthData() {
  // Clear auth state
  isSignedIn = false;
  userData = null;
  
  // Clear localStorage
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
  localStorage.removeItem(STORAGE_KEYS.USER_DATA);
}

/**
 * Check if the user is authenticated
 * @returns {boolean} True if authenticated, false otherwise
 */
export async function checkAuthStatus() {
  // If we're already signed in, return true
  if (isSignedIn && userData) {
    return true;
  }
  
  // Check for tokens in localStorage
  const storedToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const storedExpiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
  const storedUserData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
  
  // If no token or userData, not authenticated
  if (!storedToken || !storedUserData) {
    console.log('No stored tokens or user data found');
    return false;
  }
  
  // Parse the stored user data
  try {
    userData = JSON.parse(storedUserData);
  } catch (error) {
    console.error('Error parsing stored user data:', error);
    clearAuthData();
    return false;
  }
  
  // Check if token has expired
  if (storedExpiry && parseInt(storedExpiry, 10) < Date.now()) {
    console.log('Token has expired, user needs to log in again');
    clearAuthData();
    return false;
  }
  
  // Token is valid, restore session state
  console.log('Valid token found, restoring session');
  isSignedIn = true;
  
  return true;
}

// REAL IMPLEMENTATION TO COME:
// 1. Replace with Google OAuth 2.0 flow
// 2. Add token validation and refresh handling
// 3. Implement proper session management 