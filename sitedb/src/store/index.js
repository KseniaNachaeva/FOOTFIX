
import { createStore } from 'vuex'

export default createStore({
  modules: {
    auth: {
      namespaced: true,
      
      state: {
        user: JSON.parse(sessionStorage.getItem('currentUser')) || null
      },
      
      getters: {
        currentUser: state => state.user,
        isAuthenticated: state => !!state.user,
        isAdmin: state => state.user?.role === 'admin',
        user: state => state.user
      },
      
      mutations: {
        SET_USER(state, user) {
          state.user = user
          if (user) {
            sessionStorage.setItem('currentUser', JSON.stringify(user))
          } else {
            sessionStorage.removeItem('currentUser')
          }
        }
      },
      
      actions: {
        setUser({ commit }, user) {
          commit('SET_USER', user)
        },
        
        clearUser({ commit }) {
          commit('SET_USER', null)
        }
      }
    }
  }
})