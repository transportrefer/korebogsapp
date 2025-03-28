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
  REFRESH_TOKEN: 'auth_refresh_token',
  TOKEN_EXPIRY: 'auth_token_expiry',
  USER_DATA: 'auth_user_data',
  DEVICE_ID: 'auth_device_id'
};

// Cookie name for persistent device recognition
const DEVICE_COOKIE_NAME = 'kb_device_recognized';
const DEVICE_COOKIE_DAYS = 30; // Cookie expires after 30 days

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
  loginBtn?.addEventListener('click', handleLogin);
  loginMainBtn?.addEventListener('click', handleLogin);
  logoutBtn?.addEventListener('click', handleLogout);
  
  // Load the Google Identity Services
  await loadGoogleIdentityServices();
  
  // Check if device is recognized
  const isDeviceRecognized = checkDeviceCookie();
  
  // Check if we have stored tokens and restore session
  const authStatus = await checkAuthStatus();
  console.log('Initial auth status check:', authStatus ? 'Authenticated' : 'Not authenticated');
  
  // If authenticated, make sure UI is updated correctly
  if (authStatus && userData) {
    updateUIForAuthenticatedUser();
    
    // Set device cookie if not already set
    if (!isDeviceRecognized) {
      setDeviceCookie();
    }
    
    // Dispatch event that user is authenticated to ensure all components are notified
    window.dispatchEvent(new CustomEvent('userAuthenticated', { detail: userData }));
  } else {
    // Ensure UI is updated if not authenticated
    updateUIForUnauthenticatedUser();
    
    // If device is recognized but not authenticated, try silent sign-in
    if (isDeviceRecognized && !authStatus) {
      trySilentSignIn();
    }
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
        
        // Store tokens
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokenResponse.access_token);
        if (tokenResponse.refresh_token) {
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokenResponse.refresh_token);
        }
        localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
      }
      
      // Get user profile info
      fetchUserProfile(tokenResponse.access_token)
        .then(userInfo => {
          console.log('User profile fetched:', userInfo);
          userData = userInfo;
          isSignedIn = true;
          
          // Store user data for session persistence
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userInfo));
          
          // Set device cookie for persistent recognition
          setDeviceCookie();
          
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
 * Handle callback from OAuth flow
 */
async function handleCallback(code) {
  console.log('Handling OAuth callback with code');
  
  // This functionality is no longer needed as we're using Token Client flow
  console.error('Authorization code flow is not implemented');
  throw new Error('Authorization code flow is not implemented');
}

/**
 * Handle logout button click
 */
async function handleLogout() {
  console.log('Logout clicked');
  
  // Store user email before clearing data
  const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  
  // First update UI state for immediate feedback
  isSignedIn = false;
  userData = null;
  updateUIForUnauthenticatedUser();
  
  // Revoke tokens with Google if possible
  let revocationSuccess = false;
  
  if (google && google.accounts) {
    try {
      // For access tokens, use the revocation endpoint
      if (accessToken) {
        console.log('Attempting to revoke access token');
        try {
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
      }
    } catch (error) {
      console.error('Error during logout process:', error);
    }
  }
  
  // Always clear local storage and cookies
  clearAuthData();
  clearDeviceCookie();
  
  // Dispatch signout event to notify other components
  window.dispatchEvent(new CustomEvent('userSignedOut'));
  
  console.log('Logout complete, revocation ' + (revocationSuccess ? 'successful' : 'may not have completed'));
}

/**
 * Update UI for authenticated user
 */
function updateUIForAuthenticatedUser() {
  console.log('Updating UI for authenticated user');
  console.log('loginBtn:', loginBtn);
  console.log('userProfile:', userProfile);
  console.log('authSection:', authSection);
  console.log('appSection:', appSection);
  
  // Store user data in localStorage for persistence
  if (userData) {
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
  }
  
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
  const storedRefreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
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
    console.log('Token has expired');
    
    // Token has expired - clearing auth data
    clearAuthData();
    updateUIForUnauthenticatedUser();
    
    // Show expired session message to user
    showSessionExpiredMessage();
    return false;
  }
  
  // Token is valid, restore session state
  console.log('Valid token found, restoring session');
  isSignedIn = true;
  
  // Update UI if needed (may be called before UI elements exist)
  if (userProfile && loginBtn) {
    updateUIForAuthenticatedUser();
  }
  
  return true;
}

