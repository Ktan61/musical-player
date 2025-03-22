import express from "express";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "musical-player",
    password: "star",  
    port: 5432,
});
    db.connect();

    app.use(express.urlencoded({ extended: true }));

    // Function to fetch song data from the database
    async function testFunction() {
      const display = await db.query("SELECT * FROM songlist");  // Adjust to your table name
      let songInfo = display.rows;  // Retrieve rows
      return songInfo;
    }
    
    // Homepage Route
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
    
    // View playlists - Show user's playlists
    app.get('/playlists', async (req, res) => {
        try {
        const result = await db.query('SELECT * FROM playlists');
        const playlists = result.rows;
        res.render('playlists', { playlists });
        } catch (err) {
        console.error('Error fetching playlists:', err);
        res.status(500).send('Server Error');
        }
    });
    
    // Create new playlist
    app.post('/playlists', async (req, res) => {
        const { name } = req.body;
        try {
        const result = await db.query('INSERT INTO playlists (name) VALUES ($1) RETURNING *', [name]);
        const newPlaylist = result.rows[0];
        res.redirect(`/playlists/${newPlaylist.id}`);
        } catch (err) {
        console.error('Error creating playlist:', err);
        res.status(500).send('Server Error');
        }
    });

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
  
  
    // Listen to requests on the specified port
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });