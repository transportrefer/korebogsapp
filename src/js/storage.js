/**
 * Storage Module
 * Handles local storage and Google Sheets integration
 */

// Configuration
const STORAGE_CONFIG = {
  localStorageKeys: {
    drivesData: 'kørebogsApp_kørselsData',
    frequentAddresses: 'kørebogsApp_oftebesøgteAdresser',
    settings: 'kørebogsApp_indstillinger',
  },
  defaultSettings: {
    standardSats: 3.79,
    standardStartAdresse: '',
    googleSheetsId: '',
    visAdvarselVed60DagesReglen: true
  }
};

// In-memory cache
let drivesCache = [];
let frequentAddressesCache = [];
let settingsCache = null;

// MOCK IMPLEMENTATION: To be replaced with real Google Sheets API integration

// Default rate for mileage reimbursement in DKK per km
const DEFAULT_RATE = 3.79;

// Local cache of trips
let cachedTrips = [];

/**
 * Initialize the storage module
 * @returns {Object} Storage module interface
 */
export async function initializeStorage() {
  console.log('Initializing Storage Module...');
  
  // Load data from localStorage
  loadFromLocalStorage();
  
  // Return public API
  return {
    // Drives data
    getDrives: () => [...drivesCache],
    saveDrive: saveDrive,
    updateDrive: updateDrive,
    deleteDrive: deleteDrive,
    
    // Frequent addresses
    getFrequentAddresses: () => [...frequentAddressesCache],
    saveFrequentAddress: saveFrequentAddress,
    deleteFrequentAddress: deleteFrequentAddress,
    
    // Settings
    getSettings: () => ({...settingsCache}),
    updateSettings: updateSettings,
    
    // Google Sheets
    syncToGoogleSheets: mockSyncToGoogleSheets,
    getSyncStatus: () => ({
      lastSync: localStorage.getItem('kørebogsApp_lastSync') || null,
      pendingChanges: drivesCache.filter(drive => !drive.synkroniseret).length
    })
  };
}

/**
 * Load all data from localStorage
 */
function loadFromLocalStorage() {
  try {
    // Load drives data
    const drivesJson = localStorage.getItem(STORAGE_CONFIG.localStorageKeys.drivesData);
    drivesCache = drivesJson ? JSON.parse(drivesJson) : [];
    
    // Load frequent addresses
    const addressesJson = localStorage.getItem(STORAGE_CONFIG.localStorageKeys.frequentAddresses);
    frequentAddressesCache = addressesJson ? JSON.parse(addressesJson) : [];
    
    // Load settings
    const settingsJson = localStorage.getItem(STORAGE_CONFIG.localStorageKeys.settings);
    settingsCache = settingsJson 
      ? {...STORAGE_CONFIG.defaultSettings, ...JSON.parse(settingsJson)} 
      : {...STORAGE_CONFIG.defaultSettings};
      
    console.log('Loaded data from localStorage:', { 
      drives: drivesCache.length, 
      addresses: frequentAddressesCache.length 
    });
  } catch (error) {
    console.error('Error loading data from localStorage:', error);
    // Initialize with empty data on error
    drivesCache = [];
    frequentAddressesCache = [];
    settingsCache = {...STORAGE_CONFIG.defaultSettings};
  }
}

/**
 * Save drives data to localStorage
 */
function saveDrivesToLocalStorage() {
  localStorage.setItem(STORAGE_CONFIG.localStorageKeys.drivesData, JSON.stringify(drivesCache));
}

/**
 * Save frequent addresses to localStorage
 */
function saveAddressesToLocalStorage() {
  localStorage.setItem(STORAGE_CONFIG.localStorageKeys.frequentAddresses, JSON.stringify(frequentAddressesCache));
}

/**
 * Save settings to localStorage
 */
function saveSettingsToLocalStorage() {
  localStorage.setItem(STORAGE_CONFIG.localStorageKeys.settings, JSON.stringify(settingsCache));
}

