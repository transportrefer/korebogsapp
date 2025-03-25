/**
 * UI Module
 * Handles all user interface interactions
 */

// Module dependencies
let auth = null;
let maps = null;
let storage = null;

// UI state
let currentView = 'login'; // 'login', 'register', 'history'

// DOM element references
let tripForm;
let dateInput;
let startAddressInput;
let endAddressInput;
let purposeInput;
let roundTripCheckbox;
let calculateBtn;
let saveBtn;
let currentLocationBtn;
let distanceResult;
let distanceSpan;
let amountSpan;
let tripsList;

// Current state
let currentTrip = {
  date: '',
  startAddress: '',
  endAddress: '',
  purpose: '',
  roundTrip: false,
  distance: 0,
  amount: 0
};

// Settings
let settings = {
  defaultRate: 3.79
};

/**
 * Initialize the UI module
 * @param {Object} deps - Module dependencies
 * @param {Object} deps.auth - Auth module
 * @param {Object} deps.maps - Maps module
 * @param {Object} deps.storage - Storage module
 */
export function initializeUI(deps) {
  console.log('Initializing UI Module...');
  
  // Store dependencies
  auth = deps.auth;
  maps = deps.maps;
  storage = deps.storage;
  
  // Initialize UI components
  initAuthUI();
  initRegistrationForm();
  initHistoryView();
  
  // Initial view setup
  updateUIState();
}

/**
 * Initialize authentication UI
 */
function initAuthUI() {
  const authStatus = document.getElementById('auth-status');
  const loginSection = document.getElementById('login-section');
  
  // Create login button if not signed in
  if (!auth.isSignedIn()) {
    loginSection.innerHTML = `
      <div class="auth-container text-center">
        <p class="mt-m">Log ind med din Google-konto for at bruge kørselsregistreringen.</p>
        <button id="login-button" class="mt-m">Log ind med Google</button>
      </div>
    `;
    
    document.getElementById('login-button').addEventListener('click', async () => {
      try {
        const user = await auth.signIn();
        updateUIState();
      } catch (error) {
        showError('Login fejlede', error.message || 'Kunne ikke logge ind. Prøv igen.');
      }
    });
  }
  
  // Update auth status element
  updateAuthStatus();
}

/**
 * Update the auth status UI element
 */
function updateAuthStatus() {
  const authStatus = document.getElementById('auth-status');
  
  if (auth.isSignedIn()) {
    const user = auth.getUserData();
    authStatus.innerHTML = `
      <div class="user-info">
        <span>${user.name}</span>
        <button id="logout-button" class="small">Log ud</button>
      </div>
    `;
    
    document.getElementById('logout-button').addEventListener('click', () => {
      auth.signOut();
      updateUIState();
    });
  } else {
    authStatus.innerHTML = '';
  }
}

/**
 * Initialize the registration form
 */
function initRegistrationForm() {
  const form = document.getElementById('drive-form');
  if (!form) return;
  
  // Get settings for defaults
  const settings = storage.getSettings();
  
  // Build the form
  form.innerHTML = `
    <div class="form-group">
      <label for="drive-date">Dato</label>
      <input type="date" id="drive-date" required value="${new Date().toISOString().split('T')[0]}">
    </div>
    
    <div class="form-group">
      <label for="drive-start">Start adresse</label>
      <div class="address-input-group">
        <input type="text" id="drive-start" required placeholder="Indtast startadresse" 
               value="${settings.standardStartAdresse || ''}">
        <button type="button" id="start-location-btn" class="small">Min position</button>
      </div>
      <div id="start-frequent-addresses" class="frequent-addresses"></div>
    </div>
    
    <div class="form-group">
      <label for="drive-end">Slut adresse</label>
      <div class="address-input-group">
        <input type="text" id="drive-end" required placeholder="Indtast slutadresse">
        <button type="button" id="end-location-btn" class="small">Min position</button>
      </div>
      <div id="end-frequent-addresses" class="frequent-addresses"></div>
    </div>
    
    <div class="form-group">
      <label for="drive-purpose">Formål</label>
      <input type="text" id="drive-purpose" required placeholder="F.eks. Kundemøde">
    </div>
    
    <div class="form-group">
      <label for="drive-rate">Kilometersats (kr.)</label>
      <input type="number" id="drive-rate" step="0.01" min="0" required value="${settings.standardSats}">
    </div>
    
    <div class="form-group">
      <div class="checkbox-group">
        <input type="checkbox" id="drive-roundtrip">
        <label for="drive-roundtrip">Tur/retur</label>
      </div>
    </div>
    
    <div class="form-group">
      <label>Distance</label>
      <div id="distance-result" class="distance-result">
        <span>Beregnet distance: <span id="calculated-distance">-</span> km</span>
        <span>Beløb: <span id="calculated-amount">-</span> kr.</span>
      </div>
    </div>
    
    <div class="form-actions">
      <button type="button" id="calculate-btn">Beregn distance</button>
      <button type="submit" id="save-btn" disabled>Gem kørsel</button>
    </div>
  `;
  
  // Add event listeners
  document.getElementById('calculate-btn').addEventListener('click', calculateDistance);
  document.getElementById('start-location-btn').addEventListener('click', () => setCurrentLocation('start'));
  document.getElementById('end-location-btn').addEventListener('click', () => setCurrentLocation('end'));
  form.addEventListener('submit', saveNewDrive);
  
  // Handle frequent addresses
  displayFrequentAddresses();
}

