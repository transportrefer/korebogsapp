/**
 * Authentication Module
 * Handles Google OAuth authentication
 */

// Configuration for Google OAuth
// These values will need to be updated with your Google Cloud Console values
const AUTH_CONFIG = {
  clientId: 'YOUR_CLIENT_ID.apps.googleusercontent.com', // Replace with your client ID
  apiKey: 'YOUR_API_KEY', // Replace with your API key
  scopes: [
    'https://www.googleapis.com/auth/drive.file', // For Google Sheets
    'https://www.googleapis.com/auth/spreadsheets', // For Google Sheets
  ]
};

// Auth state
let googleAuth = null;
let isSignedIn = false;
let userData = null;

// MOCK IMPLEMENTATION: To be replaced with real Google OAuth integration
// This file will be modified when Google OAuth credentials are available

// DOM elements for authentication
let loginBtn;
let loginMainBtn;
let logoutBtn;
let authSection;
let appSection;
let userProfile;
let userAvatar;
let userName;

// Mock user state
let currentUser = null;

/**
 * Initialize the authentication module
 */
export async function initAuth() {
  console.log('Initializing auth module (MOCK VERSION)');
  
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
  
  // Check for existing session (in real implementation, this would verify the token)
  const savedUser = localStorage.getItem('mockUser');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    updateUIForAuthenticatedUser();
  } else {
    updateUIForUnauthenticatedUser();
  }
  
  loginBtn.style.display = 'block';
  
  return {
    isAuthenticated: () => !!currentUser,
    getCurrentUser: () => currentUser,
    login: handleLogin,
    logout: handleLogout
  };
}

/**
 * Check if the user is authenticated
 * @returns {boolean} True if authenticated, false otherwise
 */
export async function checkAuthStatus() {
  // In the real implementation, this would check if the OAuth token is valid
  return !!currentUser;
}

/**
 * Handle login button click
 */
async function handleLogin() {
  console.log('Login clicked (MOCK VERSION)');
  
  // In the real version, this would redirect to Google OAuth
  // For now, we'll create a mock user
  currentUser = {
    id: 'mock-user-123',
    name: 'Test Bruger',
    email: 'test@example.com',
    avatarUrl: 'https://ui-avatars.com/api/?name=Test+Bruger&background=random'
  };
  
  // Save to local storage
  localStorage.setItem('mockUser', JSON.stringify(currentUser));
  
  // Update UI
  updateUIForAuthenticatedUser();
  
  // Return the mock user
  return currentUser;
}

/**
 * Handle logout button click
 */
async function handleLogout() {
  console.log('Logout clicked (MOCK VERSION)');
  
  // Clear user data
  currentUser = null;
  localStorage.removeItem('mockUser');
  
  // Update UI
  updateUIForUnauthenticatedUser();
}

/**
 * Update UI for authenticated user
 */
function updateUIForAuthenticatedUser() {
  // Update menu display
  loginBtn.style.display = 'none';
  userProfile.style.display = 'flex';
  
  // Update profile info
  userAvatar.src = currentUser.avatarUrl;
  userName.textContent = currentUser.name;
  
  // Show app, hide auth section
  authSection.style.display = 'none';
  appSection.style.display = 'block';
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
}

// REAL IMPLEMENTATION TO COME:
// 1. Replace with Google OAuth 2.0 flow
// 2. Add token validation and refresh handling
// 3. Implement proper session management 