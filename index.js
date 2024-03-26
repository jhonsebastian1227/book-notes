// Importaciones
import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";

// Variables globales a usar en la creación de la app y la base de datos
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

// Conexión a la base de datos
db.connect();

// Agregar archivos estáticos
app.use(express.static("public"));

// Parsear el cuerpo de las solicitudes
app.use(bodyParser.urlencoded({ extended: true }));

// Obtener datos de la base de datos
app.get("/", async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM book ORDER BY id DESC");
        res.render("index.ejs", { books: result.rows, user_name: "Sebastian", activity: "Books I've read" });
    } catch (err) {
        console.log(err);
    }
});

// Borrar libro de la base de datos
app.post("/delete", async (req, res) => {
    try {
        const id = req.body.deleteId;
        await db.query("DELETE FROM book WHERE id = $1", [id]);
        res.redirect("/");
    } catch (err) {
        console.log(err);
    }
});

// Función para buscar el libro en la base de datos
async function searchBook(req, res, title) {
    const result = await axios.get(API_URL + `search.json?title=${title.title}`);
    if (result.data.numFound !== 0) {
        covers = [];
        result.data.docs.forEach((doc) => {
            if (doc.hasOwnProperty('cover_i')) {
                covers.push(doc.cover_i);
            }
        });
        return res.render("search.ejs", { cover_i: covers, activity: "Searched book: " + title.title });
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

// Función para añadir datos a la base de datos
async function searchAndAdd(book) {
    const result = await axios.get(API_URL + `search.json?title=${title.title}`);
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

// Editar libro de la base de datos
app.post("/edit", async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM book WHERE id = $1", [req.body.editId]);
        res.render("add-edit.ejs", { activity: "edit", url: "/edit/data-base", covers: result.rows, user_name: "Sebastian" });
    } catch (err) {
        console.log(err);
    }
});

// Se añade el nuevo libro a la base de datos
app.post("/add/data-base", async (req, res) => {
    try {
        const items = Object.values(req.body);
        items.shift();
        await db.query("INSERT INTO book (user_name, cover_i, title, author_name, date_read, book_summary) VALUES ($1, $2, $3, $4, $5, $6)", items);
        res.redirect("/");
    } catch (err) {
        console.log(err);
    }
});

// Se añaden los cambios en la base de datos
app.post("/edit/data-base", async (req, res) => {
    try {
        const items = Object.values(req.body);
        await db.query("UPDATE book SET user_name = ($2), cover_i = ($3), title = ($4), author_name = ($5), date_read = ($6), book_summary = ($7)  WHERE id = $1", items);
        res.redirect("/");
    } catch (err) {
        console.log(err);
    }

});

// Manejar el evento de cierre del servidor Express
const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

server.on('close', () => {
    db.end(); // Cerrar la conexión a la base de datos
    console.log('Server stopped. Database connection closed');
});

// Cerrar el servidor cuando se presione Ctrl+C en la consola
process.on('SIGINT', () => {
    server.close(); // Detener el servidor Express
});

// Cerrar la conexión a la base de datos cuando el proceso de Node.js esté a punto de finalizar
process.on('exit', () => {
    db.end();
    console.log('Database connection closed');
});
