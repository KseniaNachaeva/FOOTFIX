

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { Users, Role, Orders } = require('../models');
const { Sequelize } = require('../models');

// Получить всех пользователей с пагинацией и фильтрацией
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const { searchTerm, roleFilter, sortBy, showInactive, statusFilter } = req.query;
    

    let whereCondition = {};
    

    if (statusFilter) {

      whereCondition.status = statusFilter;
    } else if (showInactive !== 'true') {

      whereCondition.status = 'active';
    }
   
    if (roleFilter) {
      whereCondition.Role_ID = roleFilter;
    }
    

    if (searchTerm && searchTerm.trim() !== '') {
      whereCondition = {
        ...whereCondition,
        [Sequelize.Op.or]: [
          { Full_name: { [Sequelize.Op.like]: `%${searchTerm}%` } },
          { Email: { [Sequelize.Op.like]: `%${searchTerm}%` } },
          { Telephone: { [Sequelize.Op.like]: `%${searchTerm}%` } }
        ]
      };
    }
    
    let order = [['ID', 'DESC']];
    
    switch(sortBy) {
      case 'name-asc':
        order = [['Full_name', 'ASC']];
        break;
      case 'name-desc':
        order = [['Full_name', 'DESC']];
        break;
      case 'orders-asc':
        order = [[Sequelize.literal('ordersCount'), 'ASC']];
        break;
      case 'orders-desc':
        order = [[Sequelize.literal('ordersCount'), 'DESC']];
        break;
      case 'amount-asc':
        order = [[Sequelize.literal('totalSpent'), 'ASC']];
        break;
      case 'amount-desc':
        order = [[Sequelize.literal('totalSpent'), 'DESC']];
        break;
    }
    
    const totalCount = await Users.count({ where: whereCondition });
    
    const users = await Users.findAll({
      where: whereCondition,
      include: [{
        model: Role,
        as: 'role',
        attributes: ['ID', 'Role_name']
      }],
      attributes: {
        include: [
          [
            Sequelize.literal('(SELECT COUNT(*) FROM Orders WHERE Orders.Users_ID = Users.ID)'),
            'ordersCount'
          ],
          [
            Sequelize.literal('(SELECT COALESCE(SUM(Total_amount), 0) FROM Orders WHERE Orders.Users_ID = Users.ID)'),
            'totalSpent'
          ]
        ]
      },
      order: order,
      limit: limit,
      offset: offset
    });
    
    const formattedUsers = users.map(user => ({
      id: user.ID,
      fullName: user.Full_name,
      email: user.Email,
      phone: user.Telephone || '-',
      roleId: user.Role_ID,
      role: user.role?.Role_name || 'Неизвестно',
      status: user.status || 'active',
      ordersCount: parseInt(user.dataValues.ordersCount) || 0,
      totalSpent: parseFloat(user.dataValues.totalSpent) || 0
    }));
    
    const totalPages = Math.ceil(totalCount / limit);
    
    res.json({
      success: true,
      data: formattedUsers,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalCount,
        itemsPerPage: limit
      }
    });
    
  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения пользователей'
    });
  }
});

// олучить статистику пользователей
router.get('/stats', async (req, res) => {
  try {
    const clientRole = await Role.findOne({ where: { Role_name: 'client' } });
    const adminRole = await Role.findOne({ where: { Role_name: 'admin' } });
    
    const [totalClients, totalAdmins, activeUsers, inactiveUsers] = await Promise.all([
      clientRole ? Users.count({ 
        where: { 
          Role_ID: clientRole.ID,
          status: 'active'
        } 
      }) : 0,
      adminRole ? Users.count({ 
        where: { 
          Role_ID: adminRole.ID,
          status: 'active'
        } 
      }) : 0,
      Users.count({
        where: { status: 'active' },
        include: [{
          model: Orders,
          as: 'orders',
          required: true
        }],
        distinct: true
      }),
      Users.count({
        where: { status: 'inactive' }
      })
    ]);
    
    res.json({
      success: true,
      data: {
        totalClients,
        totalAdmins,
        activeUsers,
        inactiveUsers,
        newUsersMonth: 0
      }
    });
    
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения статистики'
    });
  }
});

// Получить топ клиентов
router.get('/top-clients', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;
    
    const clientRole = await Role.findOne({ where: { Role_name: 'client' } });
    
    if (!clientRole) {
      return res.json({ success: true, data: [] });
    }
    
    const topClients = await Users.findAll({
      where: { 
        Role_ID: clientRole.ID,
        status: 'active'
      },
      attributes: [
        'ID',
        'Full_name',
        'Email',
        'Telephone',
        [
          Sequelize.literal('(SELECT COUNT(*) FROM Orders WHERE Orders.Users_ID = Users.ID)'),
          'ordersCount'
        ],
        [
          Sequelize.literal('(SELECT SUM(Total_amount) FROM Orders WHERE Orders.Users_ID = Users.ID)'),
          'totalSpent'
        ]
      ],
      order: [[Sequelize.literal('ordersCount'), 'DESC']],
      limit: limit
    });
    
    const formattedClients = topClients.map(client => ({
      id: client.ID,
      fullName: client.Full_name,
      email: client.Email,
      phone: client.Telephone || '-',
      ordersCount: parseInt(client.dataValues.ordersCount) || 0,
      totalSpent: parseFloat(client.dataValues.totalSpent) || 0
    }));
    
    res.json({
      success: true,
      data: formattedClients
    });
    
  } catch (error) {
    console.error('Ошибка получения топ клиентов:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения топ клиентов'
    });
  }
});

