const express = require("express");
const path = require("path");
const db = require("./db");

const app = express();
app.use(express.json());

// Serve HTML files from /public
app.use(express.static(path.join(__dirname, "public")));

app.get("/books", (req, res) => {
    db.all(
        `SELECT DISTINCT book_id, book FROM verses ORDER BY book_id`,
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).json(err);
            }

            res.json(rows);
        }
    );
});

app.get("/chapters", (req, res) => {

    db.all(
        `SELECT DISTINCT book_id, chapter
        FROM verses
        ORDER BY book_id, chapter`,
        [],
        (err, rows) => {
            if (err) return res.status(500).json(err);

            res.json(rows);
        }
    )
})

app.get("/verses", (req, res) => {

    db.all(
        `SELECT DISTINCT verse, book_id, chapter
        FROM verses
        ORDER BY book_id, chapter, verse`,
        [],
        (err, rows) => {
            if (err) return res.status(500).json(err);

            res.json(rows);
        }
    )
})

app.get("/translations", (req, res) => {

    db.all(
        `SELECT DISTINCT translation
        FROM verses
        ORDER BY translation`,
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).json(err);
            }

            res.json(rows);
        }
    );
});

app.get("/chapters/:book_id", (req, res) => {
    const bookId = req.params.book_id;

    db.all(
        `SELECT DISTINCT chapter
        FROM verses
        WHERE book_id = ?
        ORDER BY chapter`
    [bookId],
    (err, rows) => {
        if (err) {
            return res.status(500).json(err);
        }

        res.json(rows);
        }
    );
});

app.get("/book/:book_id/chapter/:chapter/:translation", (req, res) => {
  const bookId = req.params.book_id;
  const chapter = req.params.chapter;
  const translation = req.params.translation;

  db.all(
    `
    SELECT *
    FROM verses
    WHERE book_id = ?
      AND chapter = ?
      AND translation = ?
    ORDER BY verse
    `,
    [bookId, chapter, translation],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json(rows);
    }
  );
});

// 404 fallback
app.use((req, res) => {
  res.status(404).send("Not found");
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});