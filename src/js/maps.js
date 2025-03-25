/**
 * Maps Module
 * Handles Google Maps integration and distance calculations
 */

// Configuration for Google Maps
const MAPS_CONFIG = {
  apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
};

let googleMapsLoaded = false;
let googleMapsAPI = null;
let autocompleteService = null;
let distanceMatrixService = null;
let geocoder = null;

/**
 * Initialize the maps module
 * @returns {Object} Maps module interface
 */
export async function initMaps() {
  console.log('Initializing maps module');
  
  try {
    await loadGoogleMapsAPI();
    console.log('Google Maps API loaded successfully');
    
    // Initialize services
    if (window.google && window.google.maps) {
      distanceMatrixService = new google.maps.DistanceMatrixService();
      geocoder = new google.maps.Geocoder();
      autocompleteService = new google.maps.places.AutocompleteService();
      
      googleMapsLoaded = true;
    }
    
    return {
      calculateDistance,
      getUserLocation,
      autocompleteAddress,
      isLoaded: () => googleMapsLoaded
    };
  } catch (error) {
    console.error('Error initializing Google Maps:', error);
    return {
      calculateDistance: mockCalculateDistance,
      getUserLocation: mockGetUserLocation,
      autocompleteAddress: mockAutocompleteAddress,
      isLoaded: () => false
    };
  }
}

/**
 * Load the Google Maps API
 * @returns {Promise} Promise that resolves when the API is loaded
 */
function loadGoogleMapsAPI() {
  return new Promise((resolve, reject) => {
    // Check if API is already loaded
    if (window.google && window.google.maps) {
      googleMapsLoaded = true;
      resolve();
      return;
    }
    
    // Create script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_CONFIG.apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      googleMapsLoaded = true;
      resolve();
    };
    
    script.onerror = (error) => {
      console.error('Google Maps API failed to load:', error);
      reject(error);
    };
    
    document.head.appendChild(script);
  });
}

/**
 * Calculate distance between two addresses
 * @param {string} originAddress - The starting address
 * @param {string} destinationAddress - The destination address
 * @returns {Promise<Object>} Object containing distance in km and estimated duration
 */
export async function calculateDistance(originAddress, destinationAddress) {
  console.log(`Calculating distance from "${originAddress}" to "${destinationAddress}"`);
  
  if (!googleMapsLoaded || !distanceMatrixService) {
    return mockCalculateDistance(originAddress, destinationAddress);
  }
  
  try {
    const response = await new Promise((resolve, reject) => {
      distanceMatrixService.getDistanceMatrix(
        {
          origins: [originAddress],
          destinations: [destinationAddress],
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC
        },
        (response, status) => {
          if (status === 'OK') {
            resolve(response);
          } else {
            reject(new Error(`Distance Matrix request failed with status: ${status}`));
          }
        }
      );
    });
    
    // Extract distance and duration from response
    if (response.rows[0].elements[0].status === 'OK') {
      const element = response.rows[0].elements[0];
      
      return {
        distance: element.distance.value / 1000, // Convert meters to kilometers
        duration: Math.round(element.duration.value / 60), // Convert seconds to minutes
        distanceText: element.distance.text,
        durationText: element.duration.text,
        status: 'OK'
      };
    } else {
      throw new Error(`Route calculation failed with status: ${response.rows[0].elements[0].status}`);
    }
  } catch (error) {
    console.error('Error calculating distance:', error);
    return mockCalculateDistance(originAddress, destinationAddress);
  }
}

/**
 * Get the user's current location using browser geolocation
 * @returns {Promise<Object>} Object containing lat/lng and formatted address
 */
export async function getUserLocation() {
  console.log('Getting user location');
  
  try {
    // First get the browser geolocation
    const position = await new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      });
    });
    
    const { latitude, longitude } = position.coords;
    
    // If Maps API is not loaded, return just the coordinates
    if (!googleMapsLoaded || !geocoder) {
      return {
        coords: { latitude, longitude },
        formattedAddress: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
      };
    }
    
    // Otherwise, reverse geocode to get the address
    const response = await new Promise((resolve, reject) => {
      geocoder.geocode(
        { location: { lat: latitude, lng: longitude } },
        (results, status) => {
          if (status === 'OK' && results[0]) {
            resolve(results);
          } else {
            reject(new Error(`Geocoding failed with status: ${status}`));
          }
        }
      );
    });
    
    return {
      coords: { latitude, longitude },
      formattedAddress: response[0].formatted_address
    };
  } catch (error) {
    console.error('Error getting user location:', error);
    return mockGetUserLocation();
  }
}

