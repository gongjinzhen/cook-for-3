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

// 点菜
router.post('/', auth, (req, res) => {
  const { recipe_id, note } = req.body;
  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ? AND status = ?').get(recipe_id, 'active');
  if (!recipe) return res.status(404).json({ error: '菜谱不存在' });
  const chef = db.prepare('SELECT * FROM users WHERE id = ?').get(recipe.user_id);
  db.prepare('INSERT INTO orders (recipe_id, orderer_id, chef_id, note) VALUES (?, ?, ?, ?)').run(recipe_id, req.user.id, chef.id, note || '');
  res.json({ message: '点菜成功！等着吃吧~', recipe_name: recipe.name });
});


// 获取待处理订单数量（大厨用）
router.get('/pending-count', auth, (req, res) => {
  const result = db.prepare("SELECT COUNT(*) as cnt FROM orders o JOIN recipes r ON r.id = o.recipe_id WHERE o.chef_id = ? AND o.status = 'pending'").get(req.user.id);
  res.json({ count: result ? result.cnt : 0 });
});

// 获取订单列表
router.get('/', auth, (req, res) => {
  const isChef = req.query.role === 'chef';
  const field = isChef ? 'chef_id' : 'orderer_id';
  const orders = db.prepare("SELECT o.*, r.name as recipe_name, r.cover as recipe_cover, u.nickname as orderer_name FROM orders o JOIN recipes r ON r.id = o.recipe_id JOIN users u ON u.id = o.orderer_id WHERE o." + field + " = ? ORDER BY o.created_at DESC").all(req.user.id);
  res.json(orders);
});

// 更新订单状态
router.put('/:id/status', auth, (req, res) => {
  const { status } = req.body;
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND chef_id = ?').get(req.params.id, req.user.id);
  if (!order) return res.status(404).json({ error: '订单不存在' });
  if (status === 'completed') {
    db.prepare("UPDATE orders SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?").run(status, req.params.id);
  } else {
    db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, req.params.id);
  }
  res.json({ success: true });
});

module.exports = router;
