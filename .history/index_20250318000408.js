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
async function testFunction(){

    const display = await db.query("SELECT * FROM songlist"); 
    let songInfo = display.rows;
    return songInfo;
    
    }

/// GET home page
app.get("/", async (req, res) => {

    let songInfo = await testFunction();

    res.render("index.ejs", {songInfo: songInfo});

    console.log(songInfo);

    });


/// LISTEN
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

