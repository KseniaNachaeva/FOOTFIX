<template>
  <main class="container">
    <StatsComponent />
    <ServicesComponent />
    <UserSectionComponent />
  </main>
</template>

<script>
import StatsComponent from './StatsComponent.vue';
import ServicesComponent from './ServicesComponent.vue';
import UserSectionComponent from './UserSectionComponent.vue';

export default {
  name: 'MainContent',
  components: {
    StatsComponent,
    ServicesComponent,
    UserSectionComponent
  },
  data() {
    return {
      user: null
    };
  },
  mounted() {
    this.checkAuth();
  },
  methods: {
    checkAuth() {
      const userData = sessionStorage.getItem('currentUser');
      this.user = userData ? JSON.parse(userData) : null;
    }
  }
};
</script>