import express from "express";
import pg from "pg";

const app = express();
const port = 3000;

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Database connection
const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "musical-player",
    password: "star",  
    port: 5432,
});
db.connect();

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

// Function to fetch song data from the database
async function testFunction() {
    const display = await db.query("SELECT * FROM songlist");  // Adjust to your table name
    let songInfo = display.rows;  // Retrieve rows
    return songInfo;
}

app.use(express.static('public'));

// Homepage Route (Display songs)
app.get("/", async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM songlist');
        const songInfo = result.rows;  // Fetch songs from database
        res.render('index', { songInfo });
    } catch (err) {
        console.error('Error fetching songs:', err);
        res.status(500).send('Server Error');
    }
});

// Music player page - Display specific song
app.get('/player/:songId', async (req, res) => {
    const { songId } = req.params;
    try {
        const result = await db.query('SELECT * FROM songlist WHERE id = $1', [songId]);
        const song = result.rows[0];  // Get the song from the database
        res.render('player', { song });  // Render the player.ejs page with song details
    } catch (err) {
        console.error('Error fetching song:', err);
        res.status(500).send('Server Error');
    }
});

// Browse music page (view songs)
app.get('/browse', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM songlist');
        const songInfo = result.rows.length ? result.rows : [{ title: 'Sample Song', artist: 'Unknown', album: 'Sample Album' }];  // Dummy song if no data
        res.render('browse', { songInfo });
    } catch (err) {
        console.error('Error fetching songs:', err);
        res.status(500).send('Server Error');
    }
});

// Create new playlist page
app.get('/create-playlist', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM songlist');
        const songInfo = result.rows.length ? result.rows : [{ title: 'Sample Song', artist: 'Unknown', album: 'Sample Album' }];  // Dummy song if no data
        res.render('create_playlist', { songInfo });
    } catch (err) {
        console.error('Error fetching songs:', err);
        res.status(500).send('Server Error');
    }
});

// User profile page
app.get('/profile', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM playlists');
        const playlists = result.rows.length ? result.rows : [{ id: 1, name: 'Sample Playlist' }];  // Dummy playlist if no data
        res.render('profile', { playlists });
    } catch (err) {
        console.error('Error fetching playlists:', err);
        res.status(500).send('Server Error');
    }
});

// Create new playlist (POST)
app.post('/playlists', async (req, res) => {
  const { name, playlist } = req.body;  // Get playlist name and songs from the request body
  try {
      // Create the playlist
      const result = await db.query('INSERT INTO playlists (name) VALUES ($1) RETURNING *', [name]);
      const newPlaylist = result.rows[0];

      // Add songs to the playlist_songs table
      playlist.forEach(async (songId) => {
          await db.query('INSERT INTO playlist_songs (playlist_id, song_id) VALUES ($1, $2)', [newPlaylist.id, songId]);
      });

      res.json({ message: 'Playlist saved successfully!' });
  } catch (err) {
      console.error('Error creating playlist:', err);
      res.status(500).send('Server Error');
  }
});

app.use(express.json());

// Add song to playlist
app.post('/playlists/:playlistId/songs', async (req, res) => {
    const { playlistId } = req.params;
    const { songId } = req.body;

    try {
        await db.query('INSERT INTO playlist_songs (playlist_id, song_id) VALUES ($1, $2)', [playlistId, songId]);
        res.redirect(`/playlists/${playlistId}`);
    } catch (err) {
        console.error('Error adding song to playlist:', err);
        res.status(500).send('Server Error');
    }
});

// Playlist View Page
app.get('/profile_playlist/:playlistId', async (req, res) => {
  try {
      const { playlistId } = req.params;
      const result = await db.query(
          'SELECT songlist.* FROM songlist JOIN playlist_songs ON songlist.id = playlist_songs.song_id WHERE playlist_songs.playlist_id = $1',
          [playlistId]
      );
      const playlistSongs = result.rows;
      res.render('profile_playlist', { playlistSongs });
  } catch (error) {
      console.error('Error fetching playlist songs:', error);
      res.status(500).send('Server Error');
  }
});

// Listen to requests on the specified port
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
