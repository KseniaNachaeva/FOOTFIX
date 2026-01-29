<template>
  <div class="users-page">
    <HeaderComponent />
    <div class="container content-container">

      <section class="statistics">
        <h3>Статистика пользователей</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <h4>Всего клиентов</h4>
            <p class="stat-number">{{ stats.totalUsers }}</p>
          </div>
          
          <div class="stat-card">
            <h4>Администраторов</h4>
            <p class="stat-number">{{ stats.adminUsers }}</p>
          </div>
          <div class="stat-card">
            <h4>Активные клиенты</h4>
            <p class="stat-number">{{ stats.activeUsers }}</p>
          </div>
          <div class="stat-card">
            <h4>Деактивированные</h4>
            <p class="stat-number">{{ stats.inactiveUsers }}</p>
          </div>
        </div>
      </section>

      <section class="page-header">
        <h2>Управление клиентами</h2>
        <button class="btn btn-primary" @click="openUserModal()">Добавить клиента</button>
      </section>

      <section class="filters">
        <div class="search-box">
          <input 
            type="text" 
            v-model="searchTerm" 
            placeholder="Поиск по имени, email или телефону..." 
            @keyup.enter="searchUsers"
          >
          <button @click="searchUsers()">Поиск</button>
          <button v-if="searchTerm" @click="clearSearch" class="btn-clear">Очистить</button>
        </div>
        <div class="filter-row">
          <div class="filter-item">
            <label>Роль:</label>
            <select v-model="roleFilter" @change="filterUsers">
              <option value="">Все роли</option>
              <option v-for="role in roles" :key="role.id" :value="role.id">
                {{ role.name }}
              </option>
            </select>
          </div>
          <div class="filter-item">
            <label>Статус:</label>
            <select v-model="statusFilter" @change="filterUsers">
              <option value="">Все</option>
              <option value="active">Активные</option>
              <option value="inactive">Деактивированные</option>
            </select>
          </div>
          <div class="filter-item">
            <label>Сортировать по:</label>
            <select v-model="sortBy" @change="sortUsers">
              <option value="">По умолчанию</option>
              <option value="name-asc">Имя (А-Я)</option>
              <option value="name-desc">Имя (Я-А)</option>
              <option value="orders-asc">Заказы (возр.)</option>
              <option value="orders-desc">Заказы (убыв.)</option>
              <option value="amount-asc">Сумма (возр.)</option>
              <option value="amount-desc">Сумма (убыв.)</option>
            </select>
          </div>
        </div>
      </section>

      <div v-if="loading" class="loading-container">
        <p>Загрузка пользователей...</p>
      </div>

      <section v-else class="table-section">
        <table class="data-table">
          <thead>
            <tr>
              <th>ФИО</th>
              <th>Email</th>
              <th>Телефон</th>
              <th>Роль</th>
              <th>Статус</th>
              <th>Заказов</th>
              <th>Сумма заказов</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>

            <tr 
              v-for="user in users" 
              :key="user.id"
              :class="{ 'inactive-row': user.status === 'inactive' }"
            >
              <td>
                {{ user.fullName }}
                <span v-if="user.status === 'inactive'" class="inactive-icon" title="Аккаунт деактивирован">
                  🚫
                </span>
              </td>
              <td>{{ user.email }}</td>
              <td>{{ user.phone || '-' }}</td>
              <td>
                <span class="badge" :class="user.role === 'admin' ? 'badge-danger' : 'badge-primary'">
                  {{ user.role }}
                </span>
              </td>
              <td>
                <span 
                  class="status-badge" 
                  :class="user.status === 'active' ? 'status-active' : 'status-inactive'"
                >
                  {{ user.status === 'active' ? 'Активен' : 'Деактивирован' }}
                </span>
              </td>
              <td>
                <span class="order-count">{{ user.ordersCount }}</span>
              </td>
              <td>
                <span class="total-amount">{{ formatPrice(user.totalSpent) }} ₽</span>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="btn btn-warning btn-small" @click="editUser(user.id)">
                    Изменить
                  </button>
                  <button 
                    v-if="user.status === 'active'"
                    class="btn btn-danger btn-small" 
                    @click="deactivateUser(user.id)"
                  >
                    Деактивировать
                  </button>
                  <button 
                    v-else
                    class="btn btn-success btn-small" 
                    @click="restoreUser(user.id)"
                  >
                    Восстановить
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="users.length === 0">
              <td colspan="8" class="text-center">Пользователи не найдены</td>
            </tr>
          </tbody>
        </table>
      </section>


      <div class="pagination" v-if="totalPages > 1">
        <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1">←</button>
        <button
          v-for="page in visiblePages"
          :key="page"
          @click="changePage(page)"
          :class="{ active: page === currentPage }"
          :disabled="page === '...'"
        >
          {{ page }}
        </button>
        <button @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages">→</button>
      </div>


      <section class="top-clients">
        <h3>Топ клиентов по заказам</h3>
        <div v-if="topClients.length > 0" class="cards-grid">
          <div v-for="client in topClients" :key="`top-${client.id}`" class="client-card">
            <div class="client-info">
              <h4>{{ client.fullName }}</h4>
              <p class="client-email">{{ client.email }}</p>
              <p class="client-phone">{{ client.phone }}</p>
            </div>
            <div class="client-stats">
              <div class="stat">
                <span class="stat-label">Заказов:</span>
                <span class="stat-value">{{ client.ordersCount }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Потрачено:</span>
                <span class="stat-value">{{ formatPrice(client.totalSpent) }} ₽</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="no-data">
          <p>Нет данных о топ клиентах</p>
        </div>
      </section>
    </div>


    <div v-if="showModal" class="modal" @click.self="closeUserModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ modalTitle }}</h3>
          <span class="close" @click="closeUserModal">&times;</span>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="submitUser">
            <div class="form-group">
              <label>ФИО: <span class="required">*</span></label>
              <input type="text" v-model="currentUser.fullName" required placeholder="Иванов Иван Иванович">
            </div>
            
            <div class="form-group">
              <label>Email: <span class="required">*</span></label>
              <input type="email" v-model="currentUser.email" required placeholder="email@example.com">
            </div>
            
            <div class="form-group">
              <label>Телефон:</label>
              <input type="tel" v-model="currentUser.phone" placeholder="+7 (900) 123-45-67">
            </div>
            
            <div class="form-group">
              <label>Роль:</label>
              <select v-model="currentUser.roleId" required>
                <option v-for="role in roles" :key="role.id" :value="role.id">
                  {{ role.name }}
                </option>
              </select>
            </div>
            <div class="form-group" v-if="currentUser.id">
              <label>Статус аккаунта:</label>
              <select v-model="currentUser.status" class="status-select">
                <option value="active">Активен</option>
                <option value="inactive">Деактивирован</option>
              </select>
              <small class="form-hint">
                <span v-if="currentUser.status === 'inactive'" class="text-warning">
                  ⚠️ Деактивированный пользователь не сможет войти в систему
                </span>
              </small>
            </div>
            
            <div class="form-group">
              <label>Пароль: <span v-if="!currentUser.id" class="required">*</span></label>
              <input 
                type="password" 
                v-model="currentUser.password" 
                :placeholder="currentUser.id ? 'Оставьте пустым, чтобы не менять' : 'Минимум 6 символов'"
              >
              <small v-if="currentUser.id">Оставьте пустым, чтобы сохранить текущий пароль</small>
              <small v-else>Если не указать, пароль будет сгенерирован автоматически</small>
            </div>
            
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" @click="closeUserModal" :disabled="submitting">
                Отмена
              </button>
              <button type="submit" class="btn btn-primary" :disabled="submitting">
                {{ submitting ? 'Сохранение...' : 'Сохранить' }}
              </button>
            </div>
          </form>
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
  name: 'UsersComponent',
  components: {
    HeaderComponent,
    FooterComponent
  },
  data() {
    return {
      users: [],
      roles: [],
      topClients: [],

      stats: {
        totalUsers: 0,
        newUsers: 0,
        adminUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0
      },

      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 10,
      searchTerm: '',
      roleFilter: '',
      statusFilter: '',
      sortBy: '',
      
      showModal: false,
      modalTitle: 'Добавить клиента',
      currentUser: {
        id: null,
        fullName: '',
        email: '',
        phone: '',
        roleId: 2,
        password: '',
        status: 'active'
      },

      loading: false,
      submitting: false
    }
  },
  computed: {
    ...mapGetters('auth', ['user']),

    isAdmin() {
      return this.user && this.user.role === 'admin';
    },
    
    visiblePages() {
      const pages = [];
      const total = this.totalPages;
      const current = this.currentPage;
      
      pages.push(1);
      
      if (current > 3) pages.push('...');
      
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      
      if (current < total - 2) pages.push('...');
      
      if (total > 1 && !pages.includes(total)) pages.push(total);
      
      return pages;
    }
  },
  methods: {

    async loadUsers() {
      this.loading = true;
      
      try {
        const params = new URLSearchParams({
          page: this.currentPage,
          limit: this.itemsPerPage,
          showInactive: 'true'
        });
        
        if (this.searchTerm) params.append('searchTerm', this.searchTerm);
        if (this.roleFilter) params.append('roleFilter', this.roleFilter);
        if (this.statusFilter) params.append('statusFilter', this.statusFilter);  // ДОБАВЛЕНО
        if (this.sortBy) params.append('sortBy', this.sortBy);
        
        const response = await fetch(`/api/users?${params}`);
        const result = await response.json();
        
        if (result.success) {
          this.users = result.data;
          this.totalPages = result.pagination.totalPages;
          this.totalItems = result.pagination.totalItems;
          this.currentPage = result.pagination.currentPage;
        }
      } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
        this.users = [];
      } finally {
        this.loading = false;
      }
    },
    
    sortUsers() {
      this.currentPage = 1;
      this.loadUsers();
    },
    
    clearSearch() {
      this.searchTerm = '';
      this.searchUsers();
    },
    
    async loadStats() {
      try {
        const response = await fetch('/api/users/stats');
        const result = await response.json();
        
        if (result.success) {
          this.stats = {
            totalUsers: result.data.totalClients || 0,
            newUsers: result.data.newUsersMonth || 0,
            adminUsers: result.data.totalAdmins || 0,
            activeUsers: result.data.activeUsers || 0,
            inactiveUsers: result.data.inactiveUsers || 0
          };
        }
      } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
      }
    },
    
    async loadTopClients() {
      try {
        const response = await fetch('/api/users/top-clients?limit=4');
        const result = await response.json();
        
        if (result.success) {
          this.topClients = result.data;
        }
      } catch (error) {
        console.error('Ошибка загрузки топ клиентов:', error);
      }
    },
    
    async loadRoles() {
      try {
        const response = await fetch('/api/users/roles');
        const result = await response.json();
        
        if (result.success) {
          this.roles = result.data;
        }
      } catch (error) {
        console.error('Ошибка загрузки ролей:', error);
      }
    },
    
    searchUsers() {
      this.currentPage = 1;
      this.loadUsers();
    },
    
    filterUsers() {
      this.currentPage = 1;
      this.loadUsers();
    },
    
    changePage(page) {
      if (page === '...' || page < 1 || page > this.totalPages) return;
      this.currentPage = page;
      this.loadUsers();
    },
    
    formatPrice(price) {
      return Number(price || 0).toLocaleString('ru-RU');
    },
    
    openUserModal() {
      this.modalTitle = 'Добавить клиента';
      this.resetCurrentUser();
      this.showModal = true;
    },
    
    closeUserModal() {
      this.showModal = false;
      this.submitting = false;
      this.resetCurrentUser();
    },
    
    async editUser(id) {
      try {
        const response = await fetch(`/api/users/${id}`);
        const result = await response.json();
        
        if (result.success) {
          const user = result.data;
          this.modalTitle = 'Редактировать клиента';
          this.currentUser = {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone || '',
            roleId: user.roleId,
            password: '',
            status: user.status || 'active'
          };
          this.showModal = true;
        }
      } catch (error) {
        console.error('Ошибка загрузки пользователя:', error);
        alert('Ошибка при загрузке данных пользователя');
      }
    },
    
    async deactivateUser(id) {
      if (!confirm('Вы уверены, что хотите деактивировать этого пользователя?\n\nПользователь не сможет войти в систему.')) return;
      
      try {
        const response = await fetch(`/api/users/${id}`, {
          method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
          alert('Пользователь деактивирован');
          await this.loadUsers();
          await this.loadStats();
        } else {
          alert(result.message || 'Ошибка при деактивации пользователя');
        }
      } catch (error) {
        console.error('Ошибка деактивации пользователя:', error);
        alert('Ошибка при деактивации пользователя');
      }
    },

    async restoreUser(id) {
      if (!confirm('Восстановить этого пользователя?\n\nПользователь снова сможет войти в систему.')) return;
      
      try {
        const response = await fetch(`/api/users/${id}/restore`, {
          method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.success) {
          alert('Пользователь восстановлен');
          await this.loadUsers();
          await this.loadStats();
        } else {
          alert(result.message || 'Ошибка при восстановлении пользователя');
        }
      } catch (error) {
        console.error('Ошибка восстановления пользователя:', error);
        alert('Ошибка при восстановлении пользователя');
      }
    },
    

    resetCurrentUser() {
      this.currentUser = {
        id: null,
        fullName: '',
        email: '',
        phone: '',
        roleId: 2,
        password: '',
        status: 'active'
      };
    },
    

    async submitUser() {
      this.submitting = true;
      
      try {
        let url = '/api/users';
        let method = 'POST';
        
        if (this.currentUser.id) {
          url = `/api/users/${this.currentUser.id}`;
          method = 'PUT';
        }
        
        const body = {
          fullName: this.currentUser.fullName,
          email: this.currentUser.email,
          phone: this.currentUser.phone || null,
          roleId: this.currentUser.roleId,
          status: this.currentUser.status
        };
        
        if (this.currentUser.password) {
          body.password = this.currentUser.password;
        }
        
        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });
        
        const result = await response.json();
        
        if (result.success) {
          if (result.data.tempPassword) {
            alert(`Пользователь создан!\nВременный пароль: ${result.data.tempPassword}\nЗапишите его и передайте пользователю.`);
          } else {
            alert(result.message || 'Пользователь успешно сохранен!');
          }
          
          this.closeUserModal();
          await this.loadUsers();
          await this.loadStats();
        } else {
          alert(result.message || 'Ошибка при сохранении пользователя');
        }
      } catch (error) {
        console.error('Ошибка сохранения пользователя:', error);
        alert('Ошибка при сохранении пользователя');
      } finally {
        this.submitting = false;
      }
    }
  },
  mounted() {
    if (!this.isAdmin) {
      alert('Доступ запрещен. Только администратор может просматривать клиентов.');
      this.$router.push('/');
      return;
    }
    Promise.all([
      this.loadUsers(),
      this.loadStats(),
      this.loadRoles(),
      this.loadTopClients()
    ]).catch(error => {
      console.error('Ошибка при загрузке данных:', error);
    });
  }
}
</script>

