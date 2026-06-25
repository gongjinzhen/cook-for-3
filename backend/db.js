const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const DB_PATH = path.join(__dirname, "cook.db");
const DATABASE_URL = process.env.DATABASE_URL;
const dbType = DATABASE_URL ? "postgres" : "sqlite";

let db = null; // sql.js Database instance
let pool = null; // pg Pool instance

function save() {
  if (dbType === "sqlite" && db) {
    fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
  }
}

function getTableName(sql) {
  var m = sql.match(/INSERT\s+INTO\s+(\w+)/i);
  return m ? m[1] : null;
}

function getLastId(table) {
  if (!table || dbType !== "sqlite") return 0;
  var r = db.exec("SELECT MAX(id) as id FROM " + table);
  return r && r[0] && r[0].values ? Number(r[0].values[0][0]) : 0;
}

// Convert ? to $1, $2, ... for PostgreSQL
function pgParams(sql, params) {
  var i = 0;
  var text = sql.replace(/\?/g, function() { return "$" + (++i); });
  return { text: text, values: params };
}

var dbModule = {
  prepare: function(sql) {
    var origSql = sql;
    return {
      run: function() {
        var params = Array.prototype.slice.call(arguments);
        if (dbType === "postgres") {
          var s = origSql;
          if (/^\s*INSERT\s+INTO/i.test(s) && !/RETURNING/i.test(s)) s += " RETURNING id";
          var p = pgParams(s, params);
          return pool.query(p.text, p.values).then(function(result) {
            return { lastInsertRowid: result.rows[0] ? result.rows[0].id : null };
          });
        } else {
          var stmt = db.prepare(origSql);
          stmt.bind(params);
          stmt.step();
          stmt.reset();
          save();
          return Promise.resolve({ lastInsertRowid: getLastId(getTableName(origSql)) });
        }
      },
      get: function() {
        var params = Array.prototype.slice.call(arguments);
        if (dbType === "postgres") {
          var p = pgParams(origSql, params);
          return pool.query(p.text, p.values).then(function(result) {
            return result.rows[0] || null;
          });
        } else {
          var stmt = db.prepare(origSql);
          stmt.bind(params);
          if (stmt.step()) {
            var cols = stmt.getColumnNames(), vals = stmt.get(), obj = {};
            cols.forEach(function(c, i) { obj[c] = vals[i]; });
            stmt.reset();
            return Promise.resolve(obj);
          }
          stmt.reset();
          return Promise.resolve(null);
        }
      },
      all: function() {
        var params = Array.prototype.slice.call(arguments);
        if (dbType === "postgres") {
          var p = pgParams(origSql, params);
          return pool.query(p.text, p.values).then(function(result) {
            return result.rows;
          });
        } else {
          var stmt = db.prepare(origSql);
          stmt.bind(params);
          var results = [];
          while (stmt.step()) {
            var cols = stmt.getColumnNames(), vals = stmt.get(), obj = {};
            cols.forEach(function(c, i) { obj[c] = vals[i]; });
            results.push(obj);
          }
          stmt.reset();
          return Promise.resolve(results);
        }
      }
    };
  },
  exec: function(sql) {
    if (dbType === "postgres") {
      return pool.query(sql).then(function() { return []; });
    } else {
      return db.exec(sql);
    }
  }
};

