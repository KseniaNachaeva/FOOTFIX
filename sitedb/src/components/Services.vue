<template>
  <div class="services-page">
    <HeaderComponent />
    <div class="container content-container">

      <section class="page-header" v-if="isAdmin" id="adminControls">
        <h2>Управление услугами</h2>
        <button class="btn btn-primary" @click="openServiceModal()">Добавить услугу</button>
      </section>

      <section class="filters">
        <div class="search-box">
          <input 
            type="text" 
            v-model="searchTerm" 
            placeholder="Поиск по названию или описанию..." 
            @keyup.enter="searchServices"
          >
          <button @click="searchServices">Поиск</button>
          <button v-if="searchTerm" @click="clearSearch" class="btn-clear">Очистить</button>
        </div>
        <div class="filter-row">
          <div class="filter-item">
            <label>Сортировать по:</label>
            <select v-model="sortBy" @change="sortServices">
              <option value="name">Названию</option>
              <option value="price-asc">Цене (возр.)</option>
              <option value="price-desc">Цене (убыв.)</option>
            </select>
          </div>
        </div>
      </section>

      <section v-if="!loading" class="table-section">
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th class="col-name">Название услуги</th>
                <th class="col-price">Цена</th>
                <th class="col-description">Описание</th>
                <th v-if="isAdmin" class="col-actions">Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(service, index) in services" :key="`service-${currentPage}-${index}`">
                <td class="col-name">{{ service.name }}</td>
                <td class="col-price"><strong>{{ formatPrice(service.price) }} руб.</strong></td>
                <td class="col-description">{{ service.description || '-' }}</td>
                <td v-if="isAdmin" class="col-actions">
                  <div class="action-buttons">
                    <button class="btn btn-warning btn-small" @click="editService(service)">Изменить</button>
                    <button class="btn btn-danger btn-small" @click="deleteService(service)">Удалить</button>
                  </div>
                </td>
              </tr>

              <tr v-for="n in emptyRows" :key="`empty-${n}`" class="empty-row">
                <td class="col-name">&nbsp;</td>
                <td class="col-price">&nbsp;</td>
                <td class="col-description">&nbsp;</td>
                <td v-if="isAdmin" class="col-actions">&nbsp;</td>
              </tr>

              <tr v-if="services.length === 0 && !loading">
                <td :colspan="isAdmin ? 4 : 3" class="text-center no-data">
                  {{ searchTerm ? 'Услуги не найдены по запросу' : 'Нет доступных услуг' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        

        <div class="pagination-info">
          <span v-if="activeSearch" class="search-info">
            Поиск: "{{ activeSearch }}" | 
          </span>
          Показано {{ services.length }} из {{ totalItems }} услуг
        </div>
      </section>


      <div v-else class="loading-container">
        <p>Загрузка услуг...</p>
      </div>

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

      <div v-if="showModal" class="modal" @click.self="closeServiceModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ modalTitle }}</h3>
            <span class="close" @click="closeServiceModal">&times;</span>
          </div>
          
          <div class="modal-body">
            <form @submit.prevent="submitForm" novalidate>
              <div class="form-group">
                <label>Название услуги: <span class="required">*</span></label>
                <input type="text" v-model="currentService.name" required placeholder="Введите название">
              </div>
              
              <div class="form-group">
                <label>Цена (₽): <span class="required">*</span></label>
                <input type="text" v-model="currentService.price" @input="validatePrice" @keypress="allowOnlyNumbers" inputmode="numeric" pattern = "[0-9]" placeholder="0" required
>
              </div>
              
              <div class="form-group">
                <label>Описание:</label>
                <textarea v-model="currentService.description" rows="4" placeholder="Описание услуги (необязательно)"></textarea>
              </div>
              
              <div class="form-actions">
                <button type="button" class="btn btn-secondary" @click="closeServiceModal" :disabled="submitting">
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
    </div>
    <FooterComponent />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import HeaderComponent from '@/components/HeaderComponent.vue';
import FooterComponent from '@/components/FooterComponent.vue';

export default {
  name: 'ServicesComponent',
  components: {
    HeaderComponent,
    FooterComponent
  },
  data() {
    return {
      services: [],
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 20,
      searchTerm: '',
      activeSearch: '',
      sortBy: 'name',
      showModal: false,
      modalTitle: 'Добавить услугу',
      currentService: {
        id: null,
        name: '',
        price: 0,
        description: ''
      },
      loading: false,
      submitting: false,
      editingService: null
    }
  },
  computed: {
    ...mapGetters('auth', ['currentUser']),
    
    user() {
      return this.currentUser || null;
    },

    isAdmin() {
      return this.user && this.user.role === 'admin';
    },

    emptyRows() {
      if (this.services.length === 0) return 0;
      const minRows = 10;
      const currentRows = this.services.length;
      return currentRows < minRows ? minRows - currentRows : 0;
    },

    visiblePages() {
      const pages = [];
      const total = this.totalPages;
      const current = this.currentPage;

      pages.push(1);

      if (current > 3) {
        pages.push('...');
      }

      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      if (current < total - 2) {
        pages.push('...');
      }

      if (total > 1 && !pages.includes(total)) {
        pages.push(total);
      }

      return pages.filter((page, index, self) => {
        if (page === '...') {
          return self[index - 1] !== '...' && self[index + 1] !== '...';
        }
        return true;
      });
    }
  },
  mounted() {
    this.loadServices();
  },
  methods: {
    
    allowOnlyNumbers(e) {
      const charCode = e.which || e.keyCode;
      const charStr = String.fromCharCode(charCode);
      if (!/^[0-9.,]$/.test(charStr)) {
        e.preventDefault();
      }
    },


    validateIntegerPrice() {
  const value = this.currentService.price.replace(/\D/g, '');
  const num = parseInt(value, 10);
  this.currentService.price = (!isNaN(num) && num >= 1) ? String(num) : '';
},


    async loadServices() {
      this.loading = true;
      
      try {
        const params = new URLSearchParams({
          page: this.currentPage,
          limit: this.itemsPerPage,
          sort: this.sortBy,
          search: this.activeSearch
        });

        const response = await fetch(`/api/services?${params}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          this.services = result.data;
          this.totalPages = result.pagination.totalPages;
          this.totalItems = result.pagination.totalItems;
          this.currentPage = result.pagination.currentPage;
        }
      } catch (error) {
        console.error('Ошибка загрузки услуг:', error);
        this.services = [];
        alert('Ошибка загрузки услуг');
      } finally {
        this.loading = false;
      }
    },

    formatPrice(price) {
      return Number(price || 0).toLocaleString('ru-RU');
    },

    searchServices() {
      this.activeSearch = this.searchTerm;
      this.currentPage = 1;
      this.loadServices();
    },

    clearSearch() {
      this.searchTerm = '';
      this.activeSearch = '';
      this.currentPage = 1;
      this.loadServices();
    },

    sortServices() {
      this.currentPage = 1;
      this.loadServices();
    },

    changePage(page) {
      if (page === '...' || page < 1 || page > this.totalPages) return;
      this.currentPage = page;
      this.loadServices();
      
      const tableSection = document.querySelector('.table-section');
      if (tableSection) {
        tableSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },

    openServiceModal() {
      if (!this.isAdmin) {
        alert('Только администратор может добавлять услуги');
        return;
      }

      this.modalTitle = 'Добавить услугу';
      this.resetCurrentService();
      this.showModal = true;
    },

    closeServiceModal() {
      this.showModal = false;
      this.submitting = false;
      this.resetCurrentService();
    },

    editService(service) {
      if (!this.isAdmin) {
        alert('Только администратор может редактировать услуги');
        return;
      }

      console.log('Редактирование услуги:', service);
      
      this.modalTitle = 'Редактировать услугу';
      this.currentService = {
        id: service.id,
        name: service.name,
        price: service.price,
        description: service.description || ''
      };
      this.showModal = true;
    },

    async deleteService(service) {
      if (!this.isAdmin) {
        alert('Только администратор может удалять услуги');
        return;
      }

      if (!confirm(`Вы уверены, что хотите удалить услугу "${service.name}"?\nЭто действие нельзя отменить!`)) {
        return;
      }

      try {
        console.log('Удаление услуги ID:', service.id);
        
        const response = await fetch(`/api/services/${service.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const result = await response.json();
        
        if (response.ok && result.success) {
          alert('Услуга успешно удалена');
          await this.loadServices();
        } else {
          alert(result.message || 'Ошибка при удалении услуги');
        }
      } catch (error) {
        console.error('Ошибка удаления услуги:', error);
        alert('Ошибка при удалении услуги');
      }
    },

    resetCurrentService() {
      this.currentService = {
        id: null,
        name: '',
        price: 0,
        description: ''
      };
    },

    async submitForm() {
      if (!this.isAdmin) {
        alert('Только администратор может сохранять услуги');
        return;
      }

      this.submitting = true;

      try {
        let url = '/api/services';
        let method = 'POST';

        if (this.currentService.id) {
          url = `/api/services/${this.currentService.id}`;
          method = 'PUT';
          console.log('Обновление услуги:', this.currentService);
        } else {
          console.log('Создание новой услуги:', this.currentService);
        }

        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: this.currentService.name,
            price: this.currentService.price,
            description: this.currentService.description || null
          })
        });

        const result = await response.json();
        
        if (response.ok && result.success) {
          alert(result.message || (this.currentService.id ? 'Услуга успешно обновлена!' : 'Услуга успешно создана!'));
          this.closeServiceModal();
          await this.loadServices();
        } else {
          alert(result.message || 'Ошибка при сохранении услуги');
        }
      } catch (error) {
        console.error('Ошибка сохранения услуги:', error);
        alert('Ошибка при сохранении услуги');
      } finally {
        this.submitting = false;
      }
    }
  }
}
</script>