/**
 * Set up address autocomplete
 * @param {HTMLInputElement} inputElement - The input element for autocomplete
 * @param {Function} onSelect - Callback when address is selected
 */
export function autocompleteAddress(inputElement, onSelect) {
  console.log('Setting up address autocomplete');
  
  if (!googleMapsLoaded || !window.google || !window.google.maps) {
    return mockAutocompleteAddress(inputElement, onSelect);
  }
  
  // Create the autocomplete object
  const autocomplete = new google.maps.places.Autocomplete(inputElement, {
    types: ['address'],
    componentRestrictions: { country: 'dk' } // Restrict to Denmark
  });
  
  // Listen for place selection
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    
    if (place && place.formatted_address) {
      if (onSelect) {
        onSelect(place.formatted_address);
      }
    }
  });
}

// Mock implementations for fallback when Google Maps is not available

function mockCalculateDistance(originAddress, destinationAddress) {
  console.log(`Using mock distance calculation from "${originAddress}" to "${destinationAddress}"`);
  
  // Generate a somewhat realistic distance (10-100km)
  const distance = (Math.random() * 90 + 10).toFixed(1);
  const duration = Math.round(distance * 1.2); // Roughly 1.2 minutes per km
  
  return {
    distance: parseFloat(distance), // In kilometers
    duration: duration, // In minutes
    distanceText: `${distance} km`,
    durationText: `${duration} min`,
    status: 'OK'
  };
}

function mockGetUserLocation() {
  console.log('Using mock user location');
  
  return {
    coords: {
      latitude: 55.676098,
      longitude: 12.568337
    },
    formattedAddress: 'Rådhuspladsen 1, 1550 København'
  };
}

function mockAutocompleteAddress(inputElement, onSelect) {
  console.log('Using mock address autocomplete');
  
  // Mock implementation with some sample addresses
  const mockAddresses = [
    'Rådhuspladsen 1, 1550 København',
    'Tivoli, Vesterbrogade 3, 1630 København',
    'Nørreport Station, København',
    'Kongens Nytorv, København',
    'Amagertorv 1, 1160 København',
    'Trianglen, 2100 København Ø',
    'Fisketorvet, Kalvebod Brygge 59, 1560 København'
  ];
  
  // Simple mock functionality: show dropdown after typing
  inputElement.addEventListener('input', () => {
    // Remove any existing dropdown
    const existingDropdown = document.getElementById('mock-dropdown');
    if (existingDropdown) {
      existingDropdown.remove();
    }
    
    // If the input has content, show suggestions
    if (inputElement.value.length > 0) {
      // Filter addresses by what's been typed
      const filteredAddresses = mockAddresses.filter(addr => 
        addr.toLowerCase().includes(inputElement.value.toLowerCase())
      );
      
      // Create and display dropdown
      if (filteredAddresses.length > 0) {
        const dropdown = document.createElement('div');
        dropdown.id = 'mock-dropdown';
        dropdown.style.position = 'absolute';
        dropdown.style.width = `${inputElement.offsetWidth}px`;
        dropdown.style.maxHeight = '200px';
        dropdown.style.overflowY = 'auto';
        dropdown.style.background = 'white';
        dropdown.style.border = '1px solid #ddd';
        dropdown.style.borderTop = 'none';
        dropdown.style.zIndex = '1000';
        
        filteredAddresses.forEach(address => {
          const item = document.createElement('div');
          item.textContent = address;
          item.style.padding = '8px 12px';
          item.style.cursor = 'pointer';
          
          item.addEventListener('mouseover', () => {
            item.style.backgroundColor = '#f2f2f2';
          });
          
          item.addEventListener('mouseout', () => {
            item.style.backgroundColor = 'white';
          });
          
          item.addEventListener('click', () => {
            inputElement.value = address;
            dropdown.remove();
            if (onSelect) onSelect(address);
          });
          
          dropdown.appendChild(item);
        });
        
        // Position the dropdown
        const rect = inputElement.getBoundingClientRect();
        dropdown.style.top = `${rect.bottom}px`;
        dropdown.style.left = `${rect.left}px`;
        
        document.body.appendChild(dropdown);
      }
    }
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (e.target !== inputElement) {
      const dropdown = document.getElementById('mock-dropdown');
      if (dropdown) {
        dropdown.remove();
      }
    }
  });
}

/**
 * TODO: Implement actual Google Maps integration
 * Steps:
 * 1. Load Google Maps API
 * 2. Initialize with proper credentials
 * 3. Implement distance matrix calculations
 * 4. Implement geocoding for address search
 * 5. Implement geolocation for current position
 */ 