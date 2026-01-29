
<template>
  <div class="auth-page">
    <HeaderComponent />
    <div class="container">
      <div class="login-container">
        <h2>{{ isLogin ? 'Вход в систему' : 'Регистрация' }}</h2>
        
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>Email: <span class="required">*</span></label>
            <input 
              type="email" 
              v-model="email" 
              required
              :disabled="loading"
              placeholder="example@mail.ru"
            >
          </div>

          <div class="form-group">
            <label>Пароль: <span class="required">*</span></label>
            <input 
              type="password" 
              v-model="password" 
              required
              :disabled="loading"
              minlength="6"
              placeholder="Минимум 6 символов"
            >
          </div>

          <template v-if="!isLogin">
            <div class="form-group">
              <label>Полное имя: <span class="required">*</span></label>
              <input 
                type="text" 
                v-model="fullName" 
                required
                :disabled="loading"
                placeholder="Иванов Иван Иванович"
              >
            </div>

            <div class="form-group">
              <label>Телефон:</label>
              <input 
                type="tel" 
                v-model="phone"
                :disabled="loading"
                placeholder="+7 (900) 123-45-67"
              >
            </div>
          </template>

          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>
          
          <div v-if="successMessage" class="success-message">
            {{ successMessage }}
          </div>

          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться') }}
          </button>
        </form>

        <div class="form-switch">
          <p>
            {{ isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?' }}
            <a href="#" @click.prevent="toggleForm">
              {{ isLogin ? 'Зарегистрироваться' : 'Войти' }}
            </a>
          </p>
        </div>
      </div>
    </div>
    <FooterComponent />
  </div>
</template>

<script>
import HeaderComponent from '@/components/HeaderComponent.vue';
import FooterComponent from '@/components/FooterComponent.vue';

export default {
  name: 'AuthComponent',
  components: {
    HeaderComponent,
    FooterComponent
  },
  data() {
    return {
      email: '',
      password: '',
      fullName: '',
      phone: '',
      isLogin: true,
      loading: false,
      errorMessage: '',
      successMessage: ''
    };
  },
  methods: {
    async handleSubmit() {
      this.errorMessage = '';
      this.successMessage = '';
      this.loading = true;

      try {
        if (this.isLogin) {

          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: this.email,
              password: this.password
            })
          });
          
          const result = await response.json();
          
          if (result.success) {

            sessionStorage.setItem('currentUser', JSON.stringify(result.data));
            this.$store.dispatch('auth/setUser', result.data);
            
            this.successMessage = 'Вход выполнен!';
            

            setTimeout(() => {
              this.$router.push('/');
            }, 500);
          } else {
            this.errorMessage = result.message || 'Ошибка входа';
          }
          
        } else {

          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: this.email,
              password: this.password,
              fullName: this.fullName,
              phone: this.phone
            })
          });
          
          const result = await response.json();
          
          if (result.success) {

            sessionStorage.setItem('currentUser', JSON.stringify(result.data));
            this.$store.dispatch('auth/setUser', result.data);
            
            this.successMessage = 'Регистрация успешна!';
            

            setTimeout(() => {
              this.$router.push('/');
            }, 500);
          } else {
            this.errorMessage = result.message || 'Ошибка регистрации';
          }
        }
        
      } catch (error) {
        console.error('Ошибка:', error);
        this.errorMessage = 'Ошибка соединения с сервером';
      } finally {
        this.loading = false;
      }
    },
    
    toggleForm() {
      this.isLogin = !this.isLogin;
      this.errorMessage = '';
      this.successMessage = '';
      this.password = '';
    }
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.login-container {
  max-width: 400px;
  margin: 50px auto;
  padding: 30px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.login-container h2 {
  text-align: center;
  margin-bottom: 25px;
  color: #2c3e50;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  color: #555;
}

.required {
  color: #e74c3c;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.form-group input:disabled {
  background: #f5f5f5;
}

.error-message {
  color: #e74c3c;
  background: #fdeaea;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 15px;
  text-align: center;
}

.success-message {
  color: #27ae60;
  background: #d4edda;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 15px;
  text-align: center;
}

.btn {
  width: 100%;
  padding: 12px;
  font-size: 1rem;
  font-weight: bold;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #764ba2, #667eea);
  transform: translateY(-2px);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.form-switch {
  margin-top: 20px;
  text-align: center;
}

.form-switch a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.form-switch a:hover {
  text-decoration: underline;
}
</style>