/**
 * Display frequent addresses for quick selection
 */
function displayFrequentAddresses() {
  const frequentAddresses = storage.getFrequentAddresses();
  if (frequentAddresses.length === 0) return;
  
  const startContainer = document.getElementById('start-frequent-addresses');
  const endContainer = document.getElementById('end-frequent-addresses');
  
  // Sort by last visited date (most recent first)
  const sortedAddresses = [...frequentAddresses].sort((a, b) => 
    new Date(b.sidstBesøgt) - new Date(a.sidstBesøgt)
  ).slice(0, 5); // Show only the 5 most recent
  
  startContainer.innerHTML = '<p class="small-label">Ofte besøgte:</p>';
  endContainer.innerHTML = '<p class="small-label">Ofte besøgte:</p>';
  
  sortedAddresses.forEach(address => {
    const startBtn = document.createElement('button');
    startBtn.type = 'button';
    startBtn.className = 'address-chip';
    startBtn.textContent = address.beskrivelse || address.adresse.split(',')[0];
    startBtn.title = address.adresse;
    startBtn.addEventListener('click', () => {
      document.getElementById('drive-start').value = address.adresse;
    });
    
    const endBtn = document.createElement('button');
    endBtn.type = 'button';
    endBtn.className = 'address-chip';
    endBtn.textContent = address.beskrivelse || address.adresse.split(',')[0];
    endBtn.title = address.adresse;
    endBtn.addEventListener('click', () => {
      document.getElementById('drive-end').value = address.adresse;
    });
    
    startContainer.appendChild(startBtn);
    endContainer.appendChild(endBtn);
  });
}

/**
 * Set the current location in an address input
 * @param {string} fieldId - The field ID to set ('start' or 'end')
 */
async function setCurrentLocation(fieldId) {
  const button = document.getElementById(`${fieldId}-location-btn`);
  const input = document.getElementById(`drive-${fieldId}`);
  
  try {
    button.disabled = true;
    button.textContent = 'Henter...';
    
    // Get current location
    const location = await maps.getCurrentLocation();
    
    // Update input
    input.value = location.address;
    
    button.textContent = 'Min position';
  } catch (error) {
    showError('Lokationsfejl', 'Kunne ikke hente din position. Tillad venligst lokation i din browser.');
    console.error('Error getting current location:', error);
  } finally {
    button.disabled = false;
  }
}

/**
 * Calculate distance between addresses
 */