/**
 * Show a message to the user that their session has expired
 */
function showSessionExpiredMessage() {
  showMessage('Din session er udløbet. Log venligst ind igen.', 'error');
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
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
  localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  
  // Store last email for hint if available
  if (userData?.email) {
    localStorage.setItem('last_email', userData.email);
  }
}

/**
 * Set a persistent cookie to recognize this device
 */
function setDeviceCookie() {
  const deviceId = generateDeviceId();
  localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
  
  // Set cookie that expires in X days
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + DEVICE_COOKIE_DAYS);
  
  // Set secure httpOnly cookie if on HTTPS, otherwise regular cookie
  const secure = window.location.protocol === 'https:' ? '; secure' : '';
  document.cookie = `${DEVICE_COOKIE_NAME}=${deviceId}; expires=${expiryDate.toUTCString()}; path=/${secure}; SameSite=Lax`;
  
  console.log('Device cookie set, expires:', expiryDate.toUTCString());
}

/**
 * Check if device cookie exists
 * @returns {boolean} True if device is recognized
 */
function checkDeviceCookie() {
  const cookies = document.cookie.split(';');
  const deviceCookie = cookies.find(cookie => cookie.trim().startsWith(`${DEVICE_COOKIE_NAME}=`));
  
  if (deviceCookie) {
    const deviceId = deviceCookie.split('=')[1];
    console.log('Device recognized from cookie');
    return true;
  }
  
  return false;
}

/**
 * Clear device recognition cookie
 */
function clearDeviceCookie() {
  // Set cookie with past expiry to delete it
  document.cookie = `${DEVICE_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  localStorage.removeItem(STORAGE_KEYS.DEVICE_ID);
  console.log('Device cookie cleared');
}

/**
 * Generate a unique device ID
 * @returns {string} Device ID
 */
function generateDeviceId() {
  return 'device_' + Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Try to sign in silently (without user interaction)
 * This is used when device is recognized but token has expired
 */
function trySilentSignIn() {
  if (!tokenClient) {
    console.error('Token client not initialized');
    return;
  }
  
  console.log('Attempting silent sign-in for recognized device');
  
  // Show a gentle notification that we're trying to restore session
  showMessage('Gendanner din session...', 'info');
  
  // Request access token without user interaction if possible
  tokenClient.requestAccessToken({ 
    prompt: 'none',
    hint: localStorage.getItem('last_email') || '' // Optional: provide hint if available
  });
}

/**
 * Show a message to the user
 * @param {string} message - Message to display
 * @param {string} type - Message type (error, info, success)
 */
function showMessage(message, type = 'error') {
  // Try to find or create a container for the message
  let messageContainer = document.getElementById('auth-message-container');
  
  if (!messageContainer) {
    messageContainer = document.createElement('div');
    messageContainer.id = 'auth-message-container';
    document.body.appendChild(messageContainer);
  }
  
  // Set style based on message type
  let backgroundColor, textColor;
  
  switch (type) {
    case 'error':
      backgroundColor = '#f8d7da';
      textColor = '#721c24';
      break;
    case 'info':
      backgroundColor = '#d1ecf1';
      textColor = '#0c5460';
      break;
    case 'success':
      backgroundColor = '#d4edda';
      textColor = '#155724';
      break;
    default:
      backgroundColor = '#f8d7da';
      textColor = '#721c24';
  }
  
  messageContainer.style.cssText = `position: fixed; top: 20px; left: 50%; transform: translateX(-50%); 
    background-color: ${backgroundColor}; color: ${textColor}; padding: 10px 20px; 
    border-radius: 5px; z-index: 1000; box-shadow: 0 2px 5px rgba(0,0,0,0.2);`;
  
  messageContainer.textContent = message;
  
  // Remove the message after 5 seconds
  setTimeout(() => {
    if (messageContainer && messageContainer.parentNode) {
      messageContainer.parentNode.removeChild(messageContainer);
    }
  }, 5000);
}

// REAL IMPLEMENTATION TO COME:
// 1. Replace with Google OAuth 2.0 flow
// 2. Add token validation and refresh handling
// 3. Implement proper session management 