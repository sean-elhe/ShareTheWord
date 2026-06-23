const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const crypto = require("crypto");
const path = require("path");
const db = require("./db");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const sessions = {};

io.on("connection", socket => {

    console.log("Connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("Disconnected:", socket.id);

        for (const session of Object.values(sessions)) {

            if (session.hostId === socket.id) {
                session.hostId = null;
            }
        }
    });

    socket.on("join-session", sessionId => {
        const session = sessions[sessionId];

        if (!session) {
            return;
        }

        socket.join(sessionId);


        if (!session.hostId) {
            session.hostId = socket.id;
            console.log("Host assigned:", socket.id)
        }

        socket.emit("session-state", {
            sessionId,
            ...session,
            isHost: session.hostId === socket.id
        });
    });

    socket.on("navigate", data => {
        const session = sessions[data.sessionId];
        if (!session) return;

        session.bookId = data.bookId;
        session.chapterId = data.chapterId;
        session.translationId = data.translationId;
        session.verseId = data.verseId;

        if ("selectedVerse" in data ) {
            session.selectedVerse = data.selectedVerse;
        }

        io.to(data.sessionId).emit("navigate", {
            ...session,
            source: data.source
        });        
    });
});

app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.post("/session", (req, res) => {
    const sessionId = crypto.randomUUID();

    sessions[sessionId] = {
        bookId: req.body.bookId ?? 1,
        chapterId: req.body.chapterId ?? 1,
        verseId: req.body.verseId ?? 1,
        translationId: req.body.translationId ?? "ESV",
        hostId: null,
        lastActivity: Date.now()
    };

    res.json({ sessionId });
})

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
        ORDER BY chapter`,
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

server.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
});