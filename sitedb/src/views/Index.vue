<template>
  <div class="index-page">
    <HeaderComponent />
    <MainContent />
    <FooterComponent />
  </div>
</template>

<script>
import HeaderComponent from '@/components/HeaderComponent.vue';
import MainContent from '@/components/MainContent.vue';
import FooterComponent from '@/components/FooterComponent.vue';

export default {
  name: 'IndexPage',
  components: {
    HeaderComponent,
    MainContent,
    FooterComponent
  },
  mounted() {

    this.checkAuth();
  },
  methods: {
    checkAuth() {
      const userData = sessionStorage.getItem('currentUser');
      return userData ? JSON.parse(userData) : null;
    }
  }
};
</script>