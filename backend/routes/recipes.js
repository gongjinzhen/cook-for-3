const express = require("express");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const db = require("../db");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "cook-for-u-secret-key-2026";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../uploads")),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

function auth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "未登录" });
  try {
    req.user = jwt.verify(auth.split(" ")[1], JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: "登录已过期" });
  }
}

router.get("/", auth, async (req, res) => {
  const recipes =  await db.prepare("SELECT r.*, COALESCE(AVG(rt.score), 0) as avg_score, COUNT(DISTINCT o.id) as order_count FROM recipes r LEFT JOIN ratings rt ON rt.recipe_id = r.id LEFT JOIN orders o ON o.recipe_id = r.id WHERE r.status = \"active\" GROUP BY r.id ORDER BY r.created_at DESC").all();
  res.json(recipes);
});

router.get("/:id", auth, async (req, res) => {
  const recipe =  await db.prepare("SELECT r.*, COALESCE(AVG(rt.score), 0) as avg_score FROM recipes r LEFT JOIN ratings rt ON rt.recipe_id = r.id WHERE r.id = ? GROUP BY r.id").get(req.params.id);
  if (!recipe) return res.status(404).json({ error: "菜谱不存在" });
  const ratings =  await db.prepare("SELECT rt.*, u.nickname FROM ratings rt JOIN orders o ON o.id = rt.order_id JOIN users u ON u.id = o.orderer_id WHERE rt.recipe_id = ? ORDER BY rt.created_at DESC").all(req.params.id);
  res.json({ ...recipe, ratings });
});

router.post("/", auth, upload.single("cover"), async (req, res) => {
  const { name, tags, nutrition, ingredients, steps, is_signature, calories, cook_time, flavor } = req.body;
  const cover = req.file ? "/uploads/" + req.file.filename : "";
  const result =  await db.prepare("INSERT INTO recipes (user_id, name, cover, tags, nutrition, ingredients, steps, is_signature, calories, cook_time, flavor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    req.user.id, name, cover, tags || "", nutrition || "", ingredients || "", steps || "", is_signature ? 1 : 0, calories ? parseInt(calories) : 0, cook_time || "", flavor || ""
  );
  res.json({ id: result.lastInsertRowid, message: "添加成功" });
});

router.put("/:id", auth, upload.single("cover"), async (req, res) => {
  const recipe =  await db.prepare("SELECT * FROM recipes WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!recipe) return res.status(404).json({ error: "菜谱不存在或无权编辑" });
  const { name, tags, nutrition, ingredients, steps, is_signature, calories, cook_time, flavor } = req.body;
  const cover = req.file ? "/uploads/" + req.file.filename : recipe.cover;
  await await db.prepare("UPDATE recipes SET name=?, cover=?, tags=?, nutrition=?, ingredients=?, steps=?, is_signature=?, calories=?, cook_time=?, flavor=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").run(
    name || recipe.name, cover, tags ?? recipe.tags, nutrition ?? recipe.nutrition, ingredients ?? recipe.ingredients, steps ?? recipe.steps,
    is_signature !== undefined ? (is_signature ? 1 : 0) : recipe.is_signature,
    calories !== undefined ? parseInt(calories) : recipe.calories, cook_time ?? recipe.cook_time, flavor ?? recipe.flavor,
    req.params.id
  );
  res.json({ success: true });
});

router.delete("/:id", auth, async (req, res) => {
  const recipe =  await db.prepare("SELECT * FROM recipes WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!recipe) return res.status(404).json({ error: "菜谱不存在或无权删除" });
  await await db.prepare("UPDATE recipes SET status = \"deleted\" WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
