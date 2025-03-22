import express from "express";
import pg from "pg";

const app = express();
const port = 3000;

// Set EJS as the view engine (for rendering HTML templates)
app.set('view engine', 'ejs');

// Database connection setup
const db = new pg.Client({
    user: "postgres",  
    host: "localhost", 
    database: "musical-player", 
    password: "star",  // Database password
    port: 5432,        
});
db.connect();  // Establish the connection to the database

app.use(express.urlencoded({ extended: true }));  // Middleware to parse form data (URL-encoded)

app.use(express.static('public'));  // Serve static files from 'public' folder (e.g., CSS)

// Function to fetch song data from the database
async function testFunction() {
    const display = await db.query("SELECT * FROM songlist");  // Query the 'songlist' table for all songs
    let songInfo = display.rows;  // Retrieve the result rows from the query
    return songInfo;  // Return the song data
}

// ==========================================
// USER FLOW: HOMEPAGE ROUTE AND INTERACTION
// ==========================================

// Homepage Route (Display songs)
// Route: '/'
app.get("/", async (req, res) => {
    try {
        // Query the 'songlist' table to fetch all songs
        const result = await db.query('SELECT * FROM songlist');
        const songInfo = result.rows;  // Get the rows of song data from the query
        
        // Render the 'index.ejs' page and pass the song data to it
        res.render('index', { songInfo });  // Display all songs on the homepage
    } catch (err) {
        console.error('Error fetching songs:', err);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// USER FLOW: MUSIC PLAYER PAGE
// ==========================================

// Music player page - Display specific song
// Route: '/player/:songId'
// ':songId' is a URL parameter to fetch a specific song by ID
app.get('/player/:songId', async (req, res) => {
    const { songId } = req.params;  // Extract the 'songId' from the URL
    try {
        // Query the 'songlist' table to fetch the song with the specific 'songId'
        const result = await db.query('SELECT * FROM songlist WHERE id = $1', [songId]);
        const song = result.rows[0];  // Get the song data from the result
        
        // Render the 'player.ejs' page and pass the song data to it
        res.render('player', { song });  // Show the music player page for the selected song
    } catch (err) {
        console.error('Error fetching song:', err);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// USER FLOW: BROWSE MUSIC PAGE
// ==========================================

// Browse music page (view songs)
// Route: '/browse'
// This page shows a list of all songs to the user
app.get('/browse', async (req, res) => {
    try {
        // Query the 'songlist' table to fetch all songs
        const result = await db.query('SELECT * FROM songlist');
        const songInfo = result.rows.length ? result.rows : [{ title: 'Sample Song', artist: 'Unknown', album: 'Sample Album' }];
        
        // Render the 'browse.ejs' page and pass the song data to it
        res.render('browse', { songInfo });
    } catch (err) {
        console.error('Error fetching songs:', err);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// USER FLOW: CREATE NEW PLAYLIST PAGE
// ==========================================

// Create new playlist page
// Route: '/create-playlist'
// This page allows users to create a new playlist by selecting songs
app.get('/create-playlist', async (req, res) => {
    try {
        // Query the 'songlist' table to fetch all songs
        const result = await db.query('SELECT * FROM songlist');
        const songInfo = result.rows.length ? result.rows : [{ title: 'Sample Song', artist: 'Unknown', album: 'Sample Album' }];
        
        // Render the 'create_playlist.ejs' page and pass the song data to it
        res.render('create_playlist', { songInfo });
    } catch (err) {
        console.error('Error fetching songs:', err);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// USER FLOW: USER PROFILE PAGE
// ==========================================

// User profile page
// Route: '/profile'
// This page shows the user's playlists
app.get('/profile', async (req, res) => {
    try {
        // Query the 'playlists' table to fetch all playlists for the user
        const result = await db.query('SELECT * FROM playlists');
        const playlists = result.rows.length ? result.rows : [{ id: 1, name: 'Sample Playlist' }];
        
        // Render the 'profile.ejs' page and pass the playlist data to it
        res.render('profile', { playlists });
    } catch (err) {
        console.error('Error fetching playlists:', err);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// USER FLOW: CREATE NEW PLAYLIST (POST)
// ==========================================

// Create new playlist (POST)
// Route: '/playlists'
// This route handles the creation of a new playlist and saving it in the database
app.post('/playlists', async (req, res) => {
  const { name, playlist } = req.body;  // 'name' is the playlist name, 'playlist' is an array of song IDs
  try {
    // Insert the new playlist into the 'playlists' table
    const result = await db.query('INSERT INTO playlists (name) VALUES ($1) RETURNING *', [name]);
    const newPlaylist = result.rows[0];  // Get the newly created playlist data

    // Insert the selected songs into the 'playlist_songs' table
    for (const songId of playlist) {
      await db.query('INSERT INTO playlist_songs (playlist_id, song_id) VALUES ($1, $2)', [newPlaylist.id, songId]);
    }

    // Redirect to the profile page to show the newly created playlist
    res.redirect('/profile');
  } catch (err) {
    console.error('Error creating playlist:', err);
    res.status(500).send('Server Error');
  }
});

// ==========================================
// USER FLOW: ADD SONG TO PLAYLIST (POST)
// ==========================================

// Add song to playlist (POST)
// Route: '/playlists/:playlistId/songs'
// This route allows adding a song to a specific playlist
app.post('/playlists/:playlistId/songs', async (req, res) => {
    const { playlistId } = req.params;  // Get the playlistId from the URL
    const { songId } = req.body;  // Get the songId from the request body

    try {
        // Insert the song into the 'playlist_songs' table to associate it with the playlist
        await db.query('INSERT INTO playlist_songs (playlist_id, song_id) VALUES ($1, $2)', [playlistId, songId]);
        
        // Redirect to the updated playlist page
        res.redirect(`/playlists/${playlistId}`);
    } catch (err) {
        console.error('Error adding song to playlist:', err);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// USER FLOW: PLAYLIST VIEW PAGE
// ==========================================

// Playlist View Page
// Route: '/playlist/:playlistId'
// This route displays the songs in a specific playlist
app.get('/playlist/:playlistId', async (req, res) => {
  const { playlistId } = req.params;  // Get the playlistId from the URL parameters
  try {
      // Query to get the songs in the specific playlist
      const result = await db.query(
          'SELECT songlist.* FROM songlist ' +
          'JOIN playlist_songs ON songlist.id = playlist_songs.song_id ' +
          'WHERE playlist_songs.playlist_id = $1', 
          [playlistId]
      );
      
      const songsInPlaylist = result.rows; // Array of songs in the playlist
      
      // Fetch the playlist name for display
      const playlistResult = await db.query('SELECT * FROM playlists WHERE id = $1', [playlistId]);
      const playlist = playlistResult.rows[0]; // Playlist data
      
      // Render the 'profile_playlist.ejs' template and pass the songs and playlist details
      res.render('profile_playlist', { songsInPlaylist, playlist });
  } catch (error) {
      console.error('Error fetching playlist data:', error);
      res.status(500).send('Error fetching playlist');
  }
});

// Start the server on the specified port (3000)
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
