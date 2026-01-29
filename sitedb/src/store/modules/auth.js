const state = {
  user: null
};

const getters = {
  currentUser: state => state.user,
  isAuthenticated: state => !!state.user,
  isAdmin: state => state.user && state.user.role === 'admin',
  user: state => state.user
};

const mutations = {
  SET_USER(state, user) {
    state.user = user;
  },
  CLEAR_USER(state) {
    state.user = null;
  }
};

const actions = {
  setUser({ commit }, user) {
    commit('SET_USER', user);
    if (user) {
      sessionStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('currentUser');
    }
  },
  
  clearUser({ commit }) {
    commit('CLEAR_USER');
    sessionStorage.removeItem('currentUser');
  },
  
  initAuth({ commit }) {
    const userData = sessionStorage.getItem('currentUser');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        commit('SET_USER', user);
      } catch (error) {
        console.error('Ошибка парсинга данных пользователя:', error);
        sessionStorage.removeItem('currentUser');
      }
    }
  }
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
};