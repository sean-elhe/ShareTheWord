const { Server } = require("socket.io");
const { nanoid } = require("nanoid");

const db = require("./db");
const express = require("express");
const http = require("http");
const crypto = require("crypto");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const sessions = {};
const socketSessionMap = new Map();


app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

io.on("connection", socket => {

    console.log("Connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("Disconnected:", socket.id);

        const sessionId = socketSessionMap.get(socket.id);
        if (!sessionId) return;

        const session = sessions[sessionId];
        if (!session) return;

        if (session.hostId === socket.id) {
            session.hostId = null;
        }

        socketSessionMap.delete(socket.id);

        if (session.hostId === socket.id) {
            session.hostId = null;

            const next = session.sockets.values().next().value;
            if (next) session.hostId = next;
        }

        socketSessionMap.delete(socket.id);

       cleanupSessionIfEmpty(sessionId);
    });

    socket.on("leave-session", sessionId => {
        const session = sessions[sessionId];
        if (!session) return;

        session.sockets.delete(socket.id);
    });

    socket.on("join-session", sessionId => {
        const session = sessions[sessionId];
        if (!session) return;

        socket.join(sessionId);

        socketSessionMap.set(socket.id, sessionId)
        session.sockets.add(socket.id);

        if (!session.hostId) {
            session.hostId = socket.id;
        }

        socket.emit(
            "session-state", {
            sessionId,
            ...session,
            isHost: session.hostId === socket.id
        });
    });

    socket.on("navigate", data => {
        const session = sessions[data.sessionId];
        if (!session) return;

        session.selectedVerses = session.selectedVerses || [];

        session.bookId = data.bookId;
        session.chapterId = data.chapterId;
        session.translationId = data.translationId;
        session.verseId = data.verseId;

        if ("selectedVerses" in data ) {
            session.selectedVerses = data.selectedVerses;
        }

        io.to(data.sessionId).emit("navigate", {
            ...session,
            source: data.source
        });        
    });
});

app.post("/session", (req, res) => {
    const sessionId = nanoid(5);

    sessions[sessionId] = {
        bookId: req.body.bookId ?? 1,
        chapterId: req.body.chapterId ?? 1,
        verseId: req.body.verseId ?? 1,
        translationId: req.body.translationId ?? "ESV",
        hostId: null,
        lastActivity: Date.now(),

        sockets: new Set ()
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

function cleanupSessionIfEmpty(sessionId) {
    const session = sessions[sessionId];
    if (!session) return;

    if (session.sockets.size === 0) {
        delete sessions[sessionId];
        console.log("Deleted empty session:", sessionId);
    }
}

app.get("/link/:sessionId", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 404 fallback
app.use((req, res) => {
  res.status(404).send("Not found");
});

server.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
});

