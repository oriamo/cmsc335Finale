document.addEventListener('DOMContentLoaded', () => {
  const bookForm = document.getElementById('bookForm');
  const searchBtn = document.getElementById('searchBtn');
  const searchQuery = document.getElementById('searchQuery');
  const booksList = document.getElementById('booksList');
  const apiResults = document.getElementById('apiResults');
  const weatherData = document.getElementById('weatherData');
  const weatherRefreshBtn = document.getElementById('weatherRefreshBtn');

  // Helper function to get API base URL
  function getApiUrl() {
    // In production, use the deployed API URL
    const isProd = window.location.hostname !== 'localhost';
    return isProd ? 'https://cmsc335finale.onrender.com' : '';
  }

  // Load books and weather on page load
  fetchBooks();
  fetchWeather();

  // Set up weather refresh interval (every 30 minutes)
  setInterval(fetchWeather, 30 * 60 * 1000);
  
  // Weather refresh button
  if (weatherRefreshBtn) {
    weatherRefreshBtn.addEventListener('click', () => {
      fetchWeather();
    });
  }

  // Form submission for adding a new book
  bookForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const title = document.getElementById('title').value.trim();
    const author = document.getElementById('author').value.trim();
    const year = document.getElementById('year').value;
    
    if (!title || !author || !year) {
      alert('Please fill in all fields');
      return;
    }

    // Create the book data object with the form values
    const bookData = {
      title: title,
      author: author,
      year: parseInt(year)
    };

    fetch(`${getApiUrl()}/api/books`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookData),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then((data) => {
      bookForm.reset();
      fetchBooks();
      showNotification(`"${data.title}" added to your collection!`);
    })
    .catch(error => {
      console.error('Error:', error);
      showNotification('Failed to add book. Please try again.', true);
    });
  });

  // Search OpenLibrary API
  searchBtn.addEventListener('click', () => {
    const query = searchQuery.value.trim();
    if (query) {
      apiResults.innerHTML = '<p class="loading">Searching for books...</p>';
      
      fetch(`${getApiUrl()}/api/external/books?q=${encodeURIComponent(query)}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(data => {
          if (data.docs && data.docs.length > 0) {
            displayApiResults(data.docs);
          } else {
            apiResults.innerHTML = '<p>No books found. Try another search term.</p>';
          }
        })
        .catch(error => {
          console.error('Error:', error);
          apiResults.innerHTML = '<p>Error fetching books. Please try again.</p>';
        });
    }
  });

  // Allow pressing Enter to search
  searchQuery.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchBtn.click();
    }
  });

  function fetchBooks() {
    booksList.innerHTML = '<p class="loading">Loading your collection...</p>';
    
    fetch(`${getApiUrl()}/api/books`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(books => {
        if (books.length === 0) {
          booksList.innerHTML = '<p>Your collection is empty. Add some books!</p>';
        } else {
          displayBooks(books);
        }
      })
      .catch(error => {
        console.error('Error:', error);
        booksList.innerHTML = '<p>Error loading books. Please refresh the page.</p>';
      });
  }

  function fetchWeather() {
    // Show loading state
    weatherData.innerHTML = '<span class="loading-inline">Getting weather data...</span>';
    
    // First try to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        // Success: got coordinates
        const { latitude, longitude } = position.coords;
        
        // Call API with user's coordinates
        getWeatherData(latitude, longitude);
      }, error => {
        // Error: couldn't get location, use default
        console.warn('Geolocation error:', error.message);
        getWeatherData();
      });
    } else {
      // Geolocation not supported, use default
      console.warn('Geolocation not supported by this browser');
      getWeatherData();
    }
  }
  
  function getWeatherData(lat, lon) {
    // Build URL with coordinates if available
    let url = `${getApiUrl()}/api/external/weather`;
    if (lat && lon) {
      url += `?lat=${lat}&lon=${lon}`;
    }
    
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error('Weather data not available');
        }
        return response.json();
      })
      .then(data => {
        weatherData.innerHTML = `<span class="temp">${data.temperature}°F</span> <span class="desc">${data.description}</span> in <span class="location">${data.location}</span>`;
        updateWeatherMessage(data.temperature, data.description);
      })
      .catch(error => {
        console.error('Weather error:', error);
        weatherData.textContent = 'Weather data not available';
      });
  }

  function updateWeatherMessage(temp, description) {
    const weatherMessage = document.querySelector('.weather-message');
    const weatherIcon = document.querySelector('.weather-icon i');
    
    // Update weather icon based on description
    if (description.toLowerCase().includes('rain')) {
      weatherIcon.className = 'fas fa-cloud-rain';
      weatherMessage.textContent = 'Rainy day? Perfect for staying in with a good book!';
    } else if (description.toLowerCase().includes('cloud')) {
      weatherIcon.className = 'fas fa-cloud';
      weatherMessage.textContent = 'Cloudy day with perfect reading light!';
    } else if (description.toLowerCase().includes('clear') || description.toLowerCase().includes('sun')) {
      weatherIcon.className = 'fas fa-sun';
      weatherMessage.textContent = 'Clear skies! Perfect for reading outdoors.';
    } else if (description.toLowerCase().includes('snow')) {
      weatherIcon.className = 'fas fa-snowflake';
      weatherMessage.textContent = 'Snowy day? Cozy up with a book by the fire!';
    } else if (temp < 10) {
      weatherIcon.className = 'fas fa-temperature-low';
      weatherMessage.textContent = 'It\'s cold outside! Grab a blanket and a book.';
    } else if (temp > 25) {
      weatherIcon.className = 'fas fa-temperature-high';
      weatherMessage.textContent = 'Warm day! Find a shady spot outdoors for reading.';
    } else {
      weatherIcon.className = 'fas fa-cloud-sun';
      weatherMessage.textContent = 'Perfect reading weather today!';
    }
  }

  document.addEventListener("click", (event) => {
    if (event.target.classList.contains("delete-book-btn")) {
      const bookId = event.target.getAttribute("data-id");
      if (confirm("Are you sure you want to delete this book?")) {
        deleteBook(bookId);
      }
    }
  });

  function displayBooks(books) {
    booksList.innerHTML = books.map(book => `
      <div class="book-card collection-card">
        <div class="book-content">
           ${book.coverUrl && book.coverUrl !== 'default-cover.jpg' 
            ? `<img src="${book.coverUrl}" alt="Book cover">` 
            : `<div class="book-icon" ><i class="fas fa-book"></i></div><br><br><br><br><br>`}
          <h3>${escapeHtml(book.title)}</h3>
          <p><i class="fas fa-user-edit"></i> ${escapeHtml(book.author)}</p>
          <p><i class="fas fa-calendar-alt"></i> ${book.year}</p>
          <p class="book-date"><small>Added on: ${new Date(book.createdAt).toLocaleDateString()}</small></p>
          <button class="btn btn-primary delete-book-btn" data-id="${book._id}"><i class="fas fa-trash-alt"></i>Delete</button>
        </div>
      </div>
    `).join('');
  }

  function deleteBook(bookId) {
    fetch(`${getApiUrl()}/api/books/${bookId}`, { method: "DELETE" })
      .then(response => response.json())
      .then(() => {
        fetchBooks();
      })
      .catch(error => console.error("Error deleting book:", error));
  }

  function displayApiResults(books) {
    apiResults.innerHTML = books.slice(0, 10).map(book => {
      const coverImage = book.cover_i 
        ? `<img src="https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg" alt="Book cover" class="book-cover">`
        : `<div class="book-icon"><i class="fas fa-book-open"></i></div>`;

      return `
      <div class="book-card search-card">
        <div class="book-header">
          ${coverImage}
          <h3>${escapeHtml(book.title)}</h3>
        </div>
        <div class="book-details">
          <p><i class="fas fa-user-edit"></i> ${book.author_name ? escapeHtml(book.author_name.join(', ')) : 'Unknown'}</p>
          <p><i class="fas fa-calendar-alt"></i> ${book.first_publish_year || 'Unknown'}</p>
          <p><i class="fas fa-globe"></i> ${book.language ? book.language.slice(0, 3).join(', ') : 'Not specified'}</p>
          ${book.subject ? `<p class="book-subjects"><i class="fas fa-tag"></i> ${book.subject.slice(0, 3).join(', ')}</p>` : ''}
        </div>
        <!-- ADDED A "Save to Collection" button while searching the API for new books -->
        <button class="btn btn-primary save-book-btn" 
          data-title="${escapeHtml(book.title)}"
          data-author="${escapeHtml(book.author_name ? book.author_name[0] : 'Unknown')}"
          data-year="${book.first_publish_year || 'Unknown'}"
          data-coverUrl="${book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : 'default-cover.jpg'}">
          Save to Collection
        </button>
      </div>
    `}).join('');

    // Add to collection functionality
    document.querySelectorAll('.save-book-btn').forEach(button => {
      button.addEventListener('click', (event) => {
        const bookData = {
          title: event.target.getAttribute("data-title"),
          author: event.target.getAttribute("data-author"),
          year: event.target.getAttribute("data-year"),
          coverUrl: event.target.getAttribute("data-coverUrl")
        };
        // Save to db
        fetch(`${getApiUrl()}/api/books`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookData)
        })
        .then(response => response.json())
        .then(data => {
          showNotification(`"${data.title}" saved successfully!`);
          fetchBooks();
        })
        .catch(error => {
          showNotification('Failed to save book.', true);
        });
      });
    });
  }

  // Helper function to prevent XSS attacks [ESCAPE ANY DANGEROUS CHARACTERS]
  function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return '';
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Simple notification system
  function showNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.className = `notification ${isError ? 'error' : 'success'}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500);
    }, 5000);
  }
document.getElementById('clearCollectionBtn').addEventListener('click', function() {
    if (confirm('Are you sure you want to clear your entire collection?')) {
      fetch(`${getApiUrl()}/api/books`, { method: 'DELETE' })
        .then(response => {
          if (!response.ok) throw new Error('Failed to clear collection');
          return response.json();
        })
        .then(() => {
          fetchBooks(); // Refresh the collection display
          showNotification('Your collection has been cleared!');
        })
        .catch(error => {
          console.error('Error:', error);
          showNotification('Failed to clear collection. Please try again.', true);
        });
    }
  });

});