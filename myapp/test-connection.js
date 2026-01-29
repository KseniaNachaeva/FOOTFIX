require('dotenv').config();
const db = require('./models');

async function testConnection() {
  try {
    await db.sequelize.authenticate();
    console.log('✅ Подключение к БД успешно!');
    
    // Тест запроса
    const userCount = await db.Users.count();
    console.log(`Количество пользователей в БД: ${userCount}`);
    
    const serviceCount = await db.Services.count();
    console.log(`Количество услуг в БД: ${serviceCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка подключения:', error);
    process.exit(1);
  }
}

testConnection();