/**
 * Save a new drive record
 * @param {Object} driveData - The drive data to save
 * @returns {Object} The saved drive with ID
 */
function saveDrive(driveData) {
  const newDrive = {
    ...driveData,
    id: `drive-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    synkroniseret: false,
    tidspunktOprettet: new Date().toISOString()
  };
  
  drivesCache.push(newDrive);
  saveDrivesToLocalStorage();
  
  return newDrive;
}

/**
 * Update an existing drive
 * @param {string} id - ID of the drive to update
 * @param {Object} driveData - New drive data
 * @returns {Object|null} Updated drive or null if not found
 */
function updateDrive(id, driveData) {
  const index = drivesCache.findIndex(drive => drive.id === id);
  if (index === -1) return null;
  
  // Mark as not synchronized if it was previously synchronized
  const wasSync = drivesCache[index].synkroniseret;
  
  // Update the drive
  drivesCache[index] = {
    ...drivesCache[index],
    ...driveData,
    synkroniseret: false // Mark as needing sync
  };
  
  saveDrivesToLocalStorage();
  return drivesCache[index];
}

/**
 * Delete a drive
 * @param {string} id - ID of the drive to delete
 * @returns {boolean} Success status
 */
function deleteDrive(id) {
  const index = drivesCache.findIndex(drive => drive.id === id);
  if (index === -1) return false;
  
  drivesCache.splice(index, 1);
  saveDrivesToLocalStorage();
  
  return true;
}

/**
 * Save a frequent address
 * @param {Object} addressData - The address data to save
 * @returns {Object} The saved address with ID
 */
function saveFrequentAddress(addressData) {
  // Check if the address already exists
  const existingIndex = frequentAddressesCache.findIndex(
    addr => addr.adresse === addressData.adresse
  );
  
  if (existingIndex !== -1) {
    // Update existing address
    frequentAddressesCache[existingIndex] = {
      ...frequentAddressesCache[existingIndex],
      beskrivelse: addressData.beskrivelse || frequentAddressesCache[existingIndex].beskrivelse,
      sidstBesøgt: new Date().toISOString().split('T')[0]
    };
    
    saveAddressesToLocalStorage();
    return frequentAddressesCache[existingIndex];
  }
  
  // Add new address
  const newAddress = {
    ...addressData,
    id: `addr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    sidstBesøgt: new Date().toISOString().split('T')[0]
  };
  
  frequentAddressesCache.push(newAddress);
  saveAddressesToLocalStorage();
  
  return newAddress;
}

/**
 * Delete a frequent address
 * @param {string} id - ID of the address to delete
 * @returns {boolean} Success status
 */
function deleteFrequentAddress(id) {
  const index = frequentAddressesCache.findIndex(addr => addr.id === id);
  if (index === -1) return false;
  
  frequentAddressesCache.splice(index, 1);
  saveAddressesToLocalStorage();
  
  return true;
}

/**
 * Update app settings
 * @param {Object} newSettings - New settings to apply
 * @returns {Object} Updated settings
 */
function updateSettings(newSettings) {
  settingsCache = {
    ...settingsCache,
    ...newSettings
  };
  
  saveSettingsToLocalStorage();
  return settingsCache;
}

/**
 * Mock function to sync data to Google Sheets
 * @returns {Promise<{success: boolean, syncedCount: number, errors: Array}>}
 */
async function mockSyncToGoogleSheets() {
  console.log('Mock syncing data to Google Sheets');
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Find unsynchronized drives
  const unsyncedDrives = drivesCache.filter(drive => !drive.synkroniseret);
  console.log(`Mock syncing ${unsyncedDrives.length} unsynced drives`);
  
  // Simulate successful sync
  for (const drive of unsyncedDrives) {
    drive.synkroniseret = true;
  }
  
  saveDrivesToLocalStorage();
  localStorage.setItem('kørebogsApp_lastSync', new Date().toISOString());
  
  return {
    success: true,
    syncedCount: unsyncedDrives.length,
    errors: []
  };
}

