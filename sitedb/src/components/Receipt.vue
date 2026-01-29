<template>
  <div class="receipt-page">

    <div class="receipt-controls no-print">
      <button @click="printReceipt" class="btn btn-primary">Печать</button>
      <button @click="goBack" class="btn btn-secondary">← Назад</button>
    </div>

    <div v-if="loading" class="loading">
      <p>Загрузка квитанции...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
    </div>

    <div v-else class="receipt">

      <div class="receipt-header">
        <div class="company-info">
          <h1>{{ receipt.company.name }}</h1>
          <p>{{ receipt.company.address }}</p>
          <p>Тел: {{ receipt.company.phone }}</p>
        </div>
        <div class="receipt-title">
          <h2>КВИТАНЦИЯ</h2>
          <p class="receipt-number">№ {{ receipt.orderNumber }}</p>
          <p class="receipt-date">от {{ formatDate(receipt.date) }}</p>
        </div>
      </div>

      <div class="client-section">
        <h3>Клиент:</h3>
        <table class="client-info">
          <tr>
            <td>ФИО:</td>
            <td>{{ receipt.client.name }}</td>
          </tr>
          <tr>
            <td>Телефон:</td>
            <td>{{ receipt.client.phone }}</td>
          </tr>
          <tr>
            <td>Email:</td>
            <td>{{ receipt.client.email }}</td>
          </tr>
        </table>
      </div>

      <div class="services-section">
        <h3>Услуги:</h3>
        <table class="services-table">
          <thead>
            <tr>
              <th>№</th>
              <th>Наименование</th>
              <th>Кол-во</th>
              <th>Цена</th>
              <th>Сумма</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(service, index) in receipt.services" :key="index">
              <td>{{ index + 1 }}</td>
              <td>{{ service.name }}</td>
              <td>{{ service.quantity }}</td>
              <td>{{ formatPrice(service.price) }} ₽</td>
              <td>{{ formatPrice(service.sum) }} ₽</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" class="total-label">ИТОГО:</td>
              <td class="total-value">{{ formatPrice(receipt.total) }} ₽</td>
            </tr>
          </tfoot>
        </table>
      </div>
      

      <div class="status-section">
        <p>Статус заказа: <strong>{{ receipt.status }}</strong></p>
      </div>
      

      <div class="signatures">
        <div class="signature">
          <p>Принял: _________________</p>
          <p class="signature-hint">(подпись мастера)</p>
        </div>
        <div class="signature">
          <p>Сдал: _________________</p>
          <p class="signature-hint">(подпись клиента)</p>
        </div>
      </div>

      <div class="receipt-footer">
        <p>Спасибо за обращение в нашу мастерскую!</p>
        <p class="print-date">Дата печати: {{ currentDate }}</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ReceiptComponent',
  
  data() {
    return {
      loading: true,
      error: null,
      receipt: {
        orderNumber: null,
        date: null,
        status: '',
        client: { name: '', phone: '', email: '' },
        services: [],
        total: 0,
        company: { name: '', address: '', phone: '' }
      }
    };
  },
  
  computed: {
    currentDate() {
      return new Date().toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  },
  
  mounted() {
    this.loadReceipt();
  },
  
  methods: {
    async loadReceipt() {
      this.loading = true;
      this.error = null;
      
      try {
        const orderId = this.$route.params.id;
        
        const response = await fetch(`/api/orders/${orderId}/receipt`);
        const result = await response.json();
        
        if (result.success) {
          this.receipt = result.data;
        } else {
          this.error = result.message || 'Ошибка загрузки квитанции';
        }
        
      } catch (error) {
        console.error('Ошибка:', error);
        this.error = 'Ошибка соединения с сервером';
      } finally {
        this.loading = false;
      }
    },
    
    formatDate(dateString) {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    },
    
    formatPrice(price) {
      return Number(price || 0).toLocaleString('ru-RU');
    },
    
    printReceipt() {
      window.print();
    },
    
    goBack() {
      this.$router.back();
    }
  }
};
</script>

<style scoped>
.receipt-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: white;
  min-height: 100vh;
}

.receipt-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.loading, .error {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
}

.error {
  color: #e74c3c;
}

.receipt {
  border: 2px solid #333;
  padding: 30px;
  font-family: 'Times New Roman', Times, serif;
}

.receipt-header {
  display: flex;
  justify-content: space-between;
  border-bottom: 2px solid #333;
  padding-bottom: 20px;
  margin-bottom: 20px;
}

.company-info h1 {
  font-size: 1.5rem;
  margin-bottom: 5px;
  color: #333;
}

.company-info p {
  margin: 3px 0;
  color: #555;
  font-size: 0.9rem;
}

.receipt-title {
  text-align: right;
}

.receipt-title h2 {
  font-size: 1.8rem;
  margin-bottom: 10px;
  color: #333;
}

.receipt-number {
  font-size: 1.2rem;
  font-weight: bold;
}

.receipt-date {
  color: #555;
}

.client-section {
  margin-bottom: 25px;
}

.client-section h3 {
  font-size: 1.1rem;
  margin-bottom: 10px;
  color: #333;
}

.client-info {
  width: 100%;
}

.client-info td {
  padding: 5px 10px 5px 0;
}

.client-info td:first-child {
  width: 100px;
  color: #555;
}

.services-section {
  margin-bottom: 25px;
}

.services-section h3 {
  font-size: 1.1rem;
  margin-bottom: 10px;
  color: #333;
}

.services-table {
  width: 100%;
  border-collapse: collapse;
}

.services-table th,
.services-table td {
  border: 1px solid #333;
  padding: 10px;
  text-align: left;
}

.services-table th {
  background: #f0f0f0;
  font-weight: bold;
}

.services-table th:nth-child(1) { width: 40px; }
.services-table th:nth-child(3) { width: 80px; text-align: center; }
.services-table th:nth-child(4) { width: 100px; text-align: right; }
.services-table th:nth-child(5) { width: 100px; text-align: right; }

.services-table td:nth-child(3) { text-align: center; }
.services-table td:nth-child(4),
.services-table td:nth-child(5) { text-align: right; }

.services-table tfoot td {
  font-weight: bold;
  font-size: 1.1rem;
}

.total-label {
  text-align: right;
  border: none !important;
  background: none !important;
}

.total-value {
  background: #f0f0f0;
}

.status-section {
  margin-bottom: 30px;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 5px;
}

.signatures {
  display: flex;
  justify-content: space-between;
  margin: 40px 0;
}

.signature {
  width: 45%;
}

.signature p {
  margin: 5px 0;
}

.signature-hint {
  font-size: 0.8rem;
  color: #777;
}

.receipt-footer {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #ccc;
  color: #555;
}

.print-date {
  font-size: 0.8rem;
  color: #999;
  margin-top: 10px;
}

@media print {
  .no-print {
    display: none !important;
  }
  
  .receipt-page {
    padding: 0;
    margin: 0;
  }
  
  .receipt {
    border: none;
    padding: 0;
  }
  
  body {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
}
</style>