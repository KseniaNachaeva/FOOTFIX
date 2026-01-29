const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Проверка подключения к БД
const db = require('./models');

db.sequelize.authenticate()
  .then(() => {
    console.log('✅ Подключение к MySQL успешно установлено');
  })
  .catch(err => {
    console.error('❌ Ошибка подключения к базе данных:', err);
  });

// Импорт middleware для защиты от XSS
const sanitize = require('./middleware/sanitize');

// Middleware
app.use(logger('dev'));
app.use(cors({
  origin: 'http://localhost:8080',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(sanitize); // <-- Защита от XSS/HTML
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const authRouter = require('./routes/auth');
const servicesRouter = require('./routes/services');
const statsRouter = require('./routes/stats');
const ordersRouter = require('./routes/orders');
const usersRouter = require('./routes/users');
const adminRouter = require('./routes/admin');
const accountRouter = require('./routes/account');
const settingsRouter = require('./routes/settings');

app.use('/api/auth', authRouter);
app.use('/api/services', servicesRouter);
app.use('/api/stats', statsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/users', usersRouter);
app.use('/api/admin', adminRouter);
app.use('/api/account', accountRouter);
app.use('/api/settings', settingsRouter);

// Catch 404
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    message: err.message,
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

module.exports = app;