//  Получить список ролей
router.get('/roles', async (req, res) => {
  try {
    const roles = await Role.findAll({
      order: [['ID', 'ASC']]
    });
    
    const formattedRoles = roles.map(role => ({
      id: role.ID,
      name: role.Role_name
    }));
    
    res.json({
      success: true,
      data: formattedRoles
    });
    
  } catch (error) {
    console.error('Ошибка получения ролей:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения ролей'
    });
  }
});

// Получить одного пользователя
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await Users.findByPk(id, {
      include: [{
        model: Role,
        as: 'role'
      }],
      attributes: {
        include: [
          [
            Sequelize.literal('(SELECT COUNT(*) FROM Orders WHERE Orders.Users_ID = Users.ID)'),
            'ordersCount'
          ]
        ]
      }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }
    
    const formattedUser = {
      id: user.ID,
      fullName: user.Full_name,
      email: user.Email,
      phone: user.Telephone || '-',
      roleId: user.Role_ID,
      role: user.role?.Role_name || 'Неизвестно',
      status: user.status || 'active',
      ordersCount: parseInt(user.dataValues.ordersCount) || 0
    };
    
    res.json({
      success: true,
      data: formattedUser
    });
    
  } catch (error) {
    console.error('Ошибка получения пользователя:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения пользователя'
    });
  }
});

// Создать нового пользователя
router.post('/', async (req, res) => {
  try {
    const { fullName, email, phone, roleId, password } = req.body;
    
    if (!fullName || !email) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать имя и email'
      });
    }
    
    const existingUser = await Users.findOne({ 
      where: { 
        Email: email,
        status: 'active'
      } 
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Пользователь с таким email уже существует'
      });
    }
    
    let userRoleId = roleId;
    if (!userRoleId) {
      const clientRole = await Role.findOne({ where: { Role_name: 'client' } });
      userRoleId = clientRole?.ID || 2;
    }
    
    const userPassword = password || Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(userPassword, 10);
    
    const newUser = await Users.create({
      Full_name: fullName,
      Email: email,
      Telephone: phone || null,
      Password: hashedPassword,
      Role_ID: userRoleId,
      status: 'active'
    });
    
    const createdUser = await Users.findByPk(newUser.ID, {
      include: [{
        model: Role,
        as: 'role'
      }]
    });
    
    res.status(201).json({
      success: true,
      message: 'Пользователь успешно создан',
      data: {
        id: createdUser.ID,
        fullName: createdUser.Full_name,
        email: createdUser.Email,
        phone: createdUser.Telephone || '-',
        name: createdUser.Full_name,
        roleId: createdUser.Role_ID,
        role: createdUser.role?.Role_name || 'Неизвестно',
        tempPassword: password ? null : userPassword
      }
    });
    
  } catch (error) {
    console.error('Ошибка создания пользователя:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка создания пользователя: ' + error.message
    });
  }
});


router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, phone, roleId, password, status } = req.body;
    
    const user = await Users.findByPk(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }
    
    if (email && email !== user.Email) {
      const duplicate = await Users.findOne({
        where: {
          Email: email,
          ID: { [Sequelize.Op.ne]: id },
          status: 'active'
        }
      });
      
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'Email уже используется другим пользователем'
        });
      }
    }
    
    const updateData = {};
    if (fullName) updateData.Full_name = fullName;
    if (email) updateData.Email = email;
    if (phone !== undefined) updateData.Telephone = phone || null;
    if (roleId) updateData.Role_ID = roleId;
    if (status) updateData.status = status;
    
    if (password) {
      updateData.Password = await bcrypt.hash(password, 10);
    }
    
    await user.update(updateData);
    
    const updatedUser = await Users.findByPk(id, {
      include: [{
        model: Role,
        as: 'role'
      }]
    });
    
    res.json({
      success: true,
      message: 'Пользователь успешно обновлен',
      data: {
        id: updatedUser.ID,
        fullName: updatedUser.Full_name,
        email: updatedUser.Email,
        phone: updatedUser.Telephone || '-',
        roleId: updatedUser.Role_ID,
        role: updatedUser.role?.Role_name || 'Неизвестно',
        status: updatedUser.status
      }
    });
    
  } catch (error) {
    console.error('Ошибка обновления пользователя:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления пользователя: ' + error.message
    });
  }
});

// Деактивировать пользователя (мягкое удаление)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await Users.findByPk(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }
    
    if (user.status === 'inactive') {
      return res.status(400).json({
        success: false,
        message: 'Пользователь уже деактивирован'
      });
    }
    
    await user.update({ status: 'inactive' });
    
    console.log(`Пользователь ${user.Email} деактивирован`);
    
    res.json({
      success: true,
      message: 'Пользователь успешно деактивирован'
    });
    
  } catch (error) {
    console.error('Ошибка деактивации пользователя:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка деактивации пользователя: ' + error.message
    });
  }
});

// Восстановить пользователя
router.post('/:id/restore', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await Users.findByPk(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }
    
    if (user.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'Пользователь уже активен'
      });
    }
    
    await user.update({ status: 'active' });
    
    console.log(`Пользователь ${user.Email} восстановлен`);
    
    res.json({
      success: true,
      message: 'Пользователь успешно восстановлен'
    });
    
  } catch (error) {
    console.error('Ошибка восстановления пользователя:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка восстановления пользователя: ' + error.message
    });
  }
});

module.exports = router;