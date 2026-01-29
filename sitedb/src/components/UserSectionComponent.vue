<template>
  <section v-if="user" id="userSection">
    <h3 v-if="user.role === 'client'">Ваши последние заказы</h3>
    <h3 v-else-if="user.role === 'admin'">Быстрая статистика</h3>
    
    <div v-if="user.role === 'client'" id="userOrders">
      <table class="data-table">
        <thead>
          <tr>
            <th>№ Заказа</th>
            <th>Дата</th>
            <th>Статус</th>
            <th>Сумма</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in clientOrders" :key="order.id">
            <td>#{{ order.id }}</td>
            <td>{{ order.date }}</td>
            <td>{{ order.status }}</td>
            <td>{{ order.total }} руб.</td>
          </tr>
        </tbody>
      </table>
      <p style="margin-top: 20px;">
        <a href="/account" class="btn btn-primary">Все заказы →</a>
      </p>
    </div>
    
    <div v-else-if="user.role === 'admin'" id="adminStats" class="admin-section">
      <h3>Быстрая статистика</h3>
      
      <div v-if="loadingStats" class="loading">
        Загрузка статистики...
      </div>
      
      <div v-else class="admin-quick-stats">
        <div class="stats-grid">
          <div class="quick-stat-card">
            
            <div class="stat-info">
              <p class="stat-label">Заказов сегодня</p>
              <p class="stat-value">{{ adminStats.ordersToday }}</p>
            </div>
          </div>
          
          <div class="quick-stat-card">
            <div class="stat-info">
              <p class="stat-label">Выручка сегодня</p>
              <p class="stat-value">{{ formatPrice(adminStats.revenueToday) }} ₽</p>
            </div>
          </div>
          
          <div class="quick-stat-card">
            <div class="stat-info">
              <p class="stat-label">Активных заказов</p>
              <p class="stat-value">{{ adminStats.activeOrders }}</p>
            </div>
          </div>
        </div>
        
        <p class="admin-actions">
          <router-link to="/admin" class="btn btn-primary">
            Перейти в админ панель →
          </router-link>
          <router-link to="/orders" class="btn btn-outline">
            Управление заказами
          </router-link>
        </p>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'UserSectionComponent',
  data() {
    return {
      user: null,
      clientOrders: [],
      adminStats: {
        ordersToday: 0,
        revenueToday: 0,
        activeOrders: 0
      },
      loadingOrders: false,
      loadingStats: false
    };
  },
  mounted() {
    this.checkAuth();
  },
  methods: {
    checkAuth() {
      const userData = sessionStorage.getItem('currentUser');
      this.user = userData ? JSON.parse(userData) : null;
      
      if (this.user) {
        if (this.user.role === 'client') {
          this.loadClientOrders();
        } else if (this.user.role === 'admin') {
          this.loadAdminStats();
        }
      }
    },
    
    async loadClientOrders() {
      this.loadingOrders = true;
      
      try {
        const response = await fetch(`/api/stats/user-orders/${this.user.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            this.clientOrders = result.data;
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки заказов:', error);
        this.clientOrders = [
          { id: 125, date: '2024-01-20', status: 'В работе', total: 1500 },
          { id: 118, date: '2024-01-10', status: 'Выполнен', total: 2000 }
        ];
      } finally {
        this.loadingOrders = false;
      }
    },
    
    async loadAdminStats() {
      this.loadingStats = true;
      
      try {
        console.log('Загружаем быструю статистику для админа...');
        
        const response = await fetch('/api/stats/admin-quick', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Получена быстрая статистика:', result);
          
          if (result.success) {
            this.adminStats = result.data;
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
        this.adminStats = {
          ordersToday: 5,
          revenueToday: 12500,
          activeOrders: 7
        };
      } finally {
        this.loadingStats = false;
      }
    },
    
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    },
    
    formatPrice(price) {
      return Number(price || 0).toLocaleString('ru-RU');
    },
    
    getStatusClass(status) {
      const statusMap = {
        'В работе': 'status-in-work',
        'Выполнен': 'status-completed',
        'Выдано': 'status-delivered'
      };
      return statusMap[status] || '';
    }
  }
};
</script>