async function calculateDistance() {
  const startAddress = document.getElementById('drive-start').value.trim();
  const endAddress = document.getElementById('drive-end').value.trim();
  const isRoundTrip = document.getElementById('drive-roundtrip').checked;
  const rate = parseFloat(document.getElementById('drive-rate').value);
  
  if (!startAddress || !endAddress) {
    showError('Manglende adresser', 'Indtast både start- og slutadresse.');
    return;
  }
  
  const calculateBtn = document.getElementById('calculate-btn');
  const saveBtn = document.getElementById('save-btn');
  
  try {
    // Update UI state
    calculateBtn.disabled = true;
    calculateBtn.textContent = 'Beregner...';
    
    // Calculate distance
    const result = await maps.calculateDistance(startAddress, endAddress);
    let distance = result.distance;
    
    // Double for round trip
    if (isRoundTrip) {
      distance *= 2;
    }
    
    // Calculate amount
    const amount = distance * rate;
    
    // Update UI
    document.getElementById('calculated-distance').textContent = distance.toFixed(2);
    document.getElementById('calculated-amount').textContent = amount.toFixed(2);
    
    // Enable save button
    saveBtn.disabled = false;
  } catch (error) {
    showError('Beregningsfejl', 'Kunne ikke beregne distance. Kontroller adresserne og prøv igen.');
    console.error('Error calculating distance:', error);
  } finally {
    calculateBtn.disabled = false;
    calculateBtn.textContent = 'Beregn distance';
  }
}

/**
 * Save a new drive record
 * @param {Event} event - Form submit event
 */
async function saveNewDrive(event) {
  event.preventDefault();
  
  const startAddress = document.getElementById('drive-start').value.trim();
  const endAddress = document.getElementById('drive-end').value.trim();
  const purpose = document.getElementById('drive-purpose').value.trim();
  const date = document.getElementById('drive-date').value;
  const rate = parseFloat(document.getElementById('drive-rate').value);
  const isRoundTrip = document.getElementById('drive-roundtrip').checked;
  const distance = parseFloat(document.getElementById('calculated-distance').textContent);
  const amount = parseFloat(document.getElementById('calculated-amount').textContent);
  
  if (isNaN(distance) || isNaN(amount)) {
    showError('Manglende beregning', 'Beregn distance før du gemmer.');
    return;
  }
  
  const saveBtn = document.getElementById('save-btn');
  
  try {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Gemmer...';
    
    // Prepare drive data
    const driveData = {
      dato: date,
      startAdresse: startAddress,
      slutAdresse: endAddress,
      antalKm: distance,
      sats: rate,
      formål: purpose,
      beløb: amount,
      turRetur: isRoundTrip
    };
    
    // Save drive
    const savedDrive = storage.saveDrive(driveData);
    
    // Save frequent addresses
    storage.saveFrequentAddress({
      adresse: startAddress,
      beskrivelse: 'Fra ' + date
    });
    
    storage.saveFrequentAddress({
      adresse: endAddress,
      beskrivelse: purpose
    });
    
    // Try to sync to Google Sheets
    syncToDrive();
    
    // Show confirmation
    showMessage('Kørsel gemt', 'Din kørsel er blevet registreret.');
    
    // Reset form
    resetDriveForm();
    
    // Update history view
    initHistoryView();
    
    // Switch to history view
    setCurrentView('history');
  } catch (error) {
    showError('Kunne ikke gemme', 'Der opstod en fejl ved gemning af kørslen. Prøv igen.');
    console.error('Error saving drive:', error);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Gem kørsel';
  }
}

/**
 * Reset the drive form to default values
 */
