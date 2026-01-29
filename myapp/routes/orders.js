const express = require('express');
const router = express.Router();
const { Orders, Users, Status, Services, Order_services, Role } = require('../models');
const { Sequelize } = require('../models');


// Получить данные для квитанции
router.get('/:id/receipt', async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await Orders.findByPk(id, {
      include: [
        {
          model: Users,
          as: 'user',
          attributes: ['ID', 'Full_name', 'Email', 'Telephone']
        },
        {
          model: Status,
          as: 'status'
        },
        {
          model: Services,
          as: 'services',
          through: {
            attributes: ['Quantity', 'Price_per_unit']
          }
        }
      ]
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Заказ не найден'
      });
    }
    
    const receipt = {
      orderNumber: order.ID,
      date: order.Date_of_creation,
      status: order.status?.Status_name || 'Неизвестно',
      client: {
        name: order.user?.Full_name || 'Неизвестный клиент',
        phone: order.user?.Telephone || '-',
        email: order.user?.Email || '-'
      },
      services: order.services?.map(service => ({
        name: service.Service_name,
        quantity: service.Order_services.Quantity,
        price: parseFloat(service.Order_services.Price_per_unit),
        sum: parseFloat(service.Order_services.Price_per_unit) * service.Order_services.Quantity
      })) || [],
      total: parseFloat(order.Total_amount),
      company: {
        name: 'Обувная мастерская "FootFix"',
        address: 'г. Москва, ул. Примерная, д. 1',
        phone: '+7 (999) 123-45-67'
      }
    };
    
    res.json({
      success: true,
      data: receipt
    });
    
  } catch (error) {
    console.error('Ошибка получения квитанции:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения квитанции'
    });
  }
});


// Получить всех клиентов для выбора
router.get('/clients/all', async (req, res) => {
  try {
    const clientRole = await Role.findOne({ 
      where: { Role_name: 'client' } 
    });
    
    if (!clientRole) {
      return res.json({ success: true, data: [] });
    }
    
    const clients = await Users.findAll({
      where: { Role_ID: clientRole.ID },
      attributes: ['ID', 'Full_name', 'Email', 'Telephone'],
      order: [['Full_name', 'ASC']]
    });
    
    const formattedClients = clients.map(client => ({
      id: client.ID,
      name: client.Full_name,
      email: client.Email,
      phone: client.Telephone || ''
    }));
    
    res.json({
      success: true,
      data: formattedClients
    });
    
  } catch (error) {
    console.error('Ошибка получения клиентов:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения клиентов'
    });
  }
});

// Получить все услуги для выбора
router.get('/services/all', async (req, res) => {
  try {
    const services = await Services.findAll({
      attributes: ['ID', 'Service_name', 'Price', 'Description'],
      order: [['Service_name', 'ASC']]
    });
    
    const formattedServices = services.map(service => ({
      id: service.ID,
      name: service.Service_name,
      price: parseFloat(service.Price),
      description: service.Description || ''
    }));
    
    res.json({
      success: true,
      data: formattedServices
    });
    
  } catch (error) {
    console.error('Ошибка получения услуг:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения услуг'
    });
  }
});

// Получить все статусы
router.get('/statuses/all', async (req, res) => {
  try {
    const statuses = await Status.findAll({
      order: [['ID', 'ASC']]
    });
    
    const formattedStatuses = statuses.map(status => ({
      id: status.ID,
      name: status.Status_name
    }));
    
    res.json({
      success: true,
      data: formattedStatuses
    });
    
  } catch (error) {
    console.error('Ошибка получения статусов:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения статусов'
    });
  }
});




// Получить все заказы с фильтрацией и пагинацией
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const { statusFilter, dateFrom, dateTo, clientSearch, sortBy } = req.query;
    

    let whereCondition = {};
    let userWhereCondition = {};
    

    if (statusFilter) {
      whereCondition.Status_ID = statusFilter;
    }
    

    if (dateFrom) {
      whereCondition.Date_of_creation = {
        ...whereCondition.Date_of_creation,
        [Sequelize.Op.gte]: new Date(dateFrom)
      };
    }
    
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      whereCondition.Date_of_creation = {
        ...whereCondition.Date_of_creation,
        [Sequelize.Op.lte]: endDate
      };
    }
    

    if (clientSearch) {
      userWhereCondition = {
        [Sequelize.Op.or]: [
          { Full_name: { [Sequelize.Op.like]: `%${clientSearch}%` } },
          { Email: { [Sequelize.Op.like]: `%${clientSearch}%` } }
        ]
      };
    }
    
    let order = [['Date_of_creation', 'DESC']]; 
    switch(sortBy) {
      case 'date-asc':
        order = [['Date_of_creation', 'ASC']];
        break;
      case 'date-desc':
        order = [['Date_of_creation', 'DESC']];
        break;
      case 'amount-asc':
        order = [['Total_amount', 'ASC']];
        break;
      case 'amount-desc':
        order = [['Total_amount', 'DESC']];
        break;
      case 'status':
        order = [['Status_ID', 'ASC'], ['Date_of_creation', 'DESC']]; // По статусу
        break;
    }
    

    const totalCount = await Orders.count({
      where: whereCondition,
      include: [{
        model: Users,
        as: 'user',
        where: userWhereCondition,
        required: clientSearch ? true : false
      }]
    });
    

    const orders = await Orders.findAll({
      where: whereCondition,
      include: [
        {
          model: Users,
          as: 'user',
          attributes: ['ID', 'Full_name', 'Email', 'Telephone'],
          where: userWhereCondition,
          required: clientSearch ? true : false
        },
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
      order: order,
      limit: limit,
      offset: offset
    });
    

    const formattedOrders = orders.map(order => ({
      id: order.ID,
      client: {
        id: order.user?.ID,
        name: order.user?.Full_name || 'Неизвестный клиент',
        email: order.user?.Email || '',
        phone: order.user?.Telephone || ''
      },
      date: order.Date_of_creation,
      status: {
        id: order.status?.ID,
        name: order.status?.Status_name || 'Неизвестно'
      },
      total: parseFloat(order.Total_amount),
      services: order.services?.map(service => ({
        serviceId: service.ID,
        name: service.Service_name,
        quantity: service.Order_services.Quantity,
        price: parseFloat(service.Order_services.Price_per_unit)
      })) || []
    }));
    
    const totalPages = Math.ceil(totalCount / limit);
    
    res.json({
      success: true,
      data: formattedOrders,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalCount,
        itemsPerPage: limit
      }
    });
    
  } catch (error) {
    console.error('Ошибка получения заказов:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения заказов'
    });
  }
});

