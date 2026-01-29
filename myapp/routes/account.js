

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { Users, Orders, Status, Services, Role } = require('../models');

// Получить данные аккаунта
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    

    const user = await Users.findOne({
      where: { 
        ID: userId,
        status: 'active'
      },
      include: [{ model: Role, as: 'role' }],
      attributes: ['ID', 'Full_name', 'Email', 'Telephone', 'status']
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден или аккаунт деактивирован'
      });
    }
    

    const orders = await Orders.findAll({
      where: { Users_ID: userId },
      include: [
        {
          model: Status,
          as: 'status',
          attributes: ['ID', 'Status_name']
        },
        {
          model: Services,
          as: 'services',
          through: {
            attributes: ['Quantity', 'Price_per_unit']
          }
        }
      ],
      order: [['Date_of_creation', 'DESC']]
    });
    

    const totalOrders = orders.length;
    
    const activeOrders = orders.filter(o => 
      o.status?.Status_name === 'В работе' || o.status?.Status_name === 'в работе'
    ).length;
    
    const totalSpent = orders.reduce((sum, order) => {
      return sum + parseFloat(order.Total_amount || 0);
    }, 0);
    
    const avgCheck = totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0;
    

    const formattedOrders = orders.map(order => {
      let statusColor = '#3498db';
      const statusName = order.status?.Status_name?.toLowerCase();
      
      if (statusName === 'в работе') {
        statusColor = '#f39c12';
      } else if (statusName === 'выполнен') {
        statusColor = '#27ae60';
      } else if (statusName === 'выдано') {
        statusColor = '#3498db';
      }
      
      return {
        id: order.ID,
        date: order.Date_of_creation,
        status: order.status?.Status_name || 'Неизвестно',
        statusColor: statusColor,
        total: parseFloat(order.Total_amount),
        services: order.services?.map(service => ({
          name: service.Service_name,
          quantity: service.Order_services?.Quantity || 1,
          price: parseFloat(service.Order_services?.Price_per_unit || service.Price)
        })) || []
      };
    });
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.ID,
          fullName: user.Full_name,
          email: user.Email,
          phone: user.Telephone,
          role: user.role?.Role_name
        },
        stats: {
          totalOrders,
          activeOrders,
          totalSpent: Math.round(totalSpent),
          avgCheck
        },
        orders: formattedOrders
      }
    });
    
  } catch (error) {
    console.error('Ошибка получения данных аккаунта:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Деактивировать собственный аккаунт
router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { password } = req.body;
    

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо ввести пароль для подтверждения'
      });
    }
    

    const user = await Users.findOne({
      where: { 
        ID: userId,
        status: 'active'
      }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден или уже деактивирован'
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.Password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Неверный пароль'
      });
    }
    
    await user.update({ status: 'inactive' });
    
    console.log(`Аккаунт пользователя ${user.Email} деактивирован`);
    
    res.json({
      success: true,
      message: 'Аккаунт успешно деактивирован'
    });
    
  } catch (error) {
    console.error('Ошибка деактивации аккаунта:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

module.exports = router;