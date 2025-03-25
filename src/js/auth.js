/**
 * Authentication Module
 * Handles Google OAuth authentication
 */

// Configuration for Google OAuth
const AUTH_CONFIG = {
  clientId: '129709058864-dmk39lre4jrop8ch05t1taeggmchhoqs.apps.googleusercontent.com',
  apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '', // Will need to be set in your .env file
  scopes: [
    'https://www.googleapis.com/auth/drive.file', // For Google Sheets
    'https://www.googleapis.com/auth/spreadsheets', // For Google Sheets
  ],
  discoveryDocs: [
    'https://sheets.googleapis.com/$discovery/rest?version=v4',
  ]
};

// Auth state
let googleAuth = null;
let isSignedIn = false;
let userData = null;

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
  
  // Load the Google API client
  await loadGoogleAPIClient();
  
  // Set up Google Auth
  await initGoogleAuth();
  
  return {
    isAuthenticated: () => isSignedIn,
    getCurrentUser: () => userData,
    login: handleLogin,
    logout: handleLogout
  };
}

/**
 * Load the Google API client script
 */
function loadGoogleAPIClient() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      gapi.load('client:auth2', resolve);
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

/**
 * Initialize Google Auth
 */
async function initGoogleAuth() {
  try {
    await gapi.client.init({
      apiKey: AUTH_CONFIG.apiKey,
      clientId: AUTH_CONFIG.clientId,
      discoveryDocs: AUTH_CONFIG.discoveryDocs,
      scope: AUTH_CONFIG.scopes.join(' ')
    });
    
    // Get the GoogleAuth instance
    googleAuth = gapi.auth2.getAuthInstance();
    
    // Update sign-in state listeners
    isSignedIn = googleAuth.isSignedIn.get();
    googleAuth.isSignedIn.listen(updateSigninStatus);
    
    // Handle the initial sign-in state
    updateSigninStatus(isSignedIn);
    
    return googleAuth;
  } catch (error) {
    console.error('Error initializing Google Auth:', error);
    throw error;
  }
}

/**
 * Check if the user is authenticated
 * @returns {boolean} True if authenticated, false otherwise
 */
export async function checkAuthStatus() {
  if (!googleAuth) {
    try {
      await initGoogleAuth();
    } catch (error) {
      console.error('Error checking auth status:', error);
      return false;
    }
  }
  return googleAuth.isSignedIn.get();
}

/**
 * Update sign-in status based on current state
 * @param {boolean} isSignedIn - Whether user is signed in
 */
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    // User is signed in
    const user = googleAuth.currentUser.get();
    const profile = user.getBasicProfile();
    
    userData = {
      id: profile.getId(),
      name: profile.getName(),
      email: profile.getEmail(),
      avatarUrl: profile.getImageUrl()
    };
    
    updateUIForAuthenticatedUser();
  } else {
    // User is signed out
    userData = null;
    updateUIForUnauthenticatedUser();
  }
}

/**
 * Handle login button click
 */
async function handleLogin() {
  console.log('Login clicked');
  
  if (!googleAuth) {
    try {
      await initGoogleAuth();
    } catch (error) {
      console.error('Error initializing Google Auth for login:', error);
      return;
    }
  }
  
  try {
    // Check if we have an auth code from the callback
    const authCode = localStorage.getItem('auth_code');
    if (authCode) {
      // We've been redirected back from the OAuth flow
      console.log('Auth code found in storage, exchanging for token');
      
      // Clear the auth code
      localStorage.removeItem('auth_code');
      
      // In a production app, we would exchange the auth code for tokens here
      // For Google OAuth, this is handled by the gapi client library, so we just check
      // if the user is already signed in
      if (!googleAuth.isSignedIn.get()) {
        // If not signed in, start the OAuth flow again
        await startOAuthFlow();
      }
    } else {
      // Start the OAuth flow
      await startOAuthFlow();
    }
  } catch (error) {
    console.error('Error during sign in:', error);
  }
}

/**
 * Start the OAuth flow
 */
async function startOAuthFlow() {
  // Generate a random state value to prevent CSRF attacks
  const state = Math.random().toString(36).substring(2, 15);
  localStorage.setItem('oauth_state', state);
  
  // Get auth URL from Google
  try {
    await googleAuth.signIn();
  } catch (error) {
    console.error('Error starting OAuth flow:', error);
    throw error;
  }
}

/**
 * Handle logout button click
 */
async function handleLogout() {
  console.log('Logout clicked');
  
  if (!googleAuth) {
    return;
  }
  
  try {
    await googleAuth.signOut();
    userData = null;
    updateUIForUnauthenticatedUser();
  } catch (error) {
    console.error('Error during sign out:', error);
  }
}

/**
 * Update UI for authenticated user
 */
function updateUIForAuthenticatedUser() {
  // Update menu display
  loginBtn.style.display = 'none';
  userProfile.style.display = 'flex';
  
  // Update profile info
  userAvatar.src = userData.avatarUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(userData.name);
  userName.textContent = userData.name;
  
  // Show app, hide auth section
  authSection.style.display = 'none';
  appSection.style.display = 'block';
  
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

// REAL IMPLEMENTATION TO COME:
// 1. Replace with Google OAuth 2.0 flow
// 2. Add token validation and refresh handling
// 3. Implement proper session management 