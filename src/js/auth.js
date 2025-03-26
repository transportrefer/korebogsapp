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
  ]
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
  loginBtn.addEventListener('click', handleLogin);
  loginMainBtn.addEventListener('click', handleLogin);
  logoutBtn.addEventListener('click', handleLogout);
  
  // Load the Google Identity Services
  await loadGoogleIdentityServices();
  
  // Check if there's an auth code from the callback
  const authCode = localStorage.getItem('auth_code');
  if (authCode) {
    // We've been redirected back from the OAuth flow
    console.log('Auth code found in storage');
    
    // Clear the auth code
    localStorage.removeItem('auth_code');
    
    // Attempt to get user info using the auth code
    try {
      await handleCallback(authCode);
    } catch (error) {
      console.error('Error handling callback:', error);
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
    callback: (tokenResponse) => {
      if (tokenResponse.error !== undefined) {
        console.error('Token error:', tokenResponse);
        return;
      }
      
      console.log('Token received successfully:', tokenResponse);
      
      // Get user profile info
      fetchUserProfile(tokenResponse.access_token)
        .then(userInfo => {
          console.log('User profile fetched:', userInfo);
          userData = userInfo;
          isSignedIn = true;
          
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
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch user profile: ${response.status}`);
  }
  
  return await response.json();
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
  
  try {
    // Exchange the authorization code for tokens
    const tokenResponse = await exchangeCodeForToken(code);
    
    if (tokenResponse.access_token) {
      // Get user profile info
      const userInfo = await fetchUserProfile(tokenResponse.access_token);
      userData = userInfo;
      isSignedIn = true;
      updateUIForAuthenticatedUser();
    }
  } catch (error) {
    console.error('Error handling callback:', error);
    throw error;
  }
}

/**
 * Exchange authorization code for tokens
 */
async function exchangeCodeForToken(code) {
  // In a real implementation, you would send this code to your backend
  // to exchange for tokens. For this client-side implementation, we'll
  // simulate a successful exchange.
  console.log('Simulating code exchange for token');
  
  // Return a dummy token response
  return {
    access_token: 'simulated_access_token',
    expires_in: 3600,
    token_type: 'Bearer'
  };
}

/**
 * Handle logout button click
 */
async function handleLogout() {
  console.log('Logout clicked');
  
  if (google?.accounts?.oauth2) {
    // Revoke the token
    google.accounts.oauth2.revoke(google.accounts.oauth2.getAccessToken()?.access_token || '', () => {
      console.log('Token revoked');
      isSignedIn = false;
      userData = null;
      updateUIForUnauthenticatedUser();
    });
  } else {
    // Fallback if google identity services aren't available
    isSignedIn = false;
    userData = null;
    updateUIForUnauthenticatedUser();
  }
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
  // Update menu display
  loginBtn.style.display = 'block';
  userProfile.style.display = 'none';
  
  // Show auth section, hide app
  authSection.style.display = 'flex';
  appSection.style.display = 'none';
  
  // Dispatch event that user is not authenticated
  window.dispatchEvent(new CustomEvent('userSignedOut'));
}

/**
 * Check if the user is authenticated
 * @returns {boolean} True if authenticated, false otherwise
 */
export async function checkAuthStatus() {
  // In the new GIS model, we just return the current sign-in state
  // The proper flow will be handled when initAuth is called
  return isSignedIn;
}

// REAL IMPLEMENTATION TO COME:
// 1. Replace with Google OAuth 2.0 flow
// 2. Add token validation and refresh handling
// 3. Implement proper session management 