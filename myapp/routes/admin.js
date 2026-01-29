const express = require('express');
const router = express.Router();
const { Users, Orders, Services, Role, Status, Order_services } = require('../models');
const { Sequelize, Op } = require('sequelize');




// Данные для графика выручки по месяцам
router.get('/charts/revenue', async (req, res) => {
  try {
    const months = 6;
    const data = [];
    const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      

      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
      

      const revenue = await Orders.sum('Total_amount', {
        where: {
          Date_of_creation: {
            [Op.gte]: startOfMonth,
            [Op.lte]: endOfMonth
          }
        }
      }) || 0;
      
      data.push({
        month: monthNames[date.getMonth()],
        revenue: parseFloat(revenue)
      });
    }
    
    res.json({
      success: true,
      data: data
    });
    
  } catch (error) {
    console.error('Ошибка получения данных выручки:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения данных'
    });
  }
});



// Получить данные для дашборда
router.get('/dashboard', async (req, res) => {
  try {

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dayBeforeYesterday = new Date(yesterday);
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 1);
    

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    

    const completedStatus = await Status.findOne({ where: { Status_name: 'Выполнен' } });
    

    const [
      ordersToday,
      ordersYesterday,
      monthRevenue,
      lastMonthRevenue,
      avgCheck,
      lastMonthAvgCheck,
      completedOrders
    ] = await Promise.all([

      Orders.count({
        where: {
          Date_of_creation: {
            [Op.gte]: today,
            [Op.lt]: tomorrow
          }
        }
      }),

      Orders.count({
        where: {
          Date_of_creation: {
            [Op.gte]: yesterday,
            [Op.lt]: today
          }
        }
      }),

      Orders.sum('Total_amount', {
        where: {
          Date_of_creation: {
            [Op.gte]: firstDayOfMonth
          }
        }
      }),

      Orders.sum('Total_amount', {
        where: {
          Date_of_creation: {
            [Op.gte]: firstDayOfLastMonth,
            [Op.lte]: lastDayOfLastMonth
          }
        }
      }),

      Orders.findOne({
        attributes: [
          [Sequelize.fn('AVG', Sequelize.col('Total_amount')), 'avgValue']
        ],
        where: {
          Date_of_creation: {
            [Op.gte]: firstDayOfMonth
          }
        },
        raw: true
      }),

      Orders.findOne({
        attributes: [
          [Sequelize.fn('AVG', Sequelize.col('Total_amount')), 'avgValue']
        ],
        where: {
          Date_of_creation: {
            [Op.gte]: firstDayOfLastMonth,
            [Op.lte]: lastDayOfLastMonth
          }
        },
        raw: true
      }),

      completedStatus ? Orders.count({
        where: {
          Status_ID: completedStatus.ID,
          Date_of_creation: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }) : 0
    ]);

    const ordersTodayChange = ordersYesterday > 0 
      ? ((ordersToday - ordersYesterday) / ordersYesterday * 100).toFixed(1)
      : 0;
    
    const revenueChange = lastMonthRevenue > 0
      ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
      : 0;
      
    const avgCheckChange = lastMonthAvgCheck?.avgValue > 0
      ? ((avgCheck.avgValue - lastMonthAvgCheck.avgValue) / lastMonthAvgCheck.avgValue * 100).toFixed(1)
      : 0;
    
    res.json({
      success: true,
      data: {
        stats: {
          ordersToday,
          ordersTodayChange,
          monthRevenue: parseFloat(monthRevenue || 0).toFixed(2),
          revenueChange,
          avgCheck: parseFloat(avgCheck?.avgValue || 0).toFixed(2),
          avgCheckChange,
          completedOrders
        }
      }
    });
    
  } catch (error) {
    console.error('Ошибка получения данных дашборда:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения данных дашборда'
    });
  }
});

// Данные для графика заказов
router.get('/charts/orders', async (req, res) => {
  try {
    const days = 7;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const count = await Orders.count({
        where: {
          Date_of_creation: {
            [Op.gte]: date,
            [Op.lt]: nextDate
          }
        }
      });
      
      const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
      data.push({
        day: dayNames[date.getDay()],
        count: count
      });
    }
    
    res.json({
      success: true,
      data: data
    });
    
  } catch (error) {
    console.error('Ошибка получения данных для графика:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения данных'
    });
  }
});

// Данные для графика популярных услуг
router.get('/charts/services', async (req, res) => {
  try {
    const popularServices = await Services.findAll({
      attributes: [
        'Service_name',
        [
          Sequelize.literal(`(
            SELECT COUNT(*)
            FROM Order_services
            WHERE Order_services.Services_ID = Services.ID
          )`),
          'order_count'
        ]
      ],
      order: [[Sequelize.literal('order_count'), 'DESC']],
      limit: 5
    });
    
    const data = popularServices.map(service => ({
      name: service.Service_name,
      count: parseInt(service.dataValues.order_count) || 0
    }));
    
    res.json({
      success: true,
      data: data
    });
    
  } catch (error) {
    console.error('Ошибка получения данных услуг:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения данных'
    });
  }
});

// Данные для графика статусов
router.get('/charts/status', async (req, res) => {
  try {
    const statuses = await Status.findAll();
    
    const data = await Promise.all(statuses.map(async (status) => {
      const count = await Orders.count({
        where: { Status_ID: status.ID }
      });
      return {
        name: status.Status_name,
        count: count
      };
    }));
    
    res.json({
      success: true,
      data: data
    });
    
  } catch (error) {
    console.error('Ошибка получения данных статусов:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения данных'
    });
  }
});

// Данные для графика новых клиентов
router.get('/charts/clients', async (req, res) => {
  try {
    const months = 6;
    const data = [];
    const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    
    const clientRole = await Role.findOne({ where: { Role_name: 'Клиент' } });
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.getMonth();

      const count = Math.floor(Math.random() * 20) + 10;
      
      data.push({
        month: monthNames[month],
        count: count
      });
    }
    
    res.json({
      success: true,
      data: data
    });
    
  } catch (error) {
    console.error('Ошибка получения данных клиентов:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения данных'
    });
  }
});

// Последние действия
router.get('/activities', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const recentOrders = await Orders.findAll({
      include: [
        {
          model: Users,
          as: 'user',
          attributes: ['Full_name']
        },
        {
          model: Status,
          as: 'status',
          attributes: ['Status_name']
        }
      ],
      order: [['Date_of_creation', 'DESC']],
      limit: limit
    });
    
    const activities = recentOrders.map(order => ({
      time: new Date(order.Date_of_creation).toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      action: `Заказ #${order.ID}`,
      user: order.user?.Full_name || 'Неизвестный',
      details: `Статус: ${order.status?.Status_name}, Сумма: ${order.Total_amount} ₽`
    }));
    
    res.json({
      success: true,
      data: activities
    });
    
  } catch (error) {
    console.error('Ошибка получения активности:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения данных'
    });
  }
});

module.exports = router;