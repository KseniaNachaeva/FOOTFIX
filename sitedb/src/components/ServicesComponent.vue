<template>
  <section class="popular-services">
    <h3>Популярные услуги</h3>

    <div v-if="loading" class="loading">
      <p>Загрузка услуг...</p>
    </div>

    <div v-else class="services-list">
      <div 
        v-for="service in services" 
        :key="service.id" 
        class="service-card"
      >
        <h4>{{ service.name }}</h4>
        <p class="service-price">{{ formatPrice(service.price) }} руб.</p>
        <p class="service-description">{{ service.description || 'Профессиональное выполнение' }}</p>

        <div v-if="service.orderCount > 0" class="service-orders">
          {{ service.orderCount }} заказов
        </div>
        
        <router-link to="/services" class="btn btn-primary btn-small">Подробнее</router-link>
      </div>
    </div>

    <div class="all-services-link">
      <router-link to="/services" class="btn btn-outline">
        Все услуги →
      </router-link>
    </div>
  </section>
</template>

<script>
export default {
  name: 'ServicesComponent',
  data() {
    return {
      services: [],
      loading: false
    };
  },
  mounted() {
    this.loadPopularServices();
  },
  methods: {
    async loadPopularServices() {
      this.loading = true;
      
      try {
        const response = await fetch('/api/services/popular', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
          this.services = result.data.slice(0, 3);
        }
        
      } catch (error) {
        console.error('Ошибка загрузки услуг:', error);
      } finally {
        this.loading = false;
      }
    },
    
    formatPrice(price) {
      return Number(price).toLocaleString('ru-RU');
    }
  }
};
</script>
