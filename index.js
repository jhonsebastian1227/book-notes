import express, { text } from "express";
import bodyParser  from "body-parser";
import axios from "axios";
import pg from "pg";

let title = [];
let covers = [];
const app = express();
const port = 3000;
const API_URL = "https://openlibrary.org/";
const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "readbook",
    password: "postgres",
    port: 5432,
});

db.connect();

app.use(express.static("public"));
app.use(bodyParser.urlencoded( { extended: true } ))


app.get("/", async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM book ORDER BY id DESC");
        res.render("index.ejs", { books: result.rows, user_name: "Sebastian", activity: "Books I've read" });
    } catch (err) {
        console.log(err);
    }
});

app.post("/delete", async (req, res) => {
    try {
        const id = req.body.deleteId;
        await db.query("DELETE FROM book WHERE id = $1", [id]);
        res.redirect("/");
    } catch (err) {
        console.log(err);
    }
});

async function searchBook(req, res, title) {
    const result = await axios.get(API_URL +  `search.json?title=${title.title}`);
    if (result.data.numFound !== 0) {
        covers = [];
        result.data.docs.forEach((doc) => {
            if (doc.hasOwnProperty('cover_i')) {
                covers.push(doc.cover_i);
            }
        });
        return res.render("search.ejs", { cover_i: covers, activity: "Searched book: " + title.title });;
    } else {
        return res.render("search.ejs", { activity: "Book Not Found" });
    }
}
app.post("/search", async (req, res) => {
    try {
        title = req.body;
        await searchBook(req, res, title);
    } catch (err) {
        console.log(err);
    }
});

async function searchAndAdd(book) {
    const result = await axios.get(API_URL +  `search.json?title=${title.title}`);
    if (result.data.numFound !== 0) {
        covers = [];
        result.data.docs.forEach((doc) => {
            if (doc.hasOwnProperty('cover_i')) {
                if (doc.cover_i == book) {
                    covers.push(doc);
                    return;
                }
            }
        });
    } else {
        return console.log("No encontrado");
    }
}
app.post("/add", async (req, res) => {
    try {
        const book = Object.keys(req.body)[0];
        await searchAndAdd(book);
        res.render("add-edit.ejs", { activity: "add", url: "/add/data-base", covers: covers, user_name: "Sebastian" });
    } catch (err) {
        console.log(err);
    }
});

app.post("/edit", async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM book WHERE id = $1", [req.body.editId]);
        res.render("add-edit.ejs", { activity: "edit", url: "/edit/data-base", covers: result.rows, user_name: "Sebastian" });
    } catch (err) {
        console.log(err);
    }
});

app.post("/add/data-base", async (req, res) => {
    try {
        const items = Object.values(req.body);
        items.shift()
        await db.query("INSERT INTO book (user_name, cover_i, title, author_name, date_read, book_summary) VALUES ($1, $2, $3, $4, $5, $6)", items );
        res.redirect("/");
    } catch (err) {
        console.log(err);
    }
});

app.post("/edit/data-base", async (req, res) => {
    try {
        const items = Object.values(req.body);
        await db.query("UPDATE book SET user_name = ($2), cover_i = ($3), title = ($4), author_name = ($5), date_read = ($6), book_summary = ($7)  WHERE id = $1", items );
        res.redirect("/");
    } catch (err) {
        console.log(err);
    }
    
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
