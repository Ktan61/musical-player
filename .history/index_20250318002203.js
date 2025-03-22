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

app.use(express.urlencoded({extended: true})); 

/// FUNCTIONS
// Serve static files (like styles, images)
app.use(express.static(path.join(__dirname, 'public')));

// Homepage Route
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM songlist');
    const songInfo = result.rows;  // Fetch all songs
    res.render('index', { songInfo });
  } catch (err) {
    console.error('Error fetching songs:', err);
    res.status(500).send('Server Error');
  }
});

// Music Player Route (to play a specific song)
app.get('/player/:songId', async (req, res) => {
  const { songId } = req.params;
  try {
    const result = await pool.query('SELECT * FROM songlist WHERE id = $1', [songId]);
    const song = result.rows[0];
    res.render('player', { song });
  } catch (err) {
    console.error('Error fetching song:', err);
    res.status(500).send('Server Error');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});