async function initDB() {
  if (dbType === "postgres") {
    var pg = require("pg");
    pool = new pg.Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
    console.log("PostgreSQL connected");

    // Create tables for PostgreSQL (use SERIAL instead of AUTOINCREMENT)
    await pool.query(`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE, password TEXT,
      nickname TEXT DEFAULT '', avatar TEXT DEFAULT '',
      role TEXT DEFAULT 'chef',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS recipes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER, name TEXT,
      cover TEXT DEFAULT '', tags TEXT DEFAULT '',
      nutrition TEXT DEFAULT '',
      ingredients TEXT DEFAULT '', steps TEXT DEFAULT '',
      is_signature INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      calories INTEGER DEFAULT 0,
      cook_time TEXT DEFAULT '',
      flavor TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      recipe_id INTEGER, orderer_id INTEGER, chef_id INTEGER,
      status TEXT DEFAULT 'pending', note TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS ratings (
      id SERIAL PRIMARY KEY,
      order_id INTEGER UNIQUE, recipe_id INTEGER,
      user_id INTEGER DEFAULT 0,
      score INTEGER, comment TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Seed default users if empty
    var userCount = await pool.query("SELECT COUNT(*) as cnt FROM users");
    if (parseInt(userCount.rows[0].cnt) === 0) {
      var h = bcrypt.hashSync("123456", 10);
      await pool.query("INSERT INTO users (username, password, nickname, role) VALUES ($1, $2, $3, $4)", ["chef", h, "\u5927\u53a8", "chef"]);
      await pool.query("INSERT INTO users (username, password, nickname, role) VALUES ($1, $2, $3, $4)", ["foodie", h, "\u5403\u8d27", "foodie"]);
      console.log("Users created");
    }
    console.log("DB ready");
  } else {
    var initSqlJs = require("sql.js");
    var SQL = await initSqlJs();
    if (fs.existsSync(DB_PATH)) {
      db = new SQL.Database(fs.readFileSync(DB_PATH));
    } else {
      db = new SQL.Database();
    }

    var migration = false;
    db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT, nickname TEXT DEFAULT '', avatar TEXT DEFAULT '', role TEXT DEFAULT 'chef', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
    db.run("CREATE TABLE IF NOT EXISTS recipes (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, name TEXT, cover TEXT DEFAULT '', tags TEXT DEFAULT '', nutrition TEXT DEFAULT '', ingredients TEXT DEFAULT '', steps TEXT DEFAULT '', is_signature INTEGER DEFAULT 0, status TEXT DEFAULT 'active', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)");

    var cols = db.exec("PRAGMA table_info(recipes)");
    var colNames = cols[0] ? cols[0].values.map(function(v) { return v[1]; }) : [];
    if (colNames.indexOf("calories") === -1) { db.run("ALTER TABLE recipes ADD COLUMN calories INTEGER DEFAULT 0"); migration = true; }
    if (colNames.indexOf("cook_time") === -1) { db.run("ALTER TABLE recipes ADD COLUMN cook_time TEXT DEFAULT ''"); migration = true; }
    if (colNames.indexOf("flavor") === -1) { db.run("ALTER TABLE recipes ADD COLUMN flavor TEXT DEFAULT ''"); migration = true; }

    db.run("CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, recipe_id INTEGER, orderer_id INTEGER, chef_id INTEGER, status TEXT DEFAULT 'pending', note TEXT DEFAULT '', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, completed_at DATETIME)");
    db.run("CREATE TABLE IF NOT EXISTS ratings (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER UNIQUE, recipe_id INTEGER, user_id INTEGER DEFAULT 0, score INTEGER, comment TEXT DEFAULT '', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)");

    var cols2 = db.exec("PRAGMA table_info(ratings)");
    var colNames2 = cols2[0] ? cols2[0].values.map(function(v) { return v[1]; }) : [];
    if (colNames2.indexOf("user_id") === -1) { db.run("ALTER TABLE ratings ADD COLUMN user_id INTEGER DEFAULT 0"); migration = true; }
    if (migration) save();

    var cnt = db.exec("SELECT COUNT(*) as c FROM users");
    if (!cnt.length || !cnt[0].values[0][0]) {
      var h = bcrypt.hashSync("123456", 10);
      var s1 = db.prepare("INSERT INTO users (username,password,nickname,role) VALUES(?,?,?,?)");
      s1.bind(["chef", h, "\u5927\u53a8", "chef"]); s1.step(); s1.reset();
      var s2 = db.prepare("INSERT INTO users (username,password,nickname,role) VALUES(?,?,?,?)");
      s2.bind(["foodie", h, "\u5403\u8d27", "foodie"]); s2.step(); s2.reset();
      save();
      console.log("Users created");
    }
    save();
    console.log("DB ready");
  }
}

module.exports = { ...dbModule, initDB };
