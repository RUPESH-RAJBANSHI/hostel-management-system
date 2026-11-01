require("dotenv").config();
const { Client } = require("pg");

const c = new Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 60000,
});
const t = Date.now();

c.connect()
  .then(() => c.query("select 1"))
  .then(() => {
    console.log("OK in", Date.now() - t, "ms");
    return c.end();
  })
  .catch((e) => {
    console.error("FAILED after", Date.now() - t, "ms:", e.message);
    process.exit(1);
  });
