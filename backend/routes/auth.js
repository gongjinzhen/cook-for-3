const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'cook-for-u-secret-key-2026';

router.post('/register', async (req, res) => {
  const { username, password, nickname, role } = req.body;
  if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' });
  if (username.length < 2) return res.status(400).json({ error: '用户名至少2个字符' });
  if (password.length < 4) return res.status(400).json({ error: '密码至少4个字符' });
  const existing =  await db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) return res.status(409).json({ error: '用户名已存在' });
  const validRoles = ['chef', 'foodie'];
  const finalRole = validRoles.includes(role) ? role : 'foodie';
  const finalNickname = nickname || username;
  const hashed = bcrypt.hashSync(password, 10);
  const result =  await db.prepare('INSERT INTO users (username,password,nickname,role) VALUES(?,?,?,?)').run(username, hashed, finalNickname, finalRole);
  const token = jwt.sign({ id: result.lastInsertRowid, username, role: finalRole }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: result.lastInsertRowid, username, nickname: finalNickname, avatar: '', role: finalRole } });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user =  await db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) return res.status(401).json({ error: '用户不存在' });
  if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: '密码错误' });
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username, nickname: user.nickname, avatar: user.avatar, role: user.role } });
});

router.get('/me', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: '未登录' });
  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    const user =  await db.prepare('SELECT id, username, nickname, avatar, role FROM users WHERE id = ?').get(decoded.id);
    if (!user) return res.status(404).json({ error: '用户不存在' });
    res.json(user);
  } catch (e) {
    return res.status(401).json({ error: '登录已过期' });
  }
});

router.put('/profile', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: '未登录' });
  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    const { nickname } = req.body;
    await await db.prepare('UPDATE users SET nickname = ? WHERE id = ?').run(nickname, decoded.id);
    res.json({ success: true });
  } catch (e) {
    return res.status(401).json({ error: '登录已过期' });
  }
});

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: '未登录' });
  try {
    req.user = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: '登录已过期' });
  }
}

router.get('/check', authMiddleware, (req, res) => {
  res.json({ valid: true, user: req.user });
});

module.exports = router;
