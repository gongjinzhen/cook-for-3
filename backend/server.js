const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const recipeRoutes = require('./routes/recipes');
const orderRoutes = require('./routes/orders');
const ratingRoutes = require('./routes/ratings');
const { initDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors({
  origin: [
    'https://cook-for-3-frontend.onrender.com',
    'http://localhost:5173',
    'http://localhost:5174'
  ],
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

app.options('*', cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/ratings', ratingRoutes);

initDB().then(() => {
  app.listen(PORT, () => console.log('Server on http://localhost:' + PORT));
}).catch(err => {
  console.error('Failed to init DB:', err);
});