// Получить один заказ
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await Orders.findByPk(id, {
      include: [
        {
          model: Users,
          as: 'user',
          attributes: ['ID', 'Full_name', 'Email', 'Telephone']
        },
        {
          model: Status,
          as: 'status'
        },
        {
          model: Services,
          as: 'services',
          through: {
            attributes: ['Quantity', 'Price_per_unit']
          }
        }
      ]
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Заказ не найден'
      });
    }
    
    const formattedOrder = {
      id: order.ID,
      client: {
        id: order.user?.ID,
        name: order.user?.Full_name,
        email: order.user?.Email,
        phone: order.user?.Telephone
      },
      date: order.Date_of_creation,
      status: {
        id: order.status?.ID,
        name: order.status?.Status_name
      },
      total: parseFloat(order.Total_amount),
      services: order.services?.map(service => ({
        serviceId: service.ID,
        name: service.Service_name,
        quantity: service.Order_services.Quantity,
        price: parseFloat(service.Order_services.Price_per_unit)
      })) || []
    };
    
    res.json({
      success: true,
      data: formattedOrder
    });
    
  } catch (error) {
    console.error('Ошибка получения заказа:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения заказа'
    });
  }
});

// Создать новый заказ
router.post('/', async (req, res) => {
  try {
    const { clientId, statusId, services, notes } = req.body;
    
    if (!clientId || !services || services.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать клиента и услуги'
      });
    }
    

    const order = await Orders.create({
      Users_ID: clientId,
      Status_ID: statusId || 1,
      Total_amount: 0
    });
    

    for (const service of services) {
      await Order_services.create({
        Orders_ID: order.ID,
        Services_ID: service.serviceId,
        Quantity: service.quantity || 1,
        Price_per_unit: service.price
      });
    }
    
    const createdOrder = await Orders.findByPk(order.ID, {
      include: [
        { model: Users, as: 'user' },
        { model: Status, as: 'status' },
        { model: Services, as: 'services' }
      ]
    });
    
    res.status(201).json({
      success: true,
      message: 'Заказ успешно создан',
      data: createdOrder
    });
    
  } catch (error) {
    console.error('Ошибка создания заказа:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка создания заказа: ' + error.message
    });
  }
});

// Обновить заказ
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { clientId, statusId, services, notes } = req.body;
    
    const order = await Orders.findByPk(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Заказ не найден'
      });
    }
    

    if (clientId) order.Users_ID = clientId;
    if (statusId) order.Status_ID = statusId;
    await order.save();
    

    if (services && services.length > 0) {

      await Order_services.destroy({
        where: { Orders_ID: id }
      });

      for (const service of services) {
        await Order_services.create({
          Orders_ID: id,
          Services_ID: service.serviceId,
          Quantity: service.quantity || 1,
          Price_per_unit: service.price
        });
      }
    }
    
    const updatedOrder = await Orders.findByPk(id, {
      include: [
        { model: Users, as: 'user' },
        { model: Status, as: 'status' },
        { model: Services, as: 'services' }
      ]
    });
    
    res.json({
      success: true,
      message: 'Заказ успешно обновлен',
      data: updatedOrder
    });
    
  } catch (error) {
    console.error('Ошибка обновления заказа:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления заказа: ' + error.message
    });
  }
});

// Удалить заказ
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await Orders.findByPk(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Заказ не найден'
      });
    }

    await Order_services.destroy({
      where: { Orders_ID: id }
    });

    await order.destroy();
    
    res.json({
      success: true,
      message: 'Заказ успешно удален'
    });
    
  } catch (error) {
    console.error('Ошибка удаления заказа:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка удаления заказа: ' + error.message
    });
  }
});



module.exports = router;