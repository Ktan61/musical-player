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
    
    // GET home page
    app.get("/", async (req, res) => {
      let songInfo = await testFunction();  // Fetch song data
      res.render("index.ejs", { songInfo: songInfo });  // Pass the song data to the EJS view
      console.log(songInfo);  // Log the song info in the console
    });
    
    // Listen to requests on the specified port
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });