const { ipcRenderer } = require('electron');

let selectedMovie = null;

//receive selected movie
ipcRenderer.on('movie-selected', (event, movie) => {
  selectedMovie = movie;

  document.getElementById('title').textContent = `My Watchlist - ${movie.title}`;

  document.getElementById('selectedMovie').innerHTML = `
  <h3>${escapeHTML(movie.title)}</h3>
  <p>Release Date: ${escapeHTML(movie.release_date || 'Unknown')}</p>
  <p>Rating: ${Number(movie.vote_average || 0).toFixed(1)}/10</p>
  `;
});

//get save movies from local storage
function getWatchlist() {
  return JSON.parse(localStorage.getItem('watchlist')) || [];
}

//calculate watch progress 
function calculateWatchProgress(){
  const movies = getWatchlist();
  const totalMovies = movies.length;
  const WatchedMovies = movies.filter(movie => {
    return movie.watched === true;
  }).length

  if(totalMovies === 0){
    return 0;
  }
  return (WatchedMovies / totalMovies)*100;
}

//calculate average movie rating
function calculateAverageRating(){
  const movies = getWatchlist();

  if(movies.length === 0){
    return 0;
  }

  const totalRating = movies.reduce((total, movie) => {
    return total + Number(movie.vote_average || 0);
  }, 0);

  return totalRating / movies.length;
}

//display watchlist calculations 
function displayCalculations(){
  const progress = calculateWatchProgress();
  const average = calculateAverageRating();

  document.getElementById('watchProgress').textContent = 
  `Watch Progress: ${progress.toFixed(1)}%`;

  document.getElementById('averageRating').textContent = 
  `Average Movie Rating: ${average.toFixed(1)}/10`;
}

//save movies from local storage
function saveMovie(data){
  const movies = getWatchlist();
  movies.push(data);
  localStorage.setItem('watchlist', JSON.stringify(movies));
}

//display saved movies
function displayWatchlist(){
  const movies = getWatchlist();

  const watchlistDiv = document.getElementById('watchlist');

  if(movies.length === 0){
    watchlistDiv.innerHTML = '<p>Your Watchlist is Empty.</p>';
    return;
  }

  //READ
  watchlistDiv.innerHTML = movies.map(movie => `
    <div class="movie-card">
    <h3>${escapeHTML(movie.title)}</h3>
    <p>Release Date: ${escapeHTML(movie.release_date || 'Unknown')}</p>
    <p>Status:${movie.watched ? 'Watched' : 'Not Watched'}</p>

    <button class="watchedBtn" data-id="${Number(movie.id)}">
    ${movie.watched ? 'Mark as Not Watched' : 'Mark as Watched'}
    </button>

    <button class="deleteBtn" data-id="${Number(movie.id)}">
    🗑️ Remove Movie
    </button>

    </div>
  `).join('');

 // Update movie watched status
    document.querySelectorAll('.watchedBtn').forEach(button => {
        button.addEventListener('click', () => {
            const movieId = Number(button.dataset.id);

            const updatedMovies = getWatchlist().map(movie => {
                if (movie.id === movieId) {
                    movie.watched = !movie.watched;
                }

                return movie;
            });

            localStorage.setItem('watchlist', JSON.stringify(updatedMovies));

            displayWatchlist();
            displayCalculations();
        });
    });

    // Delete movie from watchlist
    document.querySelectorAll('.deleteBtn').forEach(button => {
        button.addEventListener('click', () => {
            const movieId = Number(button.dataset.id);

            const confirmDelete = confirm(
                'Are you sure you want to remove this movie?'
            );

            if (!confirmDelete) {
                return;
            }

            const updatedMovies = getWatchlist().filter(movie => {
                return movie.id !== movieId;
            });

            localStorage.setItem('watchlist', JSON.stringify(updatedMovies));

            displayWatchlist();
            displayCalculations();
        });
    });
}

//save button
document.getElementById('saveBtn').addEventListener('click', () => {

  if (!selectedMovie) {
    alert('Please select a movie first.');
    return;
  }

  const movies = getWatchlist();

  //chech duplicate movie
  const alreadyExists = movies.some(movie => movie.id === selectedMovie.id);

  if(alreadyExists){
    alert('This movie is already in your watchlist.');
    return;
  }

  //CREATE 
  saveMovie({
    id: selectedMovie.id,
    title: selectedMovie.title,
    release_date: selectedMovie.release_date,
    vote_average: selectedMovie.vote_average,
    watched: false
  });

  alert('Movie saved successfully!');

  displayWatchlist();
  displayCalculations();
});

function escapeHTML(text){
    return String(text).replace(/[&<>"']/g, function(character){
      const entities={
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
       '"': '&quot;',
        "'": '&#039;'
      };

      return entities[character]
    });
  }

displayWatchlist();
displayCalculations();