/**
 * TODO: Implement actual Google Sheets integration
 * Steps:
 * 1. Use Google Sheets API to append rows
 * 2. Handle authentication and token management
 * 3. Implement error handling and retry logic
 * 4. Track synchronization status
 */

/**
 * Initialize the storage module
 */
export function initStorage() {
  console.log('Initializing storage module (MOCK VERSION)');
  
  // Load trips from localStorage
  loadFromLocalStorage();
  
  return {
    saveTrip,
    getTrips,
    deleteTrip,
    updateTrip,
    getFavoriteAddresses,
    saveSettings,
    getSettings,
    syncToCloud
  };
}

/**
 * Save a trip to storage
 * @param {Object} tripData - The trip data to save
 * @returns {Promise<Object>} The saved trip with ID
 */
export async function saveTrip(tripData) {
  console.log('Saving trip (MOCK VERSION):', tripData);
  
  // Generate a unique ID
  const id = 'trip-' + Date.now();
  
  // Create trip object with additional metadata
  const trip = {
    ...tripData,
    id,
    synced: false,
    createdAt: new Date().toISOString()
  };
  
  // Add to cache
  cachedTrips.push(trip);
  
  // Save to localStorage
  saveToLocalStorage();
  
  // In real implementation, we would attempt to sync to Google Sheets here
  // For now, just simulate a delay and mark as synced
  await new Promise(resolve => setTimeout(resolve, 500));
  trip.synced = true;
  saveToLocalStorage();
  
  return trip;
}

/**
 * Get all saved trips
 * @param {Object} options - Query options (sorting, filtering)
 * @returns {Promise<Array>} List of trips
 */
export async function getTrips(options = {}) {
  console.log('Getting trips (MOCK VERSION):', options);
  
  // Return cached trips
  let trips = [...cachedTrips];
  
  // Apply sorting if specified
  if (options.sort) {
    trips.sort((a, b) => {
      // Sort by date in descending order (newest first)
      if (options.sort === 'date') {
        return new Date(b.date) - new Date(a.date);
      }
      return 0;
    });
  }
  
  // Apply filtering if specified
  if (options.filter) {
    if (options.filter.date) {
      const filterDate = new Date(options.filter.date);
      trips = trips.filter(trip => {
        const tripDate = new Date(trip.date);
        return tripDate.toDateString() === filterDate.toDateString();
      });
    }
  }
  
  return trips;
}

/**
 * Delete a trip by ID
 * @param {string} tripId - ID of the trip to delete
 * @returns {Promise<boolean>} Success indicator
 */
export async function deleteTrip(tripId) {
  console.log('Deleting trip (MOCK VERSION):', tripId);
  
  // Find the index of the trip
  const index = cachedTrips.findIndex(trip => trip.id === tripId);
  
  if (index !== -1) {
    // Remove the trip from the array
    cachedTrips.splice(index, 1);
    
    // Save to localStorage
    saveToLocalStorage();
    
    // In real implementation, we would delete from Google Sheets here
    return true;
  }
  
  return false;
}

/**
 * Update an existing trip
 * @param {string} tripId - ID of the trip to update
 * @param {Object} tripData - New trip data
 * @returns {Promise<Object>} Updated trip
 */
export async function updateTrip(tripId, tripData) {
  console.log('Updating trip (MOCK VERSION):', tripId, tripData);
  
  // Find the trip
  const index = cachedTrips.findIndex(trip => trip.id === tripId);
  
  if (index !== -1) {
    // Update the trip
    cachedTrips[index] = {
      ...cachedTrips[index],
      ...tripData,
      synced: false,
      updatedAt: new Date().toISOString()
    };
    
    // Save to localStorage
    saveToLocalStorage();
    
    // In real implementation, we would update in Google Sheets here
    // For now, just simulate a delay and mark as synced
    await new Promise(resolve => setTimeout(resolve, 500));
    cachedTrips[index].synced = true;
    saveToLocalStorage();
    
    return cachedTrips[index];
  }
  
  throw new Error('Trip not found');
}

