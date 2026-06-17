const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./data/bibles.db", (err) => {
  if (err) {
    console.error("DB Error:", err.message);
  } else {
    console.log("Connected to SQLite DB");
  }
});

module.exports = db;