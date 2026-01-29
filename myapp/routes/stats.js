const express = require('express');
const router = express.Router();
const { Users, Orders, Services, Role, Status } = require('../models');
const { Op } = require('sequelize');

// Статистика для главной страницы
router.get('/', async (req, res) => {
  try {
    const clientRole = await Role.findOne({ 
      where: { Role_name: 'client' } 
    });
    
    const statusInWork = await Status.findOne({ 
      where: { Status_name: 'В работе' } 
    });
    
    const [totalOrders, totalClients, totalServices, activeOrders] = await Promise.all([

      Orders.count(),
      
      clientRole ? Users.count({ where: { Role_ID: clientRole.ID } }) : 0,
      
      Services.count(),
      
      statusInWork ? Orders.count({ where: { Status_ID: statusInWork.ID } }) : 0
    ]);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const ordersToday = await Orders.count({
      where: {
        Date_of_creation: {
          [Op.gte]: today
        }
      }
    });
    
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthRevenue = await Orders.sum('Total_amount', {
      where: {
        Date_of_creation: {
          [Op.gte]: firstDayOfMonth
        }
      }
    }) || 0;
    
    res.json({
      success: true,
      data: {
        totalOrders: totalOrders,
        totalClients: totalClients,
        totalServices: totalServices,
        yearsExperience: 14,
        activeOrders: activeOrders,
        ordersToday: ordersToday,
        monthRevenue: parseFloat(monthRevenue)
      }
    });
    
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    
    res.json({
      success: true,
      data: {
        totalOrders: 0,
        totalClients: 0,  
        totalServices: 0,
        yearsExperience: 14,
        activeOrders: 0,
        ordersToday: 0,
        monthRevenue: 0
      }
    });
  }
});

//  Быстрая статистика для админа на главной
router.get('/admin-quick', async (req, res) => {
  try {
    console.log('Запрос быстрой статистики админа');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const ordersToday = await Orders.count({
      where: {
        Date_of_creation: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      }
    });
    
    const revenueToday = await Orders.sum('Total_amount', {
      where: {
        Date_of_creation: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      }
    }) || 0;
    
    const inWorkStatus = await Status.findOne({ 
      where: { Status_name: 'В работе' } 
    });
    
    const activeOrders = inWorkStatus ? 
      await Orders.count({ 
        where: { Status_ID: inWorkStatus.ID } 
      }) : 0;
    
    console.log('Быстрая статистика:', {
      ordersToday,
      revenueToday,
      activeOrders
    });
    
    res.json({
      success: true,
      data: {
        ordersToday,
        revenueToday: parseFloat(revenueToday).toFixed(2),
        activeOrders
      }
    });
    
  } catch (error) {
    console.error('Ошибка получения быстрой статистики:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения статистики'
    });
  }
});





//  Заказы пользователя для главной
router.get('/user-orders/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const orders = await Orders.findAll({
      where: { Users_ID: userId },
      include: [
        {
          model: Status,
          as: 'status',
          attributes: ['Status_name']
        }
      ],
      order: [['Date_of_creation', 'DESC']],
      limit: 5
    });
    
    const formattedOrders = orders.map(order => ({
      id: order.ID,
      date: new Date(order.Date_of_creation).toLocaleDateString('ru-RU'),
      status: order.status?.Status_name || 'Неизвестно',
      total: parseFloat(order.Total_amount)
    }));
    
    res.json({
      success: true,
      data: formattedOrders
    });
    
  } catch (error) {
    console.error('Ошибка получения заказов пользователя:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения заказов'
    });
  }
});


// Расширенная статистика для админ-панели
router.get('/dashboard', async (req, res) => {
  try {
    const clientRole = await Role.findOne({ 
      where: { Role_name: 'Клиент' } 
    });
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [completedStatus, totalOrders30Days, avgOrderValue] = await Promise.all([
      Status.findOne({ where: { Status_name: 'Выполнен' } }),
      Orders.count({
        where: {
          Date_of_creation: {
            [Op.gte]: thirtyDaysAgo
          }
        }
      }),
      Orders.findOne({
        attributes: [
          [Orders.sequelize.fn('AVG', Orders.sequelize.col('Total_amount')), 'avgValue']
        ],
        raw: true
      })
    ]);
    
    const completedOrders = completedStatus ? 
      await Orders.count({ 
        where: { 
          Status_ID: completedStatus.ID,
          Date_of_creation: {
            [Op.gte]: thirtyDaysAgo
          }
        } 
      }) : 0;
    
    res.json({
      success: true,
      data: {
        ordersLast30Days: totalOrders30Days,
        completedOrders: completedOrders,
        averageOrderValue: parseFloat(avgOrderValue?.avgValue || 0).toFixed(2)
      }
    });
    
  } catch (error) {
    console.error('Ошибка получения статистики dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения статистики'
    });
  }
});

module.exports = router;