document.addEventListener('DOMContentLoaded', function() {
  const desktopRange = document.getElementById('desktop-range');
  const mobileRange = document.getElementById('mobile-range');
  const minDelayRange = document.getElementById('min-delay-range');
  const maxDelayRange = document.getElementById('max-delay-range');
  const desktopRangeValue = document.getElementById('desktop-range-value');
  const mobileRangeValue = document.getElementById('mobile-range-value');
  const minDelayRangeValue = document.getElementById('min-delay-range-value');
  const maxDelayRangeValue = document.getElementById('max-delay-range-value');
  
  const searchBtn = document.getElementById('search-btn');
  const stopBtn = document.getElementById('stop-btn');
  
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  
  chrome.storage.local.get(['searchInProgress', 'searchProgress'], function(data) {
    if (data.searchInProgress) {
      searchBtn.style.display = 'none';
      stopBtn.style.display = 'block';
      updateProgressBar(data.searchProgress);
    }
  });
  
  chrome.storage.local.get(['desktopCount', 'mobileCount', 'minDelay', 'maxDelay'], function(data) {
    if (data.desktopCount) {
      desktopRange.value = data.desktopCount;
      desktopRangeValue.textContent = data.desktopCount;
    }
    
    if (data.mobileCount) {
      mobileRange.value = data.mobileCount;
      mobileRangeValue.textContent = data.mobileCount;
    }
    
    if (data.minDelay) {
      minDelayRange.value = data.minDelay;
      minDelayRangeValue.textContent = data.minDelay;
    }
    
    if (data.maxDelay) {
      maxDelayRange.value = data.maxDelay;
      maxDelayRangeValue.textContent = data.maxDelay;
    }
  });
  
  searchBtn.addEventListener('click', function() {
    const desktop = parseInt(desktopRange.value);
    const mobile = parseInt(mobileRange.value);
    const min = parseInt(minDelayRange.value);
    const max = parseInt(maxDelayRange.value);
    
    chrome.storage.local.set({
      desktopCount: desktop,
      mobileCount: mobile,
      minDelay: min,
      maxDelay: max,
      searchInProgress: true
    });
    
    chrome.runtime.sendMessage({
      action: 'startSearch',
      desktop: desktop,
      mobile: mobile,
      minDelay: min,
      maxDelay: max,
      forceMobile: false
    });
    
    searchBtn.style.display = 'none';
    stopBtn.style.display = 'block';
    
    progressFill.style.width = '0%';
    progressText.textContent = 'Starting searches...';
  });
  
  stopBtn.addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: 'stopSearch' });
    chrome.storage.local.set({ searchInProgress: false });
    
    stopBtn.style.display = 'none';
    searchBtn.style.display = 'block';
    
    progressText.textContent = 'Search stopped';
  });
  
  desktopRange.addEventListener('input', function() {
    desktopRangeValue.textContent = this.value;
  });
  
  mobileRange.addEventListener('input', function() {
    mobileRangeValue.textContent = this.value;
  });
  
  minDelayRange.addEventListener('input', function() {
    minDelayRangeValue.textContent = this.value;
  });
  
  maxDelayRange.addEventListener('input', function() {
    maxDelayRangeValue.textContent = this.value;
  });
  
  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (changes.searchProgress) {
      const progress = changes.searchProgress.newValue;
      updateProgressBar(progress);
    }
    
    if (changes.searchInProgress && changes.searchInProgress.newValue === false) {
      stopBtn.style.display = 'none';
      searchBtn.style.display = 'block';
      progressText.textContent = 'Search completed';
    }
  });

  function updateProgressBar(progress) {
    if (!progress) return;
    
    const percent = (progress.current / progress.total) * 100;
    progressFill.style.width = percent + '%';
    
    let statusText = `${progress.current} of ${progress.total}`;
    if (progress.searchTerm) {
      statusText += ` - "${progress.searchTerm}"`;
    }
    
    progressText.textContent = statusText;
  }
});