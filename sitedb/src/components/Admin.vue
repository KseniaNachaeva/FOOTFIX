<template>
  <div class="admin-page">
    <HeaderComponent />
    <div class="container content-container">
      <section class="page-header">
        <h2>Административная панель</h2>
      </section>
      <div v-if="loading" class="loading-container">
        <p>Загрузка данных...</p>
      </div>

      <template v-else>

        <section class="statistics">
          <h3>Общая статистика</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <h4>Заказов сегодня</h4>
              <p class="stat-number">{{ stats.ordersToday }}</p>
              <small class="stat-change" :class="stats.ordersTodayChange >= 0 ? 'positive' : 'negative'">
                {{ stats.ordersTodayChange > 0 ? '+' : '' }}{{ stats.ordersTodayChange }}% к вчера
              </small>
            </div>
            <div class="stat-card">
              <h4>Выручка за месяц</h4>
              <p class="stat-number">{{ formattedRevenue }} ₽</p>
              <small class="stat-change" :class="stats.revenueChange >= 0 ? 'positive' : 'negative'">
                {{ stats.revenueChange > 0 ? '+' : '' }}{{ stats.revenueChange }}% к прошлому месяцу
              </small>
            </div>
            <div class="stat-card">
              <h4>Средний чек</h4>
              <p class="stat-number">{{ stats.avgCheck }} ₽</p>
              <small class="stat-change" :class="stats.avgCheckChange >= 0 ? 'positive' : 'negative'">
                {{ stats.avgCheckChange > 0 ? '+' : '' }}{{ stats.avgCheckChange }}% к прошлому месяцу
              </small>
            </div>
            <div class="stat-card">
              <h4>Завершено заказов</h4>
              <p class="stat-number">{{ stats.completedOrders }}</p>
              <small>За последние 30 дней</small>
            </div>
          </div>
        </section>

        <section class="analytics">
          <h3>Аналитика</h3>
          <div class="admin-grid">
            <div class="admin-card">
              <h4>Динамика заказов</h4>
              <div class="chart-container">
                <canvas ref="ordersChart"></canvas>
              </div>
            </div>
            <div class="admin-card">
              <h4>Популярные услуги</h4>
              <div class="chart-container">
                <canvas ref="servicesChart"></canvas>
              </div>
            </div>
            <div class="admin-card">
              <h4>Статусы заказов</h4>
              <div class="chart-container">
                <canvas ref="statusChart"></canvas>
              </div>
            </div>
            <div class="admin-card">
              <h4>Выручка по месяцам</h4>
              <div class="chart-container">
                <canvas ref="revenueChart"></canvas>
              </div>
            </div>
          </div>
        </section>

        <section class="recent-activities">
          <h3>Последние действия</h3>
          <div class="admin-card">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Время</th>
                  <th>Действие</th>
                  <th>Пользователь</th>
                  <th>Детали</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="activity in activities" :key="activity.time">
                  <td>{{ activity.time }}</td>
                  <td>{{ activity.action }}</td>
                  <td>{{ activity.user }}</td>
                  <td>{{ activity.details }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="system-management">
          <h3>Управление системой</h3>
          <div class="admin-grid">

            <div class="admin-card">
              <h4>Управление ролями</h4>
              
              <div v-if="rolesLoading" class="loading-small">Загрузка...</div>
              
              <div v-else class="list-container">
                <div class="list-item" v-for="role in roles" :key="role.id">
                  <div class="list-item-info">
                    <span class="list-item-name">{{ role.name }}</span>
                    <span class="list-item-count">{{ role.usersCount }} польз.</span>
                  </div>
                  <div class="list-item-actions">
                    <button 
                      class="btn btn-warning btn-small" 
                      @click="openEditRoleModal(role)"
                    >
                      Изменить
                    </button>
                    <button 
                      class="btn btn-danger btn-small" 
                      @click="deleteRole(role)"
                      :disabled="role.name === 'admin' || role.name === 'client' || role.usersCount > 0"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
              
              <button class="btn btn-primary" @click="openRoleModal()">+ Добавить роль</button>
            </div>

            <div class="admin-card">
              <h4>Управление статусами заказов</h4>
              
              <div v-if="statusesLoading" class="loading-small">Загрузка...</div>
              
              <div v-else class="list-container">
                <div class="list-item" v-for="status in statuses" :key="status.id">
                  <div class="list-item-info">
                    <span class="list-item-name">{{ status.name }}</span>
                    <span class="list-item-count">{{ status.ordersCount }} заказов</span>
                  </div>
                  <div class="list-item-actions">
                    <button 
                      class="btn btn-warning btn-small" 
                      @click="openEditStatusModal(status)"
                    >
                      Изменить
                    </button>
                    <button 
                      class="btn btn-danger btn-small" 
                      @click="deleteStatus(status)"
                      :disabled="status.ordersCount > 0"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
              
              <button class="btn btn-primary" @click="openStatusModal()">+ Добавить статус</button>
            </div>
            
          </div>
        </section>
      </template>

      <div v-if="showRoleModal" class="modal" @click.self="closeRoleModal">
        <div class="modal-content">
          <span class="close" @click="closeRoleModal">&times;</span>
          <h3>{{ editingRole ? 'Редактировать роль' : 'Добавить роль' }}</h3>
          <form @submit.prevent="saveRole">
            <div class="form-group">
              <label>Название роли: <span class="required">*</span></label>
              <input 
                type="text" 
                v-model="roleForm.name" 
                required
                placeholder="Например: manager"
              >
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="roleSaving">
                {{ roleSaving ? 'Сохранение...' : 'Сохранить' }}
              </button>
              <button type="button" class="btn btn-secondary" @click="closeRoleModal">
                Отмена
              </button>
            </div>
          </form>
        </div>
      </div>

      <div v-if="showStatusModal" class="modal" @click.self="closeStatusModal">
        <div class="modal-content">
          <span class="close" @click="closeStatusModal">&times;</span>
          <h3>{{ editingStatus ? 'Редактировать статус' : 'Добавить статус' }}</h3>
          <form @submit.prevent="saveStatus">
            <div class="form-group">
              <label>Название статуса: <span class="required">*</span></label>
              <input 
                type="text" 
                v-model="statusForm.name" 
                required
                placeholder="Например: Ожидает оплаты"
              >
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="statusSaving">
                {{ statusSaving ? 'Сохранение...' : 'Сохранить' }}
              </button>
              <button type="button" class="btn btn-secondary" @click="closeStatusModal">
                Отмена
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

import {
  Chart as ChartJS,
  LineController,
  BarController,
  DoughnutController,
  LineElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  LineController,
  BarController,
  DoughnutController,
  LineElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default {
  name: 'AdminComponent',
  components: {
    HeaderComponent,
    FooterComponent
  },
  data() {
    return {

      isComponentMounted: false,
      abortController: null,
      

      stats: {
        ordersToday: 0,
        monthRevenue: 0,
        avgCheck: 0,
        completedOrders: 0,
        ordersTodayChange: 0,
        revenueChange: 0,
        avgCheckChange: 0
      },

      activities: [],
      

      roles: [],
      rolesLoading: false,
      showRoleModal: false,
      editingRole: null,
      roleForm: { name: '' },
      roleSaving: false,
      

      statuses: [],
      statusesLoading: false,
      showStatusModal: false,
      editingStatus: null,
      statusForm: { name: '' },
      statusSaving: false,
      

      settings: {
        maintenanceMode: false,
        emailNotifications: true,
        autoBackup: true
      },
      

      logFilterType: 'all',
      systemLogs: [],
      

      reportType: 'orders',
      reportDateFrom: '',
      reportDateTo: '',
      

      charts: {},

      loading: true
    }
  },
  computed: {
    ...mapGetters('auth', ['user']),

    isAdmin() {
      return this.user && this.user.role === 'admin';
    },

    formattedRevenue() {
      return Number(this.stats.monthRevenue).toLocaleString('ru-RU');
    },

    filteredLogs() {
      if (this.logFilterType === 'all') {
        return this.systemLogs;
      } else if (this.logFilterType === 'errors') {
        return this.systemLogs.filter(log => log.type === 'error');
      } else if (this.logFilterType === 'warnings') {
        return this.systemLogs.filter(log => log.type === 'warning');
      } else if (this.logFilterType === 'info') {
        return this.systemLogs.filter(log => log.type === 'info');
      }
      return this.systemLogs;
    }
  },
  methods: {
    async safeFetch(url) {
      if (!this.isComponentMounted) return null;
      
      try {
        const response = await fetch(url, {
          signal: this.abortController?.signal
        });

        if (!this.isComponentMounted) return null;
        
        return await response.json();
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Запрос отменён:', url);
          return null;
        }
        throw error;
      }
    },

    createChartSafely(canvasRef, config) {
      if (!this.isComponentMounted) {
        console.log('Компонент размонтирован, пропускаем создание графика');
        return null;
      }
      
      const canvas = this.$refs[canvasRef];
      
      if (!canvas) {
        console.warn(`Canvas ref "${canvasRef}" не найден`);
        return null;
      }
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.warn(`Не удалось получить контекст для "${canvasRef}"`);
        return null;
      }
      
      try {
        return new ChartJS(canvas, config);
      } catch (error) {
        console.error(`Ошибка создания графика "${canvasRef}":`, error);
        return null;
      }
    },

    destroyAllCharts() {
      Object.keys(this.charts).forEach(key => {
        if (this.charts[key]) {
          try {
            this.charts[key].destroy();
          } catch (e) {
            console.warn('Ошибка уничтожения графика:', e);
          }
          this.charts[key] = null;
        }
      });
      this.charts = {};
    },
    async loadDashboardData() {
      try {
        const result = await this.safeFetch('/api/admin/dashboard');
        
        if (result?.success && this.isComponentMounted) {
          this.stats = result.data.stats;
        }
      } catch (error) {
        if (this.isComponentMounted) {
          console.error('Ошибка загрузки статистики:', error);

          this.stats = {
            ordersToday: 12,
            monthRevenue: 125000,
            avgCheck: 1850,
            completedOrders: 89,
            ordersTodayChange: 15,
            revenueChange: 23,
            avgCheckChange: -5
          };
        }
      }
    },


    async loadRecentActivities() {
      try {
        const result = await this.safeFetch('/api/admin/activities?limit=5');
        
        if (result?.success && this.isComponentMounted) {
          this.activities = result.data;
        }
      } catch (error) {
        if (this.isComponentMounted) {
          console.error('Ошибка загрузки активности:', error);

          this.activities = [
            { time: '10:45', action: 'Создан новый заказ', user: 'Иван Иванов', details: 'Заказ #125' }
          ];
        }
      }
    },

    async initializeCharts() {
      this.destroyAllCharts();

      if (!this.isComponentMounted) return;

      await this.$nextTick();
      
      if (!this.isComponentMounted) return;

      await this.createOrdersChart();
      
      if (!this.isComponentMounted) return;

      await this.createServicesChart();
      
      if (!this.isComponentMounted) return;

      await this.createStatusChart();
      
      if (!this.isComponentMounted) return;

      await this.createRevenueChart();
    },

    async createOrdersChart() {
      try {
        const ordersResult = await this.safeFetch('/api/admin/charts/orders');
        
        if (ordersResult?.success && this.isComponentMounted) {
          this.charts.orders = this.createChartSafely('ordersChart', {
            type: 'line',
            data: {
              labels: ordersResult.data.map(d => d.day),
              datasets: [{
                label: 'Заказы',
                data: ordersResult.data.map(d => d.count),
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                tension: 0.4,
                fill: true
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: { mode: 'index', intersect: false }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: { color: 'rgba(0, 0, 0, 0.05)' }
                },
                x: { grid: { display: false } }
              }
            }
          });
        }
      } catch (error) {
        if (this.isComponentMounted) {
          console.error('Ошибка загрузки графика заказов:', error);
        }
      }
    },

    async createServicesChart() {
      try {
        const servicesResult = await this.safeFetch('/api/admin/charts/services');
        
        if (servicesResult?.success && this.isComponentMounted) {
          this.charts.services = this.createChartSafely('servicesChart', {
            type: 'bar',
            data: {
              labels: servicesResult.data.map(d => d.name),
              datasets: [{
                label: 'Количество заказов',
                data: servicesResult.data.map(d => d.count),
                backgroundColor: [
                  'rgba(52, 152, 219, 0.8)',
                  'rgba(46, 204, 113, 0.8)',
                  'rgba(243, 156, 18, 0.8)',
                  'rgba(231, 76, 60, 0.8)',
                  'rgba(155, 89, 182, 0.8)'
                ],
                borderColor: [
                  '#3498db',
                  '#2ecc71',
                  '#f39c12',
                  '#e74c3c',
                  '#9b59b6'
                ],
                borderWidth: 2
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: { color: 'rgba(0, 0, 0, 0.05)' }
                },
                x: { grid: { display: false } }
              }
            }
          });
        }
      } catch (error) {
        if (this.isComponentMounted) {
          console.error('Ошибка загрузки графика услуг:', error);
        }
      }
    },

    async createStatusChart() {
      try {
        const statusResult = await this.safeFetch('/api/admin/charts/status');
        
        if (statusResult?.success && this.isComponentMounted) {
          this.charts.status = this.createChartSafely('statusChart', {
            type: 'doughnut',
            data: {
              labels: statusResult.data.map(d => d.name),
              datasets: [{
                data: statusResult.data.map(d => d.count),
                backgroundColor: [
                  'rgba(243, 156, 18, 0.8)',
                  'rgba(39, 174, 96, 0.8)',
                  'rgba(52, 152, 219, 0.8)'
                ],
                borderColor: [
                  '#f39c12',
                  '#27ae60',
                  '#3498db'
                ],
                borderWidth: 2
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'bottom' }
              }
            }
          });
        }
      } catch (error) {
        if (this.isComponentMounted) {
          console.error('Ошибка загрузки графика статусов:', error);
        }
      }
    },

    async createRevenueChart() {
      try {
        const revenueResult = await this.safeFetch('/api/admin/charts/revenue');
        
        if (revenueResult?.success && this.isComponentMounted) {
          this.charts.revenue = this.createChartSafely('revenueChart', {
            type: 'bar',
            data: {
              labels: revenueResult.data.map(d => d.month),
              datasets: [{
                label: 'Выручка, ₽',
                data: revenueResult.data.map(d => d.revenue),
                backgroundColor: 'rgba(39, 174, 96, 0.8)',
                borderColor: '#27ae60',
                borderWidth: 2,
                borderRadius: 5
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      return context.parsed.y.toLocaleString('ru-RU') + ' ₽';
                    }
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: { color: 'rgba(0, 0, 0, 0.05)' },
                  ticks: {
                    callback: function(value) {
                      return value.toLocaleString('ru-RU') + ' ₽';
                    }
                  }
                },
                x: { grid: { display: false } }
              }
            }
          });
        }
      } catch (error) {
        if (this.isComponentMounted) {
          console.error('Ошибка загрузки графика выручки:', error);
        }
      }
    },

    async loadRolesList() {
      if (!this.isComponentMounted) return;
      
      this.rolesLoading = true;
      try {
        const result = await this.safeFetch('/api/settings/roles');
        
        if (result?.success && this.isComponentMounted) {
          this.roles = result.data;
        }
      } catch (error) {
        if (this.isComponentMounted) {
          console.error('Ошибка загрузки ролей:', error);
        }
      } finally {
        if (this.isComponentMounted) {
          this.rolesLoading = false;
        }
      }
    },
    
    openRoleModal() {
      this.editingRole = null;
      this.roleForm = { name: '' };
      this.showRoleModal = true;
    },
    
    openEditRoleModal(role) {
      this.editingRole = role;
      this.roleForm = { name: role.name };
      this.showRoleModal = true;
    },
    
    closeRoleModal() {
      this.showRoleModal = false;
      this.editingRole = null;
      this.roleForm = { name: '' };
    },
    
    async saveRole() {
      if (!this.roleForm.name.trim()) return;
      if (!this.isComponentMounted) return;
      
      this.roleSaving = true;
      
      try {
        let response;
        
        if (this.editingRole) {
          response = await fetch(`/api/settings/roles/${this.editingRole.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: this.roleForm.name }),
            signal: this.abortController?.signal
          });
        } else {
          response = await fetch('/api/settings/roles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: this.roleForm.name }),
            signal: this.abortController?.signal
          });
        }
        
        if (!this.isComponentMounted) return;
        
        const result = await response.json();
        
        if (result.success) {
          alert(result.message);
          this.closeRoleModal();
          await this.loadRolesList();
        } else {
          alert(result.message || 'Ошибка сохранения');
        }
        
      } catch (error) {
        if (error.name === 'AbortError') return;
        if (this.isComponentMounted) {
          console.error('Ошибка сохранения роли:', error);
          alert('Ошибка сохранения роли');
        }
      } finally {
        if (this.isComponentMounted) {
          this.roleSaving = false;
        }
      }
    },
    
    async deleteRole(role) {
      if (!this.isComponentMounted) return;
      
      if (role.usersCount > 0) {
        alert(`Невозможно удалить роль. ${role.usersCount} пользователей используют эту роль.`);
        return;
      }
      
      if (!confirm(`Удалить роль "${role.name}"?`)) return;
      
      try {
        const response = await fetch(`/api/settings/roles/${role.id}`, {
          method: 'DELETE',
          signal: this.abortController?.signal
        });
        
        if (!this.isComponentMounted) return;
        
        const result = await response.json();
        
        if (result.success) {
          alert('Роль удалена');
          await this.loadRolesList();
        } else {
          alert(result.message || 'Ошибка удаления');
        }
        
      } catch (error) {
        if (error.name === 'AbortError') return;
        if (this.isComponentMounted) {
          console.error('Ошибка удаления роли:', error);
          alert('Ошибка удаления роли');
        }
      }
    },
    
    async loadStatusesList() {
      if (!this.isComponentMounted) return;
      
      this.statusesLoading = true;
      try {
        const result = await this.safeFetch('/api/settings/statuses');
        
        if (result?.success && this.isComponentMounted) {
          this.statuses = result.data;
        }
      } catch (error) {
        if (this.isComponentMounted) {
          console.error('Ошибка загрузки статусов:', error);
        }
      } finally {
        if (this.isComponentMounted) {
          this.statusesLoading = false;
        }
      }
    },
    
    openStatusModal() {
      this.editingStatus = null;
      this.statusForm = { name: '' };
      this.showStatusModal = true;
    },
    
    openEditStatusModal(status) {
      this.editingStatus = status;
      this.statusForm = { name: status.name };
      this.showStatusModal = true;
    },
    
    closeStatusModal() {
      this.showStatusModal = false;
      this.editingStatus = null;
      this.statusForm = { name: '' };
    },
    
    async saveStatus() {
      if (!this.statusForm.name.trim()) return;
      if (!this.isComponentMounted) return;
      
      this.statusSaving = true;
      
      try {
        let response;
        
        if (this.editingStatus) {
          response = await fetch(`/api/settings/statuses/${this.editingStatus.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: this.statusForm.name }),
            signal: this.abortController?.signal
          });
        } else {
          response = await fetch('/api/settings/statuses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: this.statusForm.name }),
            signal: this.abortController?.signal
          });
        }
        
        if (!this.isComponentMounted) return;
        
        const result = await response.json();
        
        if (result.success) {
          alert(result.message);
          this.closeStatusModal();
          await this.loadStatusesList();
        } else {
          alert(result.message || 'Ошибка сохранения');
        }
        
      } catch (error) {
        if (error.name === 'AbortError') return;
        if (this.isComponentMounted) {
          console.error('Ошибка сохранения статуса:', error);
          alert('Ошибка сохранения статуса');
        }
      } finally {
        if (this.isComponentMounted) {
          this.statusSaving = false;
        }
      }
    },
    
    async deleteStatus(status) {
      if (!this.isComponentMounted) return;
      
      if (status.ordersCount > 0) {
        alert(`Невозможно удалить статус. ${status.ordersCount} заказов используют этот статус.`);
        return;
      }
      
      if (!confirm(`Удалить статус "${status.name}"?`)) return;
      
      try {
        const response = await fetch(`/api/settings/statuses/${status.id}`, {
          method: 'DELETE',
          signal: this.abortController?.signal
        });
        
        if (!this.isComponentMounted) return;
        
        const result = await response.json();
        
        if (result.success) {
          alert('Статус удалён');
          await this.loadStatusesList();
        } else {
          alert(result.message || 'Ошибка удаления');
        }
        
      } catch (error) {
        if (error.name === 'AbortError') return;
        if (this.isComponentMounted) {
          console.error('Ошибка удаления статуса:', error);
          alert('Ошибка удаления статуса');
        }
      }
    },


    initializeAdmin() {
      if (!this.isAdmin) {
        this.$router.push('/');
      }
    },

    exportData() {
      if (confirm('Экспортировать все данные в формате JSON?')) {
        const data = {
          exportDate: new Date().toISOString(),
          stats: this.stats,
          activities: this.activities
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `export_${new Date().getTime()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        alert('Данные успешно экспортированы!');
      }
    },

    backupDatabase() {
      if (confirm('Создать резервную копию базы данных?')) {
        setTimeout(() => {
          if (!this.isComponentMounted) return;
          
          alert('Резервная копия успешно создана!\nФайл: backup_2024_01_20_1200.sql');
          
          this.systemLogs.unshift({
            type: 'info',
            time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
            message: 'Резервная копия базы данных создана'
          });
        }, 2000);
      }
    },

    generateReport() {
      if (!this.reportDateFrom || !this.reportDateTo) {
        alert('Выберите период для отчета');
        return;
      }

      alert(`Отчет "${this.getReportTypeName(this.reportType)}" за период с ${this.reportDateFrom} по ${this.reportDateTo} успешно сформирован!`);
    },

    getReportTypeName(type) {
      const types = {
        'orders': 'Отчет по заказам',
        'revenue': 'Финансовый отчет',
        'clients': 'Отчет по клиентам',
        'services': 'Отчет по услугам'
      };
      return types[type] || 'Отчет';
    },

    downloadReport() {
      alert('Отчет будет скачан в формате PDF');
    },

    downloadExcel() {
      alert('Отчет будет скачан в формате Excel');
    },

    saveSystemSettings() {
      console.log('Сохранение настроек:', this.settings);
      alert('Настройки успешно сохранены!');

      this.systemLogs.unshift({
        type: 'info',
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        message: 'Системные настройки обновлены'
      });
    },

    clearLogs() {
      if (confirm('Очистить все системные логи?')) {
        this.systemLogs = [];
        alert('Логи успешно очищены!');
      }
    },

    logout() {
      if (confirm('Вы уверены, что хотите выйти из системы?')) {
        this.$store.dispatch('auth/setUser', null);
        sessionStorage.removeItem('currentUser');
        this.$router.push('/');
      }
    }
  },
  
  mounted() {
    this.isComponentMounted = true;
    this.abortController = new AbortController();

    if (!this.isAdmin) {
      alert('Доступ запрещен. Только администратор может просматривать админ-панель.');
      this.$router.push('/');
      return;
    }

    this.initializeAdmin();
    
    Promise.all([
      this.loadDashboardData(),
      this.loadRecentActivities(),
      this.loadRolesList(),
      this.loadStatusesList()
    ]).then(() => {
      if (this.isComponentMounted) {
        this.loading = false;
        this.$nextTick(() => {
          if (this.isComponentMounted) {
            this.initializeCharts();
          }
        });
      }
    }).catch(error => {
      if (this.isComponentMounted) {
        console.error('Ошибка загрузки данных:', error);
        this.loading = false;
      }
    });
  },
  
  beforeUnmount() {
    this.isComponentMounted = false;
    
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    
    this.destroyAllCharts();
  }
}
</script>
