let searchInterval;
let searchCount = 0;
let totalSearches = 0;
let isMobile = false;
let searchTerms = [];
let currentSettings = {};

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'startSearch') {
    clearInterval(searchInterval);
    
    currentSettings = {
      desktop: request.desktop,
      mobile: request.mobile,
      minDelay: request.minDelay,
      maxDelay: request.maxDelay,
      forceMobile: request.forceMobile
    };
    
    totalSearches = currentSettings.desktop + currentSettings.mobile;
    searchCount = 0;

    getRandomTermsFromAllCategories().then(terms => {
      searchTerms = terms;
      startSearch();
    });
  } else if (request.action === 'stopSearch') {
    clearInterval(searchInterval);
    chrome.storage.local.set({ searchInProgress: false });
  }
});

function getRandomTermsFromAllCategories() {
  return new Promise((resolve) => {
    const defaultTerms = generateRandomTerms();

    const categories = ['tech-terms.json', 'anime-terms.json', 'random-terms.json'];
    let allTerms = [];
    let loadedCount = 0;

    categories.forEach(jsonFile => {
      fetch(chrome.runtime.getURL(jsonFile))
        .then(response => response.text())
        .then(text => {
          try {
            const data = JSON.parse(text);

            if (Array.isArray(data)) {
              data.forEach(item => {
                if (typeof item === 'string') {
                  allTerms.push(item);
                } else if (typeof item === 'object' && item !== null) {
                  const values = Object.values(item);
                  for (const val of values) {
                    if (typeof val === 'string') {
                      allTerms.push(val);
                      break; 
                    }
                  }
                }
              });
            } else if (typeof data === 'object' && data !== null) {
              const values = Object.values(data);
              values.forEach(val => {
                if (typeof val === 'string') {
                  allTerms.push(val);
                }
              });
            }
            
            console.log(`Loaded ${allTerms.length} terms from ${jsonFile}`);
          } catch (e) {
            console.error(`Error parsing ${jsonFile}: ${e.message}`);
          }
        })
        .catch(error => {
          console.error(`Error loading ${jsonFile}: ${error.message}`);
        })
        .finally(() => {
          loadedCount++;

          if (loadedCount === categories.length) {
            if (allTerms.length > 0) {
              console.log(`Successfully loaded ${allTerms.length} terms from JSON files`);
              const shuffledTerms = allTerms.sort(() => Math.random() - 0.5);
              resolve(shuffledTerms);
            } else {
              console.log("Using default search terms");
              resolve(defaultTerms);
            }
          }
        });
    });
  });
}

function generateRandomTerms() {
  const terms = [];
  const subjects = ['food', 'sports', 'history', 'science', 'art', 'music', 'books', 'games'];
  const actions = ['best', 'popular', 'interesting', 'new', 'classic', 'unique', 'trending', 'favorite'];
  
  for (let i = 0; i < 30; i++) {
    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    terms.push(`${action} ${subject}`);
  }
  
  return terms;
}

function startSearch() {
  if (searchCount < totalSearches) {
    if (searchCount < currentSettings.mobile) {
      isMobile = true;
    } else {
      isMobile = false;
    }
    
    performSearch();

    const delay = Math.floor(Math.random() * (currentSettings.maxDelay - currentSettings.minDelay + 1) + currentSettings.minDelay) * 1000;
    searchInterval = setTimeout(startSearch, delay);
  } else {
    chrome.storage.local.set({ searchInProgress: false });
  }
}

function performSearch() {
  const searchTerm = searchTerms[searchCount % searchTerms.length];
  const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(searchTerm)}&PC=MOZI&form=MOZLBR`;
  
  chrome.tabs.create({ url: searchUrl, active: false }, function(tab) {
    if (isMobile || currentSettings.forceMobile) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const mobileUA = 'Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.162 Mobile Safari/537.36';
          
          Object.defineProperty(navigator, 'userAgent', {
            get: function() { return mobileUA; }
          });

          const meta = document.createElement('meta');
          meta.name = 'viewport';
          meta.content = 'width=device-width, initial-scale=1.0';
          document.head.appendChild(meta);
        }
      });
    }

    setTimeout(function() {
      chrome.tabs.remove(tab.id);
    }, 5000);
  });
  
  searchCount++;

  chrome.storage.local.set({ 
    searchProgress: {
      current: searchCount,
      total: totalSearches,
      isMobile: isMobile,
      searchTerm: searchTerm
    }
  });
}

chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.local.set({
    desktopCount: 10,
    mobileCount: 0,
    minDelay: 1,
    maxDelay: 5,
    forceMobile: false,
    searchInProgress: false
  });
});