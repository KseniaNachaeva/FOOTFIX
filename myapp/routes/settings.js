

const express = require('express');
const router = express.Router();
const { Role, Status, Users, Orders } = require('../models');

//Получить все роли
router.get('/roles', async (req, res) => {
  try {
    const roles = await Role.findAll({
      order: [['ID', 'ASC']]
    });
    
    const rolesWithCount = await Promise.all(roles.map(async (role) => {
      const usersCount = await Users.count({
        where: { Role_ID: role.ID }
      });
      
      return {
        id: role.ID,
        name: role.Role_name,
        usersCount: usersCount
      };
    }));
    
    res.json({
      success: true,
      data: rolesWithCount
    });
    
  } catch (error) {
    console.error('Ошибка получения ролей:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения ролей'
    });
  }
});

// Создать новую роль
router.post('/roles', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Название роли обязательно'
      });
    }
    
    const existing = await Role.findOne({
      where: { Role_name: name.trim() }
    });
    
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Роль с таким названием уже существует'
      });
    }
    
    const role = await Role.create({
      Role_name: name.trim()
    });
    
    res.status(201).json({
      success: true,
      message: 'Роль успешно создана',
      data: {
        id: role.ID,
        name: role.Role_name,
        usersCount: 0
      }
    });
    
  } catch (error) {
    console.error('Ошибка создания роли:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка создания роли'
    });
  }
});

// Обновить роль
router.put('/roles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Название роли обязательно'
      });
    }
    
    const role = await Role.findByPk(id);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Роль не найдена'
      });
    }
    
    const existing = await Role.findOne({
      where: { 
        Role_name: name.trim(),
        ID: { [require('sequelize').Op.ne]: id }
      }
    });
    
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Роль с таким названием уже существует'
      });
    }
    
    await role.update({ Role_name: name.trim() });
    
    res.json({
      success: true,
      message: 'Роль успешно обновлена',
      data: {
        id: role.ID,
        name: role.Role_name
      }
    });
    
  } catch (error) {
    console.error('Ошибка обновления роли:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления роли'
    });
  }
});

// Удалить роль
router.delete('/roles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const role = await Role.findByPk(id);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Роль не найдена'
      });
    }
    
    const usersCount = await Users.count({
      where: { Role_ID: id }
    });
    
    if (usersCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Невозможно удалить роль. ${usersCount} пользователей используют эту роль`
      });
    }

    if (role.Role_name === 'admin' || role.Role_name === 'client') {
      return res.status(400).json({
        success: false,
        message: 'Невозможно удалить системную роль'
      });
    }
    
    await role.destroy();
    
    res.json({
      success: true,
      message: 'Роль успешно удалена'
    });
    
  } catch (error) {
    console.error('Ошибка удаления роли:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка удаления роли'
    });
  }
});

// Получить все статусы
router.get('/statuses', async (req, res) => {
  try {
    const statuses = await Status.findAll({
      order: [['ID', 'ASC']]
    });
    
    const statusesWithCount = await Promise.all(statuses.map(async (status) => {
      const ordersCount = await Orders.count({
        where: { Status_ID: status.ID }
      });
      
      return {
        id: status.ID,
        name: status.Status_name,
        ordersCount: ordersCount
      };
    }));
    
    res.json({
      success: true,
      data: statusesWithCount
    });
    
  } catch (error) {
    console.error('Ошибка получения статусов:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения статусов'
    });
  }
});

// Создать новый статус
router.post('/statuses', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Название статуса обязательно'
      });
    }
    
    const existing = await Status.findOne({
      where: { Status_name: name.trim() }
    });
    
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Статус с таким названием уже существует'
      });
    }
    
    const status = await Status.create({
      Status_name: name.trim()
    });
    
    res.status(201).json({
      success: true,
      message: 'Статус успешно создан',
      data: {
        id: status.ID,
        name: status.Status_name,
        ordersCount: 0
      }
    });
    
  } catch (error) {
    console.error('Ошибка создания статуса:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка создания статуса'
    });
  }
});

// Обновить статус
router.put('/statuses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Название статуса обязательно'
      });
    }
    
    const status = await Status.findByPk(id);
    
    if (!status) {
      return res.status(404).json({
        success: false,
        message: 'Статус не найден'
      });
    }
    
    const existing = await Status.findOne({
      where: { 
        Status_name: name.trim(),
        ID: { [require('sequelize').Op.ne]: id }
      }
    });
    
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Статус с таким названием уже существует'
      });
    }
    
    await status.update({ Status_name: name.trim() });
    
    res.json({
      success: true,
      message: 'Статус успешно обновлён',
      data: {
        id: status.ID,
        name: status.Status_name
      }
    });
    
  } catch (error) {
    console.error('Ошибка обновления статуса:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления статуса'
    });
  }
});

// Удалить статус
router.delete('/statuses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const status = await Status.findByPk(id);
    
    if (!status) {
      return res.status(404).json({
        success: false,
        message: 'Статус не найден'
      });
    }
    
    const ordersCount = await Orders.count({
      where: { Status_ID: id }
    });
    
    if (ordersCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Невозможно удалить статус. ${ordersCount} заказов используют этот статус`
      });
    }
    
    await status.destroy();
    
    res.json({
      success: true,
      message: 'Статус успешно удалён'
    });
    
  } catch (error) {
    console.error('Ошибка удаления статуса:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка удаления статуса'
    });
  }
});

module.exports = router;