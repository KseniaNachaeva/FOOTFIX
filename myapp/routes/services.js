const express = require('express');
const router = express.Router();
const { Services, Order_services } = require('../models');
const { Sequelize } = require('../models');

// Получить все услуги с пагинацией
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    const { sort, search } = req.query;
    
    let whereCondition = {};
    if (search && search.trim() !== '') {
      whereCondition = {
        [Sequelize.Op.or]: [
          { Service_name: { [Sequelize.Op.like]: `%${search}%` } },
          { Description: { [Sequelize.Op.like]: `%${search}%` } }
        ]
      };
    }
    
    let order = [['Service_name', 'ASC']];
    if (sort === 'price-asc') {
      order = [['Price', 'ASC']];
    } else if (sort === 'price-desc') {
      order = [['Price', 'DESC']];
    } else if (sort === 'name') {
      order = [['Service_name', 'ASC']];
    }
    
    const totalCount = await Services.count({ where: whereCondition });
    
    const services = await Services.findAll({
      where: whereCondition,
      order: order,
      limit: limit,
      offset: offset,
      attributes: ['ID', 'Service_name', 'Price', 'Description'] 
    });
    
    const formattedServices = services.map(service => ({
      id: service.ID,
      name: service.Service_name,
      price: parseFloat(service.Price),
      description: service.Description || ''
    }));
    
    const totalPages = Math.ceil(totalCount / limit);
    
    res.json({
      success: true,
      data: formattedServices,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
    
  } catch (error) {
    console.error('Ошибка получения услуг:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения услуг'
    });
  }
});

// для главной страницы
router.get('/popular', async (req, res) => {
  try {
    const popularServices = await Services.findAll({
      attributes: [
        'ID',
        'Service_name',
        'Price',
        'Description',
        [
          Sequelize.literal(`(
            SELECT COUNT(*)
            FROM Order_services
            WHERE Order_services.Services_ID = Services.ID
          )`),
          'order_count'
        ]
      ],
      order: [
        [Sequelize.literal('order_count'), 'DESC'],
        ['Price', 'ASC']
      ],
      limit: 3
    });
    
    const formattedServices = popularServices.map(service => ({
      id: service.ID,
      name: service.Service_name,
      price: parseFloat(service.Price),
      description: service.Description,
      orderCount: service.dataValues.order_count || 0
    }));
    
    res.json({
      success: true,
      data: formattedServices
    });
    
  } catch (error) {
    console.error('Ошибка получения популярных услуг:', error);
    res.json({
      success: true,
      data: []
    });
  }
});

// Создать новую услугу (только админ)
router.post('/', async (req, res) => {
  try {
    const { name, price, description } = req.body;
    
    const existingService = await Services.findOne({
      where: { Service_name: name }
    });
    
    if (existingService) {
      return res.status(400).json({
        success: false,
        message: 'Услуга с таким названием уже существует'
      });
    }
    
    const service = await Services.create({
      Service_name: name,
      Price: price,
      Description: description || null
    });
    
    res.status(201).json({
      success: true,
      message: 'Услуга успешно создана',
      data: {
        id: service.ID,
        name: service.Service_name,
        price: parseFloat(service.Price),
        description: service.Description
      }
    });
  } catch (error) {
    console.error('Ошибка создания услуги:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка создания услуги: ' + error.message
    });
  }
});

// Обновить услугу (только админ)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description } = req.body;
    
    console.log('Обновление услуги ID:', id, 'Данные:', { name, price, description });
    
    const service = await Services.findByPk(id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Услуга не найдена'
      });
    }
    
    if (name !== service.Service_name) {
      const duplicate = await Services.findOne({
        where: { 
          Service_name: name,
          ID: { [Sequelize.Op.ne]: id }
        }
      });
      
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'Услуга с таким названием уже существует'
        });
      }
    }
    
    await service.update({
      Service_name: name,
      Price: price,
      Description: description || null
    });
    
    res.json({
      success: true,
      message: 'Услуга успешно обновлена',
      data: {
        id: service.ID,
        name: service.Service_name,
        price: parseFloat(service.Price),
        description: service.Description
      }
    });
    
  } catch (error) {
    console.error('Ошибка обновления услуги:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления услуги: ' + error.message
    });
  }
});

// Удалить услугу (только админ)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Удаление услуги ID:', id);
    
    const ordersWithService = await Order_services.count({
      where: { Services_ID: id }
    });
    
    if (ordersWithService > 0) {
      return res.status(400).json({
        success: false,
        message: `Невозможно удалить услугу, так как она используется в ${ordersWithService} заказах`
      });
    }
    
    const service = await Services.findByPk(id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Услуга не найдена'
      });
    }
    
    await service.destroy();
    
    res.json({
      success: true,
      message: 'Услуга успешно удалена'
    });
    
  } catch (error) {
    console.error('Ошибка удаления услуги:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка удаления услуги: ' + error.message
    });
  }
});

module.exports = router;