/**
 * Get favorite/frequently used addresses
 * @returns {Promise<Array>} List of addresses
 */
export async function getFavoriteAddresses() {
  console.log('Getting favorite addresses (MOCK VERSION)');
  
  // In real implementation, this would analyze past trips and return frequently used addresses
  // For now, return mock data
  
  // Load from localStorage
  const storedAddresses = localStorage.getItem('favoriteAddresses');
  if (storedAddresses) {
    return JSON.parse(storedAddresses);
  }
  
  // Default mock addresses
  const mockAddresses = [
    {
      id: 'addr-1',
      address: 'Rådhuspladsen 1, 1550 København',
      description: 'Københavns Rådhus',
      lastUsed: new Date().toISOString()
    },
    {
      id: 'addr-2',
      address: 'Tivoli, Vesterbrogade 3, 1630 København',
      description: 'Tivoli',
      lastUsed: '2023-01-15T12:30:00.000Z'
    }
  ];
  
  // Save to localStorage
  localStorage.setItem('favoriteAddresses', JSON.stringify(mockAddresses));
  
  return mockAddresses;
}

/**
 * Save user settings
 * @param {Object} settings - User settings to save
 * @returns {Promise<Object>} Saved settings
 */
export async function saveSettings(settings) {
  console.log('Saving settings (MOCK VERSION):', settings);
  
  // Merge with existing settings
  const existingSettings = await getSettings();
  const newSettings = { ...existingSettings, ...settings };
  
  // Save to localStorage
  localStorage.setItem('userSettings', JSON.stringify(newSettings));
  
  return newSettings;
}

/**
 * Get user settings
 * @returns {Promise<Object>} User settings
 */
export async function getSettings() {
  console.log('Getting settings (MOCK VERSION)');
  
  // Load from localStorage
  const storedSettings = localStorage.getItem('userSettings');
  if (storedSettings) {
    return JSON.parse(storedSettings);
  }
  
  // Default settings
  const defaultSettings = {
    defaultRate: DEFAULT_RATE,
    defaultStartAddress: '',
    showRoundTripOption: true,
    sheetsId: ''
  };
  
  // Save to localStorage
  localStorage.setItem('userSettings', JSON.stringify(defaultSettings));
  
  return defaultSettings;
}

/**
 * Synchronize local data to cloud (Google Sheets)
 * @returns {Promise<Object>} Sync result
 */
export async function syncToCloud() {
  console.log('Syncing to cloud (MOCK VERSION)');
  
  // Find unsynced trips
  const unsyncedTrips = cachedTrips.filter(trip => !trip.synced);
  
  // In real implementation, this would upload to Google Sheets
  // For now, just mark all as synced after a delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mark all trips as synced
  unsyncedTrips.forEach(trip => {
    const index = cachedTrips.findIndex(t => t.id === trip.id);
    if (index !== -1) {
      cachedTrips[index].synced = true;
    }
  });
  
  // Save to localStorage
  saveToLocalStorage();
  
  return {
    success: true,
    syncedCount: unsyncedTrips.length,
    total: cachedTrips.length
  };
}

// Helper function to save to localStorage
function saveToLocalStorage() {
  try {
    localStorage.setItem('trips', JSON.stringify(cachedTrips));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

// Helper function to load from localStorage
function loadFromLocalStorage() {
  try {
    const storedTrips = localStorage.getItem('trips');
    if (storedTrips) {
      cachedTrips = JSON.parse(storedTrips);
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    cachedTrips = [];
  }
}

// REAL IMPLEMENTATION TO COME:
// 1. Replace with actual Google Sheets API integration
// 2. Implement proper offline/online sync
// 3. Add error handling and retry logic

/**
 * TODO: Implement actual Google Sheets integration
 * Steps:
 * 1. Use Google Sheets API to append rows
 * 2. Handle authentication and token management
 * 3. Implement error handling and retry logic
 * 4. Track synchronization status
 */ 