function resetDriveForm() {
  const settings = storage.getSettings();
  
  document.getElementById('drive-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('drive-start').value = settings.standardStartAdresse || '';
  document.getElementById('drive-end').value = '';
  document.getElementById('drive-purpose').value = '';
  document.getElementById('drive-rate').value = settings.standardSats;
  document.getElementById('drive-roundtrip').checked = false;
  document.getElementById('calculated-distance').textContent = '-';
  document.getElementById('calculated-amount').textContent = '-';
  document.getElementById('save-btn').disabled = true;
}

/**
 * Initialize the history view
 */
function initHistoryView() {
  const historySection = document.getElementById('history-section');
  const drivesList = document.getElementById('drives-list');
  
  if (!drivesList) return;
  
  // Get all drives
  const drives = storage.getDrives();
  
  if (drives.length === 0) {
    drivesList.innerHTML = '<p class="text-center">Ingen kørsler registreret endnu.</p>';
    return;
  }
  
  // Sort drives by date (newest first)
  const sortedDrives = [...drives].sort((a, b) => 
    new Date(b.dato) - new Date(a.dato)
  );
  
  // Calculate total
  const totalAmount = sortedDrives.reduce((sum, drive) => sum + drive.beløb, 0);
  const totalKm = sortedDrives.reduce((sum, drive) => sum + drive.antalKm, 0);
  
  // Add summary at the top
  drivesList.innerHTML = `
    <div class="summary-box">
      <div>
        <h3>Total</h3>
        <p>Registrerede kørsler: ${drives.length}</p>
      </div>
      <div>
        <p>I alt kørte kilometer: ${totalKm.toFixed(2)} km</p>
        <p>I alt beløb: ${totalAmount.toFixed(2)} kr.</p>
      </div>
      <div>
        <button id="sync-button" class="secondary">Synkroniser</button>
      </div>
    </div>
  `;
  
  document.getElementById('sync-button').addEventListener('click', syncToDrive);
  
  // Create list of drives
  const drivesListElement = document.createElement('div');
  sortedDrives.forEach(drive => {
    const driveElement = document.createElement('div');
    driveElement.className = 'drive-item';
    driveElement.innerHTML = `
      <div class="drive-item-header">
        <span class="drive-date">${formatDate(drive.dato)}</span>
        <span class="drive-amount">${drive.beløb.toFixed(2)} kr.</span>
      </div>
      <div class="drive-details">
        <p>${drive.startAdresse} → ${drive.slutAdresse}</p>
        <p>${drive.antalKm.toFixed(2)} km ${drive.turRetur ? '(tur/retur)' : ''} • ${drive.formål}</p>
        <p>${drive.synkroniseret ? '✓ Synkroniseret' : '⟳ Ikke synkroniseret'}</p>
      </div>
      <div class="actions-row">
        <button class="edit-drive secondary small" data-id="${drive.id}">Rediger</button>
        <button class="delete-drive secondary small" data-id="${drive.id}">Slet</button>
      </div>
    `;
    
    drivesListElement.appendChild(driveElement);
  });
  
  drivesList.appendChild(drivesListElement);
  
  // Add event listeners for editing and deleting
  document.querySelectorAll('.edit-drive').forEach(button => {
    button.addEventListener('click', () => editDrive(button.dataset.id));
  });
  
  document.querySelectorAll('.delete-drive').forEach(button => {
    button.addEventListener('click', () => deleteDrive(button.dataset.id));
  });
}

/**
 * Sync drives to Google Sheets
 */
async function syncToDrive() {
  const syncButton = document.getElementById('sync-button');
  if (syncButton) {
    syncButton.disabled = true;
    syncButton.textContent = 'Synkroniserer...';
  }
  
  try {
    const syncResult = await storage.syncToGoogleSheets();
    
    if (syncResult.success) {
      showMessage('Synkronisering gennemført', 
                  `${syncResult.syncedCount} kørsler blev synkroniseret til Google Sheets.`);
      
      // Refresh history view to update sync status
      initHistoryView();
    } else {
      showError('Synkroniseringsfejl', 
                `Kunne ikke synkronisere alle kørsler. ${syncResult.errors.length} fejl.`);
    }
  } catch (error) {
    showError('Synkroniseringsfejl', 'Kunne ikke forbinde til Google Sheets. Prøv igen senere.');
    console.error('Sync error:', error);
  } finally {
    if (syncButton) {
      syncButton.disabled = false;
      syncButton.textContent = 'Synkroniser';
    }
  }
}

/**
 * Edit a drive record
 * @param {string} id - Drive ID to edit
 */
function editDrive(id) {
  // Get the drive data
  const drives = storage.getDrives();
  const drive = drives.find(d => d.id === id);
  
  if (!drive) {
    showError('Ikke fundet', 'Kunne ikke finde den valgte kørsel.');
    return;
  }
  
  // Switch to registration view
  setCurrentView('register');
  
  // Fill the form with the drive data
  document.getElementById('drive-date').value = drive.dato;
  document.getElementById('drive-start').value = drive.startAdresse;
  document.getElementById('drive-end').value = drive.slutAdresse;
  document.getElementById('drive-purpose').value = drive.formål;
  document.getElementById('drive-rate').value = drive.sats;
  document.getElementById('drive-roundtrip').checked = drive.turRetur;
  document.getElementById('calculated-distance').textContent = drive.antalKm.toFixed(2);
  document.getElementById('calculated-amount').textContent = drive.beløb.toFixed(2);
  
  // Enable save button
  document.getElementById('save-btn').disabled = false;
  
  // Replace the form submit handler to update instead of create
  const form = document.getElementById('drive-form');
  
  // Remove existing handler
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);
  
  // Add new handler for editing
  newForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const startAddress = document.getElementById('drive-start').value.trim();
    const endAddress = document.getElementById('drive-end').value.trim();
    const purpose = document.getElementById('drive-purpose').value.trim();
    const date = document.getElementById('drive-date').value;
    const rate = parseFloat(document.getElementById('drive-rate').value);
    const isRoundTrip = document.getElementById('drive-roundtrip').checked;
    const distance = parseFloat(document.getElementById('calculated-distance').textContent);
    const amount = parseFloat(document.getElementById('calculated-amount').textContent);
    
    if (isNaN(distance) || isNaN(amount)) {
      showError('Manglende beregning', 'Beregn distance før du gemmer.');
      return;
    }
    
    const saveBtn = document.getElementById('save-btn');
    
    try {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Opdaterer...';
      
      // Prepare drive data
      const driveData = {
        dato: date,
        startAdresse: startAddress,
        slutAdresse: endAddress,
        antalKm: distance,
        sats: rate,
        formål: purpose,
        beløb: amount,
        turRetur: isRoundTrip
      };
      
      // Update drive
      const updatedDrive = storage.updateDrive(id, driveData);
      
      if (!updatedDrive) {
        throw new Error('Kunne ikke opdatere kørslen.');
      }
      
      // Show confirmation
      showMessage('Kørsel opdateret', 'Din kørsel er blevet opdateret.');
      
      // Reset form and handler
      resetDriveForm();
      initRegistrationForm();
      
      // Update history view
      initHistoryView();
      
      // Switch to history view
      setCurrentView('history');
    } catch (error) {
      showError('Kunne ikke opdatere', 'Der opstod en fejl ved opdatering af kørslen. Prøv igen.');
      console.error('Error updating drive:', error);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Gem kørsel';
    }
  });
  
  // Add button to calculate distance again
  document.getElementById('calculate-btn').addEventListener('click', calculateDistance);
  document.getElementById('start-location-btn').addEventListener('click', () => setCurrentLocation('start'));
  document.getElementById('end-location-btn').addEventListener('click', () => setCurrentLocation('end'));
}

