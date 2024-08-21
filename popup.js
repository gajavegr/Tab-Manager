// // popup.js

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('exportBtn').addEventListener('click', exportTabs);
    document.getElementById('importBtn').addEventListener('change', importTabs);
    document.getElementById('openSelectedBtn').addEventListener('click', openTabs);
    updateTabCount();
    const tabsListContainer = document.getElementById('tabsList');
    tabsListContainer.addEventListener('click', function (event) {
      if (event.target.type === 'checkbox' && event.target.dataset.windowId) {
        handleWindowCheckboxClick(event.target);

        // Update the tab count when a checkbox is clicked
        updateTabCount();
      }
    });
});

function updateTabCount() {
  chrome.tabs.query({}, function (tabs) {
    const tabCountElement = document.getElementById('tabCount');
    tabCountElement.textContent = `(${tabs.length} Tabs)`;
  });
}

  function exportTabs() {
    const fileNameInput = document.getElementById('fileNameInput');
    let fileName = fileNameInput.value.trim();
  
    // If no name is provided, generate a default name
    if (fileName === '') {
      const now = new Date();
      const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
      const timePart = now.toISOString().slice(11, 19).replace(/:/g, '');
      fileName = `tab_session_${datePart}_${timePart}`;
    }
  
    chrome.tabs.query({}, function (tabs) {
      const dataToExport = {};
  
      tabs.forEach(tab => {
        if (!dataToExport[tab.windowId]) {
          dataToExport[tab.windowId] = [];
        }
  
        dataToExport[tab.windowId].push({
          url: tab.url,
          title: tab.title,
        });
      });
  
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
  
      chrome.downloads.download({
        url: url,
        filename: `Tab Manager JSONs/${fileName}`, // Path within the Downloads folder
        conflictAction: 'uniquify'
      }, function(downloadId) {
        console.log(`Download started: ${downloadId}`);
      });
    });
  }
  
  function importTabs(event) {
    const fileInput = event.target;
    const file = fileInput.files[0];
  
    if (file) {
      const reader = new FileReader();
  
      reader.onload = function (e) {
        const importedData = JSON.parse(e.target.result);
        displayTabsList(importedData);
      };
  
      reader.readAsText(file);
    }
  }
  
  function displayTabsList(data) {
    const tabsListContainer = document.getElementById('tabsList');
    tabsListContainer.innerHTML = '';
  
    Object.keys(data).forEach(windowId => {
      const windowLabel = document.createElement('label');
      const windowCheckbox = document.createElement('input');
      windowCheckbox.type = 'checkbox';
      windowCheckbox.value = windowId;
      windowCheckbox.dataset.windowId = windowId; // Store windowId as a data attribute
      windowLabel.appendChild(windowCheckbox);
      windowLabel.appendChild(document.createTextNode(` Window ${windowId}`));
  
      tabsListContainer.appendChild(windowLabel);
  
      const windowTabsList = document.createElement('div');
      windowTabsList.id = `windowTabsList_${windowId}`;
      windowTabsList.style.paddingLeft = '20px';
  
      data[windowId].forEach(tab => {
        const tabLabel = document.createElement('label');
        const tabCheckbox = document.createElement('input');
        tabCheckbox.type = 'checkbox';
        tabCheckbox.value = tab.url;
        tabLabel.appendChild(tabCheckbox);
        tabLabel.appendChild(document.createTextNode(` ${tab.title}`));
  
        windowTabsList.appendChild(tabLabel);
      });
  
      tabsListContainer.appendChild(windowTabsList);
    });
  }

function openTabs() {
    const tabsListContainer = document.getElementById('tabsList');
    const selectiveOpening = document.getElementById('selectiveCheckbox').checked;
  
    // Arrays to store all tabs and selected tabs
    const allTabs = [];
    const selectedTabs = [];
  
    // Iterate through window checkboxes
    const windowCheckboxes = tabsListContainer.querySelectorAll('input[type="checkbox"]');
    windowCheckboxes.forEach(windowCheckbox => {
      const windowId = parseInt(windowCheckbox.value);
  
      // Check if windowTabsList exists before trying to access it
      const windowTabsList = document.getElementById(`windowTabsList_${windowId}`);
      if (windowTabsList) {
        const tabCheckboxes = windowTabsList.getElementsByTagName('input');
  
        for (const tabCheckbox of tabCheckboxes) {
          const tab = { url: tabCheckbox.value, windowId };
  
          // Add all tabs to the 'allTabs' array
          allTabs.push(tab);
  
          // Add selected tabs to the 'selectedTabs' array
          if (selectiveOpening && tabCheckbox.checked) {
            selectedTabs.push(tab);
          }
        }
      }
    });
  
    // Open tabs based on the user's choice
    const tabsToOpen = selectiveOpening ? selectedTabs : allTabs;
  
    // Create a new window for each set of tabs with the same windowId
    const windowTabsMap = new Map();
    tabsToOpen.forEach(tab => {
      if (!windowTabsMap.has(tab.windowId)) {
        windowTabsMap.set(tab.windowId, []);
      }
      windowTabsMap.get(tab.windowId).push(tab.url);
    });
  
    windowTabsMap.forEach((tabs, windowId) => {
      chrome.windows.create({ url: tabs, focused: true });
    });
  }
  
  // Add event listener to handle window checkbox clicks
  function handleWindowCheckboxClick(checkbox) {
    const windowId = parseInt(checkbox.dataset.windowId);
    const windowTabsList = document.getElementById(`windowTabsList_${windowId}`);
  
    // Check if the windowTabsList exists and has child nodes
    if (windowTabsList && windowTabsList.hasChildNodes()) {
      const tabCheckboxes = windowTabsList.getElementsByTagName('input');
  
      // Toggle the state of each tab checkbox based on the state of the window checkbox
      for (const tabCheckbox of tabCheckboxes) {
        tabCheckbox.checked = checkbox.checked;
      }
    }
  }
  