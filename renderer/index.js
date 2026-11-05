const { ipcRenderer } = require('electron');
const searchBtn = document.getElementById('searchBtn');
const resultDiv = document.getElementById('result');
const watchlistBtn = document.getElementById('watchlistBtn');
const viewWatchlistBtn = document.getElementById('viewWatchlistBtn');
const resultTitle = document.getElementById('resultTitle');
const suggestionDiv = document.getElementById('suggestion');
let currentMovie = null;

  const apiKey = 'YOUR_API_KEY'; // Replace with your MyMovie API key

  searchBtn.addEventListener('click', async() => {
    const movieTitle = document.getElementById('movie').value.trim();

    if (!movieTitle){
      alert('Please enter a movie name');
      return;
    }

    resultDiv.innerHTML = '<p> Searching for movies... </p>';
    resultTitle.textContent = '';

     const url =`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(movieTitle)}`;

     try{
     // fetch movie punye data from the website TMDB
      const res = await fetch(url);

      if(!res.ok){
        throw new Error('Failed to retrieve movie data');
      }

      //convert response into JSON
      const data = await res.json();

      // to check if movie result tu avail or not 
      if(!data.results || data.results.length === 0){
        resultDiv.innerHTML = '<p> No movies found. Please try another title.</p>';
        return;
      }

      resultTitle.textContent = `Search Results for "${movieTitle}"`;
      resultDiv.innerHTML='';
      
      //display all matching movies
      data.results.forEach(movie => {
        const poster = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        :'';

        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';
        movieCard.innerHTML= `
        ${poster
          ? `<img src="${poster}" alt="Movie Poster">`
          : '<p>No poster available.</p>'}

        <h3>${escapeHTML(movie.title || 'Untitled')}</h3>
        <p>
          <strong>Rating:</strong>
          ${Number(movie.vote_average || 0).toFixed(1)}/10
        </p>

        <p>
        <strong>Release Date:</strong>
        ${escapeHTML(movie.release_date || 'Unknown')}
        </p>
        
        <p>
          <strong>Overview:</strong>
          ${escapeHTML(movie.overview || 'No description available')}
        </p>
        
        <button class="addWatchlistBtn">
        ❤️ Add to Watchlist
        </button>
        `;
    
  // add selected movie to watchlist
        const addButton = movieCard.querySelector('.addWatchlistBtn');

        addButton.addEventListener('click', () =>{
          ipcRenderer.send('open-watchlist-window', movie);
        });

        resultDiv.appendChild(movieCard);
      });

      viewWatchlistBtn.addEventListener('click', () => {
        ipcRenderer.send('open-watchlist-window');
      })

     }catch (error){
      console.error('Movie API Error', error);
     }
});

function escapeHTML(text) {
    return String(text).replace(/[&<>"']/g, function(character) {
        const entities = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };

        return entities[character];
    });
}

//movie recommendation based on selected genre 
const genreSelect = document.getElementById('genreSelect');
const recommendBtn = document.getElementById('recommendBtn');

recommendBtn.addEventListener('click', async () => {
  const genreId = genreSelect.value;
  const genreName = genreSelect.options[genreSelect.selectedIndex].text;

  //check whether the genre is selected 
  if(!genreId){
    alert('Please select a movie genre first.')
    return;
  }

  suggestionDiv.innerHTML = '<p>Finding movie recommendations...</p>';
  const url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${genreId}&sort_by=popularity.desc`;

  try{
    //fetch movie data from TMDB
    const res = await fetch(url);
    if(!res.ok){
      throw new Error('Failed to retrieve recommendations');
    }
    
    //convert the response into JSON
    const data = await res.json();

    //check whether recommendations are available 
    if(!data.results || data.results.length > 0){
      let minRating;
      let reason;
      switch(genreId){
        case '28': minRating = 6.5; reason = 'Full of Action'; break;
        case '35': minRating = 6.0; reason = 'Suitable for Laugh'; break;
        case '27': minRating = 6.5; reason = 'Horror Story'; break;
        default: minRating = 7.0; reason = 'Popular Choices'; break;
      }

      const saved = JSON.parse (localStorage.getItem('watchlist')) || [];
      const suggestions = (data.results || []).filter(movie => 
        movie.vote_average >= minRating && 
        !saved.some(s => s.id === movie.id)
      ).slice(0,5);

      if(suggestions.length === 0){
        suggestionDiv.innerHTML = '<p>No suitable recommendation available right now.</p>';
        return;
      }

      localStorage.setItem('suggestions', JSON.stringify(suggestions));
      suggestionDiv.innerHTML =`<h3>Recommend ${escapeHTML(genreName)} Movies</h3><p>${reason}</p>`;

      //display the first 5 recommend movies 
      suggestions.forEach(movie =>{
        let label; 
        if(movie.vote_average >= 8){
          label = 'Highly Recommended';
        } else if (movie.vote_average >= 7){
          label = 'Good Pick';
        }else {
          label = 'Worth a Try';
        }

        const poster = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        :'';

        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';

        movieCard.innerHTML = `
        ${poster
          ?`<img src="${poster}" alt="Movie Poster">`
          : '<p>No poster available.</p>'
        }
        
        <h3>${escapeHTML(movie.title || 'Untitled')}</h3>
        <p><strong>Rating:</strong> ${Number(movie.vote_average || 0).toFixed(1)}
        <p><strong>Release Date:</strong> ${escapeHTML(movie.release_date || 'Unknown')}</p>
        <p>${escapeHTML(movie.overview || 'No description available')}</p>
        <button class="addWatchlistBtn">
        ❤️ Add to Watchlist
        </button>
        `;

        const addButton = movieCard.querySelector('.addWatchlistBtn');
        addButton.addEventListener('click', () => {
        ipcRenderer.send('open-watchlist-window', movie);
      });

        suggestionDiv.appendChild(movieCard);
      });
    } else {
      suggestionDiv.innerHTML='<p>No movies found for this genre</p>';
    }
  } catch (error){
    console.error('Recommendation Error: ', error);
    suggestionDiv.innerHTML = '<p>Unable to load recommendations. Please try again</p>';
  }
});