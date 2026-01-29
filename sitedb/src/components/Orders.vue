<template>
  <div class="orders-page">
    <HeaderComponent />
    
    <div class="container content-container">
      <section class="page-header">
        <h2>Управление заказами</h2>
        <button class="btn btn-primary" @click="openOrderModal()">
          + Создать заказ
        </button>
      </section>
      <section class="filters">
        <div class="search-box">
            <input type="text" v-model="clientSearch" placeholder="Имя или email" @keyup.enter="filterOrders">
            <button @click="filterOrders" class="btn btn-sm">Поиск</button>
          </div>
        <div class="filter-row">
          <div class="filter-item">
            <label>Статус:</label>
            <select v-model="statusFilter" @change="filterOrders">
              <option value="">Все статусы</option>
              <option value="1">В работе</option>
              <option value="2">Выполнен</option>
              <option value="3">Выдано</option>
            </select>
          </div>
          <div class="filter-item">
            <label>Период:</label>
            <div class="period-range">
              <input type="date" v-model="dateFrom" @change="filterOrders">
              <span>—</span>
              <input type="date" v-model="dateTo" @change="filterOrders">
            </div>
          </div>
          
          <div class="filter-item">
            <label>Сортировка:</label>
            <select v-model="sortBy" @change="sortOrders">
              <option value="date-desc">Дата (новые первые)</option>
              <option value="date-asc">Дата (старые первые)</option>
              <option value="amount-desc">Сумма (убывание)</option>
              <option value="amount-asc">Сумма (возрастание)</option>
              <option value="status">По статусу</option>
            </select>
          </div>
        </div>
      </section>

      <section class="table-section">
        <div v-if="loading" class="loading-container">
          <p>Загрузка заказов...</p>
        </div>
        
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>Клиент</th>
              <th>Дата создания</th>
              <th>Статус</th>
              <th>Сумма</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order.id">
              <td>
                <strong>{{ order.client?.name || 'Неизвестный клиент' }}</strong>
                <br>
                <small class="text-muted">{{ order.client?.email || '' }}</small>
              </td>
              <td>
                <span class="date-text">{{ formatDate(order.date) }}</span>
                <br>
                <small class="time-text">{{ formatTime(order.date) }}</small>
              </td>
              <td>
                <span class="status-text" :class="'status-' + (order.status?.id || 1)">
                  {{ order.status?.name || 'Неизвестно' }}
                </span>
              </td>
              <td>
                <strong class="amount-text">{{ formatPrice(order.total) }} ₽</strong>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="btn btn-success btn-small" @click="openReceipt(order.id)" title="Квитанция">
                    Квитанция
                  </button>
                  <button class="btn btn-primary btn-small" @click="viewOrder(order.id)" title="Просмотр">
                    Просмотр
                  </button>
                  <button class="btn btn-warning btn-small" @click="editOrder(order.id)" title="Изменить">
                    Изменить
                  </button>
                  <button class="btn btn-danger btn-small" @click="deleteOrder(order.id)" title="Удалить">
                    Удалить
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!loading && (!orders || orders.length === 0)">
              <td colspan="5" class="text-center">Заказы не найдены</td>
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
          :class="{ active: page === currentPage }">
          {{ page }}
        </button>
        <button @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages">→</button>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeOrderModal">
      <div class="modal-container">
        <div class="modal-header">
          <h3>{{ modalTitle }}</h3>
          <button class="modal-close" @click="closeOrderModal">×</button>
        </div>

        <div class="modal-body">
          <div class="form-section">
            <div class="section-header">
              <h4> Клиент</h4>
              <button type="button" class="btn btn-small btn-outline" @click="openNewClientModal">
                + Новый клиент
              </button>
            </div>

            <div class="search-wrapper">
              <input
                type="text"
                v-model="clientSearchQuery"
                placeholder="Поиск по имени, телефону или email..."
                @input="searchClients"
                @focus="showClientDropdown = true"
                class="search-input"
              >
              

              <div v-if="showClientDropdown && filteredClients.length > 0" class="dropdown-list">
                <div
                  v-for="client in filteredClients"
                  :key="client.id"
                  class="dropdown-item"
                  @click="selectClient(client)"
                >
                  <div class="dropdown-item-main">{{ client.name }}</div>
                  <div class="dropdown-item-sub">
                    {{ client.phone }} • {{ client.email }}
                  </div>
                </div>
              </div>
              

              <div v-if="showClientDropdown && clientSearchQuery && filteredClients.length === 0" class="dropdown-list">
                <div class="dropdown-item no-results">
                  Клиент не найден. 
                  <a href="#" @click.prevent="openNewClientModal">Создать нового?</a>
                </div>
              </div>
            </div>

            <div v-if="selectedClient" class="selected-item">
              <div class="selected-item-info">
                <strong>{{ selectedClient.name }}</strong>
                <span>{{ selectedClient.phone }} • {{ selectedClient.email }}</span>
              </div>
              <button type="button" class="btn-remove-selected" @click="clearSelectedClient">×</button>
            </div>
          </div>

          <div class="form-section">
            <div class="section-header">
              <h4>Услуги</h4>
            </div>

            <div class="search-wrapper">
              <input
                type="text"
                v-model="serviceSearchQuery"
                placeholder="Поиск услуги..."
                @input="searchServices"
                @focus="showServiceDropdown = true"
                class="search-input"
              >

              <div v-if="showServiceDropdown && filteredServices.length > 0" class="dropdown-list">
                <div
                  v-for="service in filteredServices"
                  :key="service.id"
                  class="dropdown-item"
                  @click="addService(service)"
                >
                  <div class="dropdown-item-main">{{ service.name }}</div>
                  <div class="dropdown-item-sub">
                    Прейскурант: <strong>{{ formatPrice(service.price) }} ₽</strong>
                  </div>
                </div>
              </div>
            </div>

            <div class="services-table-wrapper" v-if="currentOrder.services && currentOrder.services.length > 0">
              <table class="services-table">
                <thead>
                  <tr>
                    <th>Услуга</th>
                    <th class="col-quantity">Кол-во</th>
                    <th class="col-price">Прейскурант</th>
                    <th class="col-price">Цена</th>
                    <th class="col-sum">Сумма</th>
                    <th class="col-action"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(service, index) in currentOrder.services" :key="`service-${index}`">
                    <td>
                      <div class="service-name">{{ service.name }}</div>
                    </td>
                    <td class="col-quantity">
                      <input
                        type="number"
                        v-model.number="service.quantity"
                        min="1"
                        class="input-small"
                        @input="calculateTotal"
                      >
                    </td>
                    <td class="col-price text-muted">
                      {{ formatPrice(service.originalPrice) }} ₽
                    </td>
                    <td class="col-price">
                      <div class="price-input-group">
                        <input
                          type="number"
                          v-model.number="service.price"
                          min="0"
                          step="10"
                          class="input-small"
                          :class="{ 'price-changed': service.price !== service.originalPrice }"
                          @input="calculateTotal"
                        >
                        <span class="currency">₽</span>
                      </div>
                      <small v-if="service.price !== service.originalPrice" class="price-diff">
                        {{ service.price > service.originalPrice ? '+' : '' }}{{ formatPrice(service.price - service.originalPrice) }} ₽
                      </small>
                    </td>
                    <td class="col-sum">
                      <strong>{{ formatPrice(service.price * service.quantity) }} ₽</strong>
                    </td>
                    <td class="col-action">
                      <button type="button" class="btn-remove-row" @click="removeService(index)">
                        Удалить
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-else class="empty-services">
              <p>Услуги не добавлены</p>
              <small>Используйте поиск выше, чтобы добавить услуги</small>
            </div>

            <div class="order-total">
              <span class="total-label">ИТОГО:</span>
              <span class="total-value">{{ formatPrice(currentOrder.total) }} ₽</span>
            </div>
          </div>

          <div class="form-section">
            <div class="form-row">
              <div class="form-group">
                <label>Статус заказа:</label>
                <select v-model="currentOrder.statusId" class="form-select">
                  <option value="1">В работе</option>
                  <option value="2">Выполнен</option>
                  <option value="3">Выдано</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeOrderModal">
            Отмена
          </button>
          <button type="button" class="btn btn-primary" @click="saveOrder" :disabled="!canSave">
             Сохранить
          </button>
        </div>
      </div>
    </div>

 
    <div v-if="showNewClientModal" class="modal-overlay" @click.self="closeNewClientModal">
      <div class="modal-container modal-small">
        <div class="modal-header">
          <h3>Новый клиент</h3>
          <button class="modal-close" @click="closeNewClientModal">×</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label>ФИО: <span class="required">*</span></label>
            <input type="text" v-model="newClient.name" placeholder="Иванов Иван Иванович" required>
          </div>
          <div class="form-group">
            <label>Телефон: <span class="required">*</span></label>
            <input type="tel" v-model="newClient.phone" placeholder="+7 (900) 123-45-67" required>
          </div>
          <div class="form-group">
            <label>Email:</label>
            <input type="email" v-model="newClient.email" placeholder="email@example.com">
          </div>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeNewClientModal">
            Отмена
          </button>
          <button type="button" class="btn btn-primary" @click="createNewClient" :disabled="!newClient.name || !newClient.phone">
            Создать клиента
          </button>
        </div>
      </div>
    </div>

    
    <div v-if="showViewModal" class="modal-overlay" @click.self="closeViewModal">
      <div class="modal-container">
        <div class="modal-header">
          <h3>Заказ #{{ viewingOrder.id || '' }}</h3>
          <button class="modal-close" @click="closeViewModal">×</button>
        </div>
        
        <div class="modal-body">
          <div class="view-section">
            <h4>Клиент</h4>
            <p><strong>{{ viewingOrder.client?.name || 'Неизвестный клиент' }}</strong></p>
            <p>{{ viewingOrder.client?.phone || '' }} • {{ viewingOrder.client?.email || '' }}</p>
          </div>
          
          <div class="view-section" v-if="viewingOrder.services && viewingOrder.services.length > 0">
            <h4>Услуги</h4>
            <table class="services-table">
              <thead>
                <tr>
                  <th>Услуга</th>
                  <th>Кол-во</th>
                  <th>Цена</th>
                  <th>Сумма</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="service in viewingOrder.services" :key="`view-service-${service.serviceId}`">
                  <td>{{ service.name }}</td>
                  <td>{{ service.quantity }}</td>
                  <td>{{ formatPrice(service.price) }} ₽</td>
                  <td>{{ formatPrice(service.price * service.quantity) }} ₽</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" class="text-right"><strong>ИТОГО:</strong></td>
                  <td><strong>{{ formatPrice(viewingOrder.total || 0) }} ₽</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          <div class="view-section" v-else>
            <h4>Услуги</h4>
            <p>Нет услуг в заказе</p>
          </div>
          
          <div class="view-section" v-if="viewingOrder.notes">
            <h4>Примечания</h4>
            <p>{{ viewingOrder.notes }}</p>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeViewModal">Закрыть</button>
          <button class="btn btn-success" @click="openReceipt(viewingOrder.id)">📄 Квитанция</button>
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
  name: 'OrdersComponent',
  components: {
    HeaderComponent,
    FooterComponent
  },
  
  data() {
  return {

    orders: [],
    clients: [],
    services: [],
    statuses: [],
    

    statusFilter: '',
    dateFrom: '',
    dateTo: '',
    clientSearch: '',
    sortBy: 'date-desc',
    

    currentPage: 1,
    itemsPerPage: 10,
    totalPages: 1,
    totalItems: 0,
    

    showModal: false,
    modalTitle: 'Создать заказ',
    currentOrder: {
      id: null,
      clientId: null,
      statusId: '1',
      services: [],
      notes: '',
      total: 0
    },
    

    clientSearchQuery: '',
    filteredClients: [],
    showClientDropdown: false,
    selectedClient: null,
    

    serviceSearchQuery: '',
    filteredServices: [],
    showServiceDropdown: false,

    showNewClientModal: false,
    newClient: {
      name: '',
      phone: '',
      email: ''
    },

    showViewModal: false,
    viewingOrder: {
      id: null,
      client: {},
      services: [],
      status: {},
      total: 0,
      notes: ''
    },

    loading: false,
    submitting: false
  };
},
  computed: {
    ...mapGetters('auth', ['currentUser', 'isAdmin']),
    
    user() {
      return this.currentUser;
    },
    
    canSave() {
      return this.selectedClient && this.currentOrder.services.length > 0;
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

    checkAuth() {

      if (!this.currentUser) {
        const userData = sessionStorage.getItem('currentUser');
        if (userData) {
          try {
            const user = JSON.parse(userData);
            this.$store.dispatch('auth/setUser', user);
          } catch (error) {
            console.error('Ошибка восстановления авторизации:', error);
            this.$router.push('/login');
            return false;
          }
        } else {

          this.$router.push('/login');
          return false;
        }
      }
      

      if (!this.isAdmin) {
        alert('Доступ запрещён. Только администратор может просматривать заказы.');
        this.$router.push('/');
        return false;
      }
      
      return true;
    },

    

    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    },
    

    formatTime(dateString) {
      const date = new Date(dateString);
      return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    
    formatPrice(price) {
      return Number(price || 0).toLocaleString('ru-RU');
    },
    

    async loadOrders() {
      this.loading = true;
      
      try {
        const params = new URLSearchParams({
          page: this.currentPage,
          limit: this.itemsPerPage,
          sortBy: this.sortBy
        });
        

        if (this.statusFilter) params.append('statusFilter', this.statusFilter);
        if (this.dateFrom) params.append('dateFrom', this.dateFrom);
        if (this.dateTo) params.append('dateTo', this.dateTo);
        if (this.clientSearch) params.append('clientSearch', this.clientSearch);
        
        const response = await fetch(`/api/orders?${params}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          this.orders = Array.isArray(result.data) ? result.data : [];
          this.totalPages = result.pagination?.totalPages || 1;
          this.totalItems = result.pagination?.totalItems || 0;
          this.currentPage = result.pagination?.currentPage || 1;
        } else {
          console.error('Ошибка получения заказов:', result.message);
          this.orders = [];
        }
      } catch (error) {
        console.error('Ошибка загрузки заказов:', error);
        this.orders = [];
      } finally {
        this.loading = false;
      }
    },

    toggleSort(field) {
      if (field === 'date') {
        if (this.sortBy === 'date-desc') {
          this.sortBy = 'date-asc';
        } else {
          this.sortBy = 'date-desc';
        }
      } else if (field === 'amount') {
        if (this.sortBy === 'amount-desc') {
          this.sortBy = 'amount-asc';
        } else {
          this.sortBy = 'amount-desc';
        }
      }
      this.loadOrders();
    },
    

    sortOrders() {
      this.currentPage = 1;
      this.loadOrders();
    },
    
    filterOrders() {
      this.currentPage = 1;
      this.loadOrders();
    },
    
    async loadClients() {
      try {
        const response = await fetch('/api/orders/clients/all');
        const result = await response.json();
        
        if (result.success) {
          this.clients = result.data;
        }
      } catch (error) {
        console.error('Ошибка загрузки клиентов:', error);
      }
    },
    
    async loadServices() {
      try {
        const response = await fetch('/api/orders/services/all');
        const result = await response.json();
        
        if (result.success) {
          this.services = result.data;
        }
      } catch (error) {
        console.error('Ошибка загрузки услуг:', error);
      }
    },
    
    async loadStatuses() {
      try {
        const response = await fetch('/api/orders/statuses/all');
        const result = await response.json();
        
        if (result.success) {
          this.statuses = result.data;
        }
      } catch (error) {
        console.error('Ошибка загрузки статусов:', error);
      }
    },
    
    
    changePage(page) {
      if (page === '...' || page < 1 || page > this.totalPages) return;
      this.currentPage = page;
      this.loadOrders();
    },
    
    searchClients() {
      const query = this.clientSearchQuery.toLowerCase().trim();
      
      if (!query) {
        this.filteredClients = this.clients.slice(0, 5);
      } else {
        this.filteredClients = this.clients.filter(c =>
          c.name.toLowerCase().includes(query) ||
          c.phone.includes(query) ||
          c.email.toLowerCase().includes(query)
        ).slice(0, 5);
      }
      
      this.showClientDropdown = true;
    },
    
    selectClient(client) {
      this.selectedClient = client;
      this.currentOrder.clientId = client.id;
      this.clientSearchQuery = '';
      this.showClientDropdown = false;
    },
    
    clearSelectedClient() {
      this.selectedClient = null;
      this.currentOrder.clientId = null;
    },

    searchServices() {
      const query = this.serviceSearchQuery.toLowerCase().trim();
      
      if (!query) {
        this.filteredServices = this.services.slice(0, 5);
      } else {
        this.filteredServices = this.services.filter(s =>
          s.name.toLowerCase().includes(query)
        ).slice(0, 5);
      }
      
      this.showServiceDropdown = true;
    },
    
    addService(service) {
      const exists = this.currentOrder.services.find(s => s.serviceId === service.id);
      
      if (exists) {
        exists.quantity++;
      } else {
        this.currentOrder.services.push({
          serviceId: service.id,
          name: service.name,
          quantity: 1,
          price: service.price,
          originalPrice: service.price
        });
      }
      
      this.serviceSearchQuery = '';
      this.showServiceDropdown = false;
      this.calculateTotal();
    },
    
    removeService(index) {
      this.currentOrder.services.splice(index, 1);
      this.calculateTotal();
    },
    
    calculateTotal() {
      this.currentOrder.total = this.currentOrder.services.reduce((sum, s) => {
        return sum + (s.price * s.quantity);
      }, 0);
    },

    openOrderModal() {
      console.log('Открываю окно создания заказа');
      this.modalTitle = 'Создать заказ';
      this.resetCurrentOrder();
      this.showModal = true;
    },
    
    closeOrderModal() {
      this.showModal = false;
      this.resetCurrentOrder();
    },
    
    resetCurrentOrder() {
  this.currentOrder = {
    id: null,
    clientId: null,
    statusId: '1',
    services: [],
    notes: '',
    total: 0
  };
  this.selectedClient = null;
  this.clientSearchQuery = '';
  this.serviceSearchQuery = '';
  this.showClientDropdown = false;
  this.showServiceDropdown = false;
  this.filteredClients = [];
  this.filteredServices = [];
},
    

    async saveOrder() {
      if (!this.canSave) return;
      
      this.submitting = true;
      
      try {
        let url = '/api/orders';
        let method = 'POST';
        
        if (this.currentOrder.id) {
          url = `/api/orders/${this.currentOrder.id}`;
          method = 'PUT';
        }
        
        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            clientId: this.currentOrder.clientId,
            statusId: this.currentOrder.statusId,
            services: this.currentOrder.services.map(s => ({
              serviceId: s.serviceId,
              quantity: s.quantity,
              price: s.price
            })),
            notes: this.currentOrder.notes
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          alert(result.message || 'Заказ успешно сохранён!');
          this.closeOrderModal();
          await this.loadOrders();
        } else {
          alert(result.message || 'Ошибка при сохранении заказа');
        }
      } catch (error) {
        console.error('Ошибка сохранения заказа:', error);
        alert('Ошибка при сохранении заказа');
      } finally {
        this.submitting = false;
      }
    },
    
    saveAndPrint() {
      if (!this.canSave) return;
      this.saveOrder().then(() => {
        alert('Функция печати будет доступна позже');
      });
    },
    
    getStatusById(id) {
      const status = this.statuses.find(s => s.id == id);
      return status || { id: 1, name: 'В работе' };
    },
    
    async editOrder(id) {
      try {
        const response = await fetch(`/api/orders/${id}`);
        const result = await response.json();
        
        if (result.success) {
          const order = result.data;
          
          this.modalTitle = 'Редактировать заказ';
          this.currentOrder = {
            id: order.id,
            clientId: order.client.id,
            statusId: String(order.status.id),
            services: order.services.map(s => ({
              serviceId: s.serviceId,
              name: s.name,
              quantity: s.quantity,
              price: s.price,
              originalPrice: s.price
            })),
            notes: order.notes || '',
            total: order.total
          };
          this.selectedClient = order.client;
          this.showModal = true;
        }
      } catch (error) {
        console.error('Ошибка загрузки заказа:', error);
        alert('Ошибка при загрузке заказа');
      }
    },
    
    async viewOrder(id) {
      try {
        const response = await fetch(`/api/orders/${id}`);
        const result = await response.json();
        
        if (result.success) {
          this.viewingOrder = result.data;
          this.showViewModal = true;
        }
      } catch (error) {
        console.error('Ошибка загрузки заказа:', error);
        alert('Ошибка при загрузке заказа');
      }
    },
    
    closeViewModal() {
  this.showViewModal = false;
  this.viewingOrder = {
    id: null,
    client: {},
    services: [],
    status: {},
    total: 0,
    notes: ''
  };
},
    
    async deleteOrder(id) {
      if (!confirm('Удалить этот заказ? Это действие нельзя отменить!')) return;
      
      try {
        const response = await fetch(`/api/orders/${id}`, {
          method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
          alert('Заказ успешно удален');
          await this.loadOrders();
        } else {
          alert(result.message || 'Ошибка при удалении заказа');
        }
      } catch (error) {
        console.error('Ошибка удаления заказа:', error);
        alert('Ошибка при удалении заказа');
      }
    },
    
    openReceipt(orderId) {
  const routeData = this.$router.resolve({ 
    name: 'Receipt', 
    params: { id: orderId } 
  });
  window.open(routeData.href, '_blank');
},
    
    openNewClientModal() {
      this.showNewClientModal = true;
      this.newClient = { name: '', phone: '', email: '' };
    },
    
    closeNewClientModal() {
      this.showNewClientModal = false;
    },
    
    async createNewClient() {
      if (!this.newClient.name || !this.newClient.phone) return;
      
      try {
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fullName: this.newClient.name,
            phone: this.newClient.phone,
            email: this.newClient.email,
            role: 'client'
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          await this.loadClients();
          const newClientData = result.data;
          this.selectClient(newClientData);
          this.closeNewClientModal();
          alert('Клиент успешно создан!');
        } else {
          alert(result.message || 'Ошибка при создании клиента');
        }
      } catch (error) {
        console.error('Ошибка создания клиента:', error);
        alert('Ошибка при создании клиента');
      }
    },
    

    handleClickOutside(event) {
      if (!event.target.closest('.search-wrapper')) {
        this.showClientDropdown = false;
        this.showServiceDropdown = false;
      }
    }
  },
  mounted() {

    if (!this.checkAuth()) {
      return;
    }
    
    Promise.all([
      this.loadOrders(),
      this.loadClients(), 
      this.loadServices(),
      this.loadStatuses()
    ]).catch(error => {
      console.error('Ошибка при загрузке данных:', error);
    });
    
    document.addEventListener('click', this.handleClickOutside);
  },
  
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  }
};
</script>