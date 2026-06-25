const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'cook-for-u-secret-key-2026';

function auth(req, res, next) {
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ error: '未登录' });
  try { req.user = jwt.verify(h.split(' ')[1], JWT_SECRET); next(); }
  catch (e) { return res.status(401).json({ error: '登录已过期' }); }
}

router.post('/', auth, async (req, res) => {
  const { order_id, recipe_id, score, comment } = req.body;
  if (!score || score < 1 || score > 5) return res.status(400).json({ error: '评分需在1-5之间' });
  const order =  await db.prepare('SELECT * FROM orders WHERE id = ? AND orderer_id = ?').get(order_id, req.user.id);
  if (!order) return res.status(404).json({ error: '订单不存在或无权评价' });
  const existing =  await db.prepare('SELECT * FROM ratings WHERE order_id = ?').get(order_id);
  if (existing) return res.status(400).json({ error: '已评价过了' }); await db.prepare('INSERT INTO ratings (order_id, recipe_id, score, comment) VALUES (?, ?, ?, ?)').run(order_id, recipe_id, score, comment || '');
  res.json({ message: '评价成功' });
});

router.get('/stats', auth, async (req, res) => {
  const stats =  await db.prepare("SELECT COUNT(*) as total_ratings, ROUND(AVG(score), 1) as avg_score FROM ratings").get();
  const top =  await db.prepare("SELECT r.id, r.name, ROUND(AVG(rt.score), 1) as avg_score, COUNT(rt.id) as count FROM ratings rt JOIN recipes r ON r.id = rt.recipe_id GROUP BY r.id ORDER BY avg_score DESC LIMIT 5").all();
  res.json({ ...stats, top });
});

module.exports = router;