/**
 * Delete a drive record
 * @param {string} id - Drive ID to delete
 */
function deleteDrive(id) {
  if (!confirm('Er du sikker på, at du vil slette denne kørsel?')) {
    return;
  }
  
  try {
    const success = storage.deleteDrive(id);
    
    if (success) {
      showMessage('Kørsel slettet', 'Kørslen er blevet slettet.');
      
      // Update history view
      initHistoryView();
    } else {
      showError('Kunne ikke slette', 'Der opstod en fejl ved sletning af kørslen. Prøv igen.');
    }
  } catch (error) {
    showError('Kunne ikke slette', 'Der opstod en fejl ved sletning af kørslen. Prøv igen.');
    console.error('Error deleting drive:', error);
  }
}

/**
 * Update UI state based on authentication
 */
function updateUIState() {
  const loginSection = document.getElementById('login-section');
  const registrationSection = document.getElementById('registration-section');
  const historySection = document.getElementById('history-section');
  
  // Update auth UI
  updateAuthStatus();
  
  // Show/hide sections based on auth status
  if (auth.isSignedIn()) {
    loginSection.classList.add('hidden');
    
    // Show the appropriate section based on current view
    if (currentView === 'register') {
      registrationSection.classList.remove('hidden');
      historySection.classList.add('hidden');
    } else if (currentView === 'history') {
      registrationSection.classList.add('hidden');
      historySection.classList.remove('hidden');
    } else {
      // Default view is history if logged in
      setCurrentView('history');
    }
    
    // Add navigation if not present
    if (!document.querySelector('.app-nav')) {
      const header = document.querySelector('.app-header');
      const nav = document.createElement('div');
      nav.className = 'app-nav';
      nav.innerHTML = `
        <button id="nav-register" class="${currentView === 'register' ? 'active' : ''}">Registrer kørsel</button>
        <button id="nav-history" class="${currentView === 'history' ? 'active' : ''}">Historik</button>
      `;
      header.appendChild(nav);
      
      // Add navigation event listeners
      document.getElementById('nav-register').addEventListener('click', () => setCurrentView('register'));
      document.getElementById('nav-history').addEventListener('click', () => setCurrentView('history'));
    }
  } else {
    // Not signed in, show login only
    loginSection.classList.remove('hidden');
    registrationSection.classList.add('hidden');
    historySection.classList.add('hidden');
    
    // Remove navigation if present
    const nav = document.querySelector('.app-nav');
    if (nav) nav.remove();
    
    currentView = 'login';
  }
}

