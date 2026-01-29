
<template>
  <div class="account-page">
    <HeaderComponent />
    
    <main class="container">
      <div v-if="loading" class="loading-container">
        <p>Загрузка данных...</p>
      </div>
      <div v-else-if="error" class="error-container">
        <p>{{ error }}</p>
        <button @click="loadAccountData" class="btn btn-primary">Повторить</button>
      </div>
      <template v-else>
        <section class="account-header">
          <div class="account-info">
            
            <div class="account-details">
              <h2>{{ userData.fullName }}</h2>
              <p>Email: <span>{{ userData.email }}</span></p>
              <p>Телефон: <span>{{ userData.phone || 'Не указан' }}</span></p>
            </div>
          </div>
          <div class="account-actions">
            <button 
              class="btn btn-danger" 
              @click="showDeleteModal = true"
            >
              Удалить аккаунт
            </button>
          </div>
        </section>
        <section class="statistics">
          <h3>Ваша статистика</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <h4>Всего заказов</h4>
              <p class="stat-number">{{ stats.totalOrders }}</p>
            </div>
            <div class="stat-card">
              <h4>Активных заказов</h4>
              <p class="stat-number">{{ stats.activeOrders }}</p>
            </div>
            <div class="stat-card">
              <h4>Общая сумма</h4>
              <p class="stat-number">{{ formatPrice(stats.totalSpent) }} ₽</p>
            </div>
            <div class="stat-card">
              <h4>Средний чек</h4>
              <p class="stat-number">{{ formatPrice(stats.avgCheck) }} ₽</p>
            </div>
          </div>
        </section>
        <section class="order-history">
          <h3>История заказов</h3>
          
          <div v-if="orders.length === 0" class="no-orders">
            <p>У вас пока нет заказов</p>
            <router-link to="/services" class="btn btn-primary">
              Посмотреть услуги
            </router-link>
          </div>
          
          <div v-else id="ordersList">
            <div v-for="order in orders" :key="order.id" class="order-card">
              <div class="order-header">
                <div>
                  <h4>Заказ #{{ order.id }}</h4>
                  <p class="order-date">{{ formatDate(order.date) }}</p>
                </div>
                <div class="order-status-block">
                  <span 
                    class="badge" 
                    :style="{ background: order.statusColor, color: 'white' }"
                  >
                    {{ order.status }}
                  </span>
                  <p class="order-total">{{ formatPrice(order.total) }} ₽</p>
                </div>
              </div>
              
              <div class="order-services">
                <h5>Услуги в заказе:</h5>
                <div v-for="(service, index) in order.services" :key="index" class="service-item">
                  <span>{{ service.name }} × {{ service.quantity }}</span>
                  <strong>{{ formatPrice(service.price * service.quantity) }} ₽</strong>
                </div>
              </div>
            </div>
          </div>
        </section>
      </template>
    </main>
    
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-container modal-small">
        <div class="modal-header">
          <h3>Удаление аккаунта</h3>
          <button class="modal-close" @click="closeDeleteModal">×</button>
        </div>
        
        <div class="modal-body">
          <div class="warning-message">
            <p><strong>Вы уверены, что хотите удалить свой аккаунт?</strong></p>
            <p>После удаления:</p>
            <ul>
              <li>Вы не сможете войти в систему</li>
              <li>Ваши данные будут деактивированы</li>
              <li>История заказов сохранится в архиве</li>
            </ul>
            <p class="restore-note">
              <em>Для восстановления аккаунта обратитесь к администратору.</em>
            </p>
          </div>
          
          <div class="form-group">
            <label>Введите пароль для подтверждения:</label>
            <input 
              type="password" 
              v-model="deletePassword" 
              placeholder="Ваш пароль"
              :disabled="deleting"
              @keyup.enter="deleteAccount"
            >
          </div>
          
          <div v-if="deleteError" class="error-message">
            {{ deleteError }}
          </div>
        </div>
        
        <div class="modal-footer">
          <button 
            type="button" 
            class="btn btn-secondary" 
            @click="closeDeleteModal"
            :disabled="deleting"
          >
            Отмена
          </button>
          <button 
            type="button" 
            class="btn btn-danger" 
            @click="deleteAccount"
            :disabled="!deletePassword || deleting"
          >
            {{ deleting ? 'Удаление...' : 'Удалить аккаунт' }}
          </button>
        </div>
      </div>
    </div>
    
    <FooterComponent />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import HeaderComponent from '@/components/HeaderComponent.vue';
import FooterComponent from '@/components/FooterComponent.vue';

export default {
  name: 'AccountComponent',
  components: {
    HeaderComponent,
    FooterComponent
  },
  data() {
    return {
      loading: true,
      error: null,
      userData: {
        fullName: '',
        email: '',
        phone: ''
      },
      stats: {
        totalOrders: 0,
        activeOrders: 0,
        totalSpent: 0,
        avgCheck: 0
      },
      orders: [],

      showDeleteModal: false,
      deletePassword: '',
      deleteError: '',
      deleting: false
    };
  },
  computed: {
    ...mapGetters('auth', ['currentUser'])
  },
  mounted() {
    this.loadAccountData();
  },
  methods: {
    async loadAccountData() {
      this.loading = true;
      this.error = null;
      
      try {
        if (!this.currentUser?.id) {
          this.$router.push('/login');
          return;
        }
        
        const response = await fetch(`/api/account/${this.currentUser.id}`);
        const result = await response.json();
        
        if (result.success) {
          this.userData = result.data.user;
          this.stats = result.data.stats;
          this.orders = result.data.orders;
        } else {
          this.error = result.message || 'Ошибка загрузки данных';
        }
        
      } catch (error) {
        console.error('Ошибка загрузки аккаунта:', error);
        this.error = 'Ошибка соединения с сервером';
      } finally {
        this.loading = false;
      }
    },
    
    closeDeleteModal() {
      this.showDeleteModal = false;
      this.deletePassword = '';
      this.deleteError = '';
      this.deleting = false;
    },
    
    async deleteAccount() {
      if (!this.deletePassword) {
        this.deleteError = 'Введите пароль';
        return;
      }
      
      this.deleting = true;
      this.deleteError = '';
      
      try {
        const response = await fetch(`/api/account/${this.currentUser.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            password: this.deletePassword
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          alert('Ваш аккаунт был деактивирован. Спасибо, что пользовались нашими услугами!');
          

          this.$store.dispatch('auth/clearUser');
          sessionStorage.removeItem('currentUser');
          

          this.$router.push('/');
        } else {
          this.deleteError = result.message || 'Ошибка удаления аккаунта';
        }
        
      } catch (error) {
        console.error('Ошибка удаления аккаунта:', error);
        this.deleteError = 'Ошибка соединения с сервером';
      } finally {
        this.deleting = false;
      }
    },
    
    formatDate(dateString) {
      if (!dateString) return 'Неизвестно';
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    },
    
    formatPrice(price) {
      return Number(price || 0).toLocaleString('ru-RU');
    }
  }
}
</script>