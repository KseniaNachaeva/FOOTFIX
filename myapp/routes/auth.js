

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { Users, Role } = require('../models');

// Вход
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email и пароль обязательны'
      });
    }
    
    const user = await Users.findOne({
      where: { Email: email.toLowerCase() },
      include: [{ model: Role, as: 'role' }]
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Неверный email или пароль'
      });
    }
    
    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Ваш аккаунт деактивирован. Обратитесь к администратору для восстановления.'
      });
    }

    const isValid = await bcrypt.compare(password, user.Password);
    
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Неверный email или пароль'
      });
    }

    res.json({
      success: true,
      data: {
        id: user.ID,
        email: user.Email,
        fullName: user.Full_name,
        phone: user.Telephone,
        role: user.role?.Role_name === 'admin' ? 'admin' : 'client',
        createdAt: user.createdAt
      }
    });
    
  } catch (error) {
    console.error('Ошибка входа:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Регистрация
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName, phone } = req.body;
    
    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Заполните все обязательные поля'
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Пароль должен быть минимум 6 символов'
      });
    }

    const existingUser = await Users.findOne({
      where: { 
        Email: email.toLowerCase(),
        status: 'active'
      }
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Пользователь с таким email уже существует'
      });
    }

    let clientRole = await Role.findOne({ where: { Role_name: 'client' } });
    
    if (!clientRole) {
      clientRole = await Role.create({ Role_name: 'client' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await Users.create({
      Email: email.toLowerCase(),
      Password: hashedPassword,
      Full_name: fullName,
      Telephone: phone || null,
      Role_ID: clientRole.ID,
      status: 'active'
    });
    
    console.log('Новый пользователь зарегистрирован:', newUser.Email);
    
    res.status(201).json({
      success: true,
      message: 'Регистрация успешна!',
      data: {
        id: newUser.ID,
        email: newUser.Email,
        fullName: newUser.Full_name,
        phone: newUser.Telephone,
        role: 'client'
      }
    });
    
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при регистрации'
    });
  }
});

module.exports = router;