/**
 * Set the current view and update UI
 * @param {string} view - View to set ('login', 'register', 'history')
 */
function setCurrentView(view) {
  currentView = view;
  updateUIState();
  
  // Update navigation active buttons
  const navRegister = document.getElementById('nav-register');
  const navHistory = document.getElementById('nav-history');
  
  if (navRegister && navHistory) {
    navRegister.classList.toggle('active', view === 'register');
    navHistory.classList.toggle('active', view === 'history');
  }
}

/**
 * Show an error message
 * @param {string} title - Error title
 * @param {string} message - Error message
 */
function showError(title, message) {
  // Simple alert for now, can be replaced with a nicer UI component
  alert(`${title}: ${message}`);
}

/**
 * Show a success message
 * @param {string} title - Message title
 * @param {string} message - Message content
 */
function showMessage(title, message) {
  // Simple alert for now, can be replaced with a nicer UI component
  alert(`${title}: ${message}`);
}

/**
 * Format a date string
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('da-DK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Initialize the UI module
 */
export function initUI() {
  console.log('Initializing UI module');
  
  // Get DOM elements
  tripForm = document.getElementById('trip-form');
  dateInput = document.getElementById('date');
  startAddressInput = document.getElementById('start-address');
  endAddressInput = document.getElementById('end-address');
  purposeInput = document.getElementById('purpose');
  roundTripCheckbox = document.getElementById('round-trip');
  calculateBtn = document.getElementById('calculate-btn');
  saveBtn = document.getElementById('save-btn');
  currentLocationBtn = document.getElementById('use-current-location');
  distanceResult = document.getElementById('distance-result');
  distanceSpan = document.getElementById('distance');
  amountSpan = document.getElementById('amount');
  tripsList = document.getElementById('trips-list');
  
  // Set default date to today
  dateInput.valueAsDate = new Date();
  
  // Load user settings
  loadSettings();
  
  // Set up event listeners
  setupEventListeners();
  
  // Set up address autocomplete
  setupAddressAutocomplete();
  
  // Load and display trips
  loadTrips();
}

/**
 * Set up event listeners for UI elements
 */
function setupEventListeners() {
  // Calculate button
  calculateBtn.addEventListener('click', handleCalculateClick);
  
  // Form submission
  tripForm.addEventListener('submit', handleFormSubmit);
  
  // Use current location button
  currentLocationBtn.addEventListener('click', handleCurrentLocationClick);
  
  // Form input changes
  dateInput.addEventListener('change', updateCurrentTrip);
  startAddressInput.addEventListener('change', updateCurrentTrip);
  endAddressInput.addEventListener('change', updateCurrentTrip);
  purposeInput.addEventListener('change', updateCurrentTrip);
  roundTripCheckbox.addEventListener('change', updateCurrentTrip);
}

/**
 * Set up address autocomplete for input fields
 */
function setupAddressAutocomplete() {
  // Set up autocomplete for start address
  autocompleteAddress(startAddressInput, (address) => {
    currentTrip.startAddress = address;
  });
  
  // Set up autocomplete for end address
  autocompleteAddress(endAddressInput, (address) => {
    currentTrip.endAddress = address;
  });
}

