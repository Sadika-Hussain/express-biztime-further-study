/** Database setup for BizTime. */
const { Client } = require("pg");
const config = require("./config");
let DB_URI;

if (process.env.NODE_ENV === "test") {
    DB_URI = config.TEST_DB_URI || "postgresql:///biztime_test";
} else {
    DB_URI =  config.DATABASE_URL || "postgresql:///biztime";
}

let db = new Client({
    connectionString: DB_URI
});

db.connect();

module.exports = db;