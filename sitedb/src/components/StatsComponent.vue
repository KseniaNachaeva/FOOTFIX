<template>
  <section class="statistics">
    <h3>Наши достижения</h3>
    <div class="stats-grid">
      <div class="stat-card">
        <h4>Всего заказов</h4>
        <p class="stat-number" ref="totalOrders">0</p>
      </div>
      <div class="stat-card">
        <h4>Довольных клиентов</h4>
        <p class="stat-number" ref="totalClients">0</p>
      </div>
      <div class="stat-card">
        <h4>Видов услуг</h4>
        <p class="stat-number" ref="totalServices">0</p>
      </div>
      <div class="stat-card">
        <h4>Лет опыта</h4>
        <p class="stat-number" ref="yearsExperience">0</p>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'StatsComponent',
  data() {
    return {
      stats: {
        totalOrders: 0,
        totalClients: 0,
        totalServices: 0,
        yearsExperience: 14
      }
    };
  },
  mounted() {
    this.loadStatistics();
  },
  methods: {
    async loadStatistics() {
      try {
        console.log('Загружаем статистику с сервера...');
        
        const response = await fetch('/api/stats', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ошибка! статус: ${response.status}`);
        }

        const result = await response.json();
        console.log('Получены данные:', result);
        
        if (result.success && result.data) {

          this.animateNumber('totalOrders', result.data.totalOrders || 0);
          this.animateNumber('totalClients', result.data.totalClients || 0);
          this.animateNumber('totalServices', result.data.totalServices || 0);
          this.animateNumber('yearsExperience', result.data.yearsExperience || 14);
          

          this.stats = result.data;
        } else {
          console.warn('Неверный формат данных от сервера');
          this.loadDefaultValues();
        }
        
      } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
      }
    },
    animateNumber(elementRef, finalValue) {
      const element = this.$refs[elementRef];
      if (!element) return;

      let current = 0;
      const increment = finalValue / 50;
      const timer = setInterval(() => {
        current += increment;
        if (current >= finalValue) {
          current = finalValue;
          clearInterval(timer);
        }
        element.textContent = Math.round(current);
      }, 20);
    }
  }
};
</script>