/**
 * Handle click on calculate button
 */
async function handleCalculateClick() {
  // Update current trip from form values
  updateCurrentTrip();
  
  // Validate addresses
  if (!currentTrip.startAddress || !currentTrip.endAddress) {
    alert('Både start- og slutadresse skal angives');
    return;
  }
  
  try {
    // Show calculating state
    calculateBtn.textContent = 'Beregner...';
    calculateBtn.disabled = true;
    
    // Calculate distance
    const result = await calculateDistance(currentTrip.startAddress, currentTrip.endAddress);
    
    // Update distance and amount
    currentTrip.distance = result.distance;
    currentTrip.amount = calculateAmount(result.distance, settings.defaultRate, currentTrip.roundTrip);
    
    // Update UI
    distanceSpan.textContent = currentTrip.distance.toFixed(1);
    amountSpan.textContent = currentTrip.amount.toFixed(2);
    distanceResult.style.display = 'block';
    
    // Enable save button
    saveBtn.disabled = false;
  } catch (error) {
    console.error('Error calculating distance:', error);
    alert('Der opstod en fejl ved beregning af afstand. Prøv igen.');
  } finally {
    // Reset button state
    calculateBtn.textContent = 'Beregn';
    calculateBtn.disabled = false;
  }
}

/**
 * Handle form submission
 * @param {Event} event - Form submit event
 */
async function handleFormSubmit(event) {
  event.preventDefault();
  
  // Validate
  if (currentTrip.distance <= 0) {
    alert('Du skal beregne afstanden først');
    return;
  }
  
  try {
    // Show saving state
    saveBtn.textContent = 'Gemmer...';
    saveBtn.disabled = true;
    
    // Prepare trip data
    const tripData = {
      date: currentTrip.date,
      startAddress: currentTrip.startAddress,
      endAddress: currentTrip.endAddress,
      purpose: currentTrip.purpose,
      roundTrip: currentTrip.roundTrip,
      distance: currentTrip.distance,
      rate: settings.defaultRate,
      amount: currentTrip.amount
    };
    
    // Save trip
    const savedTrip = await saveTrip(tripData);
    
    // Reset form
    resetForm();
    
    // Reload trips list
    loadTrips();
    
    // Show success message
    alert('Kørslen er gemt');
  } catch (error) {
    console.error('Error saving trip:', error);
    alert('Der opstod en fejl ved gemning af kørsel. Prøv igen.');
  } finally {
    // Reset button state
    saveBtn.textContent = 'Gem';
    saveBtn.disabled = true;
  }
}

/**
 * Handle click on use current location button
 */
async function handleCurrentLocationClick() {
  try {
    // Show loading state
    currentLocationBtn.textContent = '...';
    currentLocationBtn.disabled = true;
    
    // Get current location
    const location = await getUserLocation();
    
    // Set as start address
    startAddressInput.value = location.formattedAddress;
    currentTrip.startAddress = location.formattedAddress;
  } catch (error) {
    console.error('Error getting current location:', error);
    alert('Der opstod en fejl ved hentning af din placering. Prøv igen.');
  } finally {
    // Reset button state
    currentLocationBtn.textContent = '📍';
    currentLocationBtn.disabled = false;
  }
}

/**
 * Update current trip object from form values
 */
function updateCurrentTrip() {
  currentTrip.date = dateInput.value;
  currentTrip.startAddress = startAddressInput.value;
  currentTrip.endAddress = endAddressInput.value;
  currentTrip.purpose = purposeInput.value;
  currentTrip.roundTrip = roundTripCheckbox.checked;
  
  // Reset calculated values if addresses change
  if (currentTrip.distance > 0) {
    currentTrip.distance = 0;
    currentTrip.amount = 0;
    distanceResult.style.display = 'none';
    saveBtn.disabled = true;
  }
}

/**
 * Calculate amount based on distance, rate and round trip
 * @param {number} distance - Distance in km
 * @param {number} rate - Rate in DKK per km
 * @param {boolean} roundTrip - Whether it's a round trip
 * @returns {number} - Calculated amount
 */
