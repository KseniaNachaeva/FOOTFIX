import { createRouter, createWebHashHistory } from 'vue-router';
import store from '@/store';

import IndexPage from '@/views/Index.vue';
import Auth from '@/components/Auth.vue';
import Services from '@/components/Services.vue';
import Orders from '@/components/Orders.vue';
import Users from '@/components/Users.vue';
import Admin from '@/components/Admin.vue';
import Account from '@/components/Account.vue';
import Receipt from '@/components/Receipt.vue'

const routes = [
  {
    path: '/',
    name: 'Index',
    component: IndexPage
  },
  {
    path: '/login',
    name: 'Login',
    component: Auth
  },
  {
    path: '/services',
    name: 'Services',
    component: Services
  },
  {
    path: '/orders',
    name: 'Orders',
    component: Orders,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/users',
    name: 'Users',
    component: Users,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: Admin,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/account',
    name: 'Account',
    component: Account,
    meta: { requiresAuth: true }
  },
  {
  path: '/receipt/:id',
  name: 'Receipt',
  component: Receipt,
  meta: { admin: true }
}
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  if (!store.getters['auth/currentUser']) {
    const userData = sessionStorage.getItem('currentUser');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        store.dispatch('auth/setUser', user);
      } catch (error) {
        console.error('Ошибка восстановления сессии:', error);
        sessionStorage.removeItem('currentUser');
      }
    }
  }
  
  const currentUser = store.getters['auth/currentUser'];
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin);
  
  if (requiresAuth && !currentUser) {
    next('/login');
  } else if (requiresAdmin && (!currentUser || currentUser.role !== 'admin')) {
    alert('Доступ запрещён. Требуются права администратора.');
    next('/');
  } else {
    next();
  }
});

export default router;