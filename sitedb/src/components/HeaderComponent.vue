<template>
  <header :class="{ scrolled: isScrolled }">
    <nav :class="['navbar', { scrolled: isScrolled }]">
      <div class="nav-container">
        <h1 class="logo">Обувная мастерская "FootFix"</h1>
        <ul class="nav-menu" id="navMenu">
          <template v-if="!user">
            <li><router-link to="/" class="nav-link" :class="{ 'active': $route.path === '/' }">Главная</router-link></li>
            <li><router-link to="/services" class="nav-link" :class="{ 'active': $route.path === '/services' }">Услуги</router-link></li>
            <li><router-link to="/login" class="btn-login-nav">Вход</router-link></li>
          </template>
          <template v-else-if="user.role === 'admin'">
            <li><router-link to="/" class="nav-link" :class="{ 'active': $route.path === '/' }">Главная</router-link></li>
            <li><router-link to="/services" class="nav-link" :class="{ 'active': $route.path === '/services' }">Услуги</router-link></li>
            <li><router-link to="/orders" class="nav-link" :class="{ 'active': $route.path === '/orders' }">Заказы</router-link></li>
            <li><router-link to="/users" class="nav-link" :class="{ 'active': $route.path === '/users' }">Клиенты</router-link></li>
            <li><router-link to="/admin" class="nav-link" :class="{ 'active': $route.path === '/admin' }">Админ панель</router-link></li>
            <li class="nav-user">
              <div class="user-info-wrapper">
                <span class="user-name">{{ user.fullName }}</span>
              </div>
              <button @click="logout" class="btn-logout-nav">Выйти</button>
            </li>
          </template>
          <template v-else-if="user.role === 'client'">
            <li><router-link to="/" class="nav-link" :class="{ 'active': $route.path === '/' }">Главная</router-link></li>
            <li><router-link to="/services" class="nav-link" :class="{ 'active': $route.path === '/services' }">Услуги</router-link></li>
            <li><router-link to="/account" class="nav-link" :class="{ 'active': $route.path === '/account' }">Личный кабинет</router-link></li>
            <li class="nav-user">
              <div class="user-info-wrapper">
                <span class="user-name">{{ user.fullName }}</span>
              </div>
              <button @click="logout" class="btn-logout-nav">Выйти</button>
            </li>
          </template>
        </ul>
        <div class="hamburger" @click="toggleMenu">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </nav>
  </header>
</template>

<script>
import { mapGetters } from 'vuex';
import bgImage from '@/assets/BG.png'
import bgsImage from '@/assets/BGS.png'

export default {
  name: 'HeaderComponent',
  data() {
    return {
      isScrolled: false,
      currentPage: 'index.html'
    };
  },
  computed: {
    ...mapGetters('auth', ['currentUser']),
    
    user() {
      return this.currentUser;
    }
  },
  mounted() {

    this.updateCurrentPage();
    
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      navbar.style.backgroundImage = `url(${bgImage})`;
    }
    
    this.initScrollEffect();
    this.reorganizeNavbar();
  },
  methods: {
    updateCurrentPage() {
      if (this.$route) {
        this.currentPage = this.$route.path.substring(1) || 'index.html';
      }
    },
    initScrollEffect() {
      window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const navbar = document.querySelector('.navbar');

        if (scrollTop > 100) {
          this.isScrolled = true;
          if (navbar) {
            navbar.style.backgroundImage = `url(${bgsImage})`;
          }
        } else {
          this.isScrolled = false;
          if (navbar) {
            navbar.style.backgroundImage = `url(${bgImage})`;
          }
        }
      });
    },
    reorganizeNavbar() {
    
      this.$nextTick(() => {
        const navbar = document.querySelector('.navbar');
        const navContainer = document.querySelector('.nav-container');
        const logo = document.querySelector('.logo');

        if (navbar && navContainer && logo && logo.parentElement === navContainer) {
          navbar.insertBefore(logo, navContainer);
        }
      });
    },
    toggleMenu() {
      const navMenu = document.querySelector('.nav-menu');
      const hamburger = document.querySelector('.hamburger');

      if (navMenu) navMenu.classList.toggle('active');
      if (hamburger) hamburger.classList.toggle('active');
    },
    logout() {
      if (confirm('Вы уверены, что хотите выйти из системы?')) {
        this.$store.dispatch('auth/clearUser');
        this.$router.push('/');
      }
    }
  },
  watch: {
    '$route'() {
      this.updateCurrentPage();
    }
  }
};
</script>