function calculateAmount(distance, rate, roundTrip) {
  // Double the distance if it's a round trip
  const totalDistance = roundTrip ? distance * 2 : distance;
  return totalDistance * rate;
}

/**
 * Reset the form to initial state
 */
function resetForm() {
  // Reset date to today
  dateInput.valueAsDate = new Date();
  
  // Clear other inputs
  startAddressInput.value = '';
  endAddressInput.value = '';
  purposeInput.value = '';
  roundTripCheckbox.checked = false;
  
  // Hide results
  distanceResult.style.display = 'none';
  
  // Reset current trip
  currentTrip = {
    date: dateInput.value,
    startAddress: '',
    endAddress: '',
    purpose: '',
    roundTrip: false,
    distance: 0,
    amount: 0
  };
  
  // Disable save button
  saveBtn.disabled = true;
}

/**
 * Load user settings
 */
async function loadSettings() {
  try {
    settings = await getSettings();
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

/**
 * Load and display trips
 */
async function loadTrips() {
  try {
    // Get trips sorted by date (newest first)
    const trips = await getTrips({ sort: 'date' });
    
    // Clear trips list
    tripsList.innerHTML = '';
    
    if (trips.length === 0) {
      // Show placeholder if no trips
      const placeholder = document.createElement('p');
      placeholder.className = 'placeholder';
      placeholder.textContent = 'Ingen kørsler registreret endnu.';
      tripsList.appendChild(placeholder);
      return;
    }
    
    // Display trips
    trips.forEach(trip => {
      const tripElement = createTripElement(trip);
      tripsList.appendChild(tripElement);
    });
  } catch (error) {
    console.error('Error loading trips:', error);
    tripsList.innerHTML = '<p class="placeholder">Kunne ikke indlæse kørsler.</p>';
  }
}

/**
 * Create HTML element for a trip
 * @param {Object} trip - Trip data
 * @returns {HTMLElement} - Trip list item element
 */
function createTripElement(trip) {
  // Create trip item container
  const tripItem = document.createElement('div');
  tripItem.className = 'trip-item';
  tripItem.dataset.id = trip.id;
  
  // Format date
  const dateObj = new Date(trip.date);
  const formattedDate = dateObj.toLocaleDateString('da-DK');
  
  // Create trip content
  tripItem.innerHTML = `
    <div class="trip-header">
      <strong>${formattedDate}</strong>
      <span>${trip.purpose}</span>
    </div>
    <div class="trip-details">
      <p>Fra: ${trip.startAddress}</p>
      <p>Til: ${trip.endAddress}</p>
      <p>
        Afstand: ${trip.distance.toFixed(1)} km
        ${trip.roundTrip ? '(tur/retur)' : ''}
      </p>
      <p>Beløb: ${trip.amount.toFixed(2)} kr.</p>
    </div>
    <div class="trip-actions">
      <button class="edit-trip-btn" data-id="${trip.id}">Rediger</button>
      <button class="delete-trip-btn" data-id="${trip.id}">Slet</button>
    </div>
    ${!trip.synced ? '<div class="sync-status">Ikke synkroniseret</div>' : ''}
  `;
  
  // Add event listeners
  const editBtn = tripItem.querySelector('.edit-trip-btn');
  const deleteBtn = tripItem.querySelector('.delete-trip-btn');
  
  editBtn.addEventListener('click', () => handleEditTrip(trip.id));
  deleteBtn.addEventListener('click', () => handleDeleteTrip(trip.id));
  
  return tripItem;
}

/**
 * Handle edit trip button click
 * @param {string} tripId - ID of the trip to edit
 */
function handleEditTrip(tripId) {
  // This would be implemented in a real application
  alert('Redigering af kørsler kommer i fremtidige versioner');
}

/**
 * Handle delete trip button click
 * @param {string} tripId - ID of the trip to delete
 */
async function handleDeleteTrip(tripId) {
  if (confirm('Er du sikker på, at du vil slette denne kørsel?')) {
    try {
      await deleteTrip(tripId);
      loadTrips();
    } catch (error) {
      console.error('Error deleting trip:', error);
      alert('Der opstod en fejl ved sletning af kørslen. Prøv igen.');
    }
  }
} 