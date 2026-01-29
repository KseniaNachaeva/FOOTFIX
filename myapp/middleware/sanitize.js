
const patterns = {
  name: /^[a-zA-Zа-яА-ЯёЁ\s\-]+$/,
  email: /^[a-zA-Z0-9._%+\-@]+$/,
  phone: /^[0-9+\s()\-]+$/,
  text: /^[a-zA-Zа-яА-ЯёЁ0-9\s.,!?\-_@()+:;№%"'\n\r]+$/,
  number: /^[0-9.,]+$/,
  password: /^[a-zA-Zа-яА-ЯёЁ0-9\s.,!?@#$%^&*()_+\-=\[\]{};':"\\|`~]+$/,
  default: /^[a-zA-Zа-яА-ЯёЁ0-9\s.,!?\-_@()+:;]+$/
};


const fieldRules = {
  'fullName': 'name',
  'Full_name': 'name',
  'name': 'name',
  'email': 'email',
  'Email': 'email',
  'phone': 'phone',
  'Telephone': 'phone',
  'notes': 'text',
  'description': 'text',
  'Description': 'text',
  'comment': 'text',
  'price': 'number',
  'Price': 'number',
  'quantity': 'number',
  'Quantity': 'number',
  'password': 'password',
  'Password': 'password',
  'newPassword': 'password',
  'confirmPassword': 'password'
};


const fieldLabels = {
  'fullName': 'ФИО',
  'Full_name': 'ФИО',
  'name': 'Название',
  'email': 'Email',
  'Email': 'Email',
  'phone': 'Телефон',
  'Telephone': 'Телефон',
  'notes': 'Примечания',
  'description': 'Описание',
  'Description': 'Описание',
  'password': 'Пароль',
  'Password': 'Пароль',
  'price': 'Цена',
  'Price': 'Цена',
  'quantity': 'Количество',
  'Quantity': 'Количество',
  'clientId': 'Клиент',
  'statusId': 'Статус',
  'roleId': 'Роль',
  'serviceId': 'Услуга'
};


const skipFields = [
  'id',
  'ID',
  'clientId',
  'statusId',
  'roleId',
  'serviceId',
  'userId',
  'Services_ID',
  'Users_ID',
  'Status_ID',
  'Role_ID',
  'page',
  'limit',
  'sortBy',
  'showInactive',
  'statusFilter',
  'roleFilter',
  'dateFrom',
  'dateTo'
];


const searchFields = [
  'searchTerm',
  'search',
  'query',
  'q',
  'clientSearch',
  'filter'
];


const escapeHtml = (str) => {
  if (typeof str !== 'string') return str;
  
  return str
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/`/g, '&#x60;')
    .replace(/\\/g, '&#x5C;')
    .replace(/\{/g, '&#x7B;')
    .replace(/\}/g, '&#x7D;')
    .replace(/\[/g, '&#x5B;')
    .replace(/\]/g, '&#x5D;');
};


const shouldSkipField = (fieldName) => {
  if (skipFields.includes(fieldName)) return true;
  if (fieldName.endsWith('Id') || fieldName.endsWith('ID')) return true;
  return false;
};

const isSearchField = (fieldName) => {
  return searchFields.includes(fieldName);
};


const isValidString = (str, patternName = 'default') => {
  if (typeof str !== 'string') return true;
  if (str.trim() === '') return true;
  
  const pattern = patterns[patternName] || patterns.default;
  return pattern.test(str);
};


const getInvalidChars = (str) => {
  if (typeof str !== 'string') return [];
  
  const dangerous = ['<', '>', '{', '}', '[', ']', '\\', '`'];
  const found = [];
  
  for (const char of dangerous) {
    if (str.includes(char)) {
      found.push(char);
    }
  }
  
  return found;
};


const escapeSearchFields = (obj, path = '') => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    const fieldName = path.split('.').pop();
    if (isSearchField(fieldName)) {
      return escapeHtml(obj);
    }
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map((item, index) => escapeSearchFields(item, `${path}[${index}]`));
  }
  
  if (typeof obj === 'object') {
    const result = {};
    for (const key in obj) {
      const fieldPath = path ? `${path}.${key}` : key;
      result[key] = escapeSearchFields(obj[key], fieldPath);
    }
    return result;
  }
  
  return obj;
};


const validateObject = (obj, path = '') => {
  const errors = [];
  
  if (obj === null || obj === undefined) return errors;
  
  if (typeof obj === 'string') {
    const fieldName = path.split('.').pop();
    

    if (shouldSkipField(fieldName)) return errors;
    

    if (isSearchField(fieldName)) return errors;
    

    const patternName = fieldRules[fieldName] || 'default';
    

    if (!isValidString(obj, patternName)) {
      const invalidChars = getInvalidChars(obj);
      const label = fieldLabels[fieldName] || fieldName;
      
      errors.push({
        field: path || 'value',
        label: label,
        message: invalidChars.length > 0
          ? `Поле "${label}" содержит недопустимые символы: ${invalidChars.join(' ')}`
          : `Поле "${label}" содержит недопустимые символы`
      });
    }
    
    return errors;
  }
  
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      errors.push(...validateObject(item, `${path}[${index}]`));
    });
    return errors;
  }
  
  if (typeof obj === 'object') {
    for (const key in obj) {
      const fieldPath = path ? `${path}.${key}` : key;
      errors.push(...validateObject(obj[key], fieldPath));
    }
    return errors;
  }
  
  return errors;
};


const sanitize = (req, res, next) => {

  if (req.query && Object.keys(req.query).length > 0) {
    req.query = escapeSearchFields(req.query);
  }
  
  if (req.body && Object.keys(req.body).length > 0) {
    req.body = escapeSearchFields(req.body);
  }
  

  const errors = [];
  
  if (req.body && Object.keys(req.body).length > 0) {
    errors.push(...validateObject(req.body));
  }
  
  if (req.query && Object.keys(req.query).length > 0) {
    errors.push(...validateObject(req.query, 'query'));
  }
  

  if (errors.length > 0) {
    console.warn('[SECURITY] Заблокированы недопустимые символы:', {
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
      errors: errors
    });
    
    return res.status(400).json({
      success: false,
      message: 'Введены недопустимые символы',
      hint: 'Разрешены буквы, цифры и базовая пунктуация (. , ! ? - _ @ + : ;)',
      errors: errors.map(e => ({
        field: e.field,
        message: e.message
      }))
    });
  }
  
  next();
};

module.exports = sanitize;




/*

const xss = require('xss');

// Настройки: удаляем ВСЕ HTML теги
const xssOptions = {
  whiteList: {},
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style']
};

// Очистка строки
const cleanString = (str) => {
  if (typeof str !== 'string') return str;
  return xss(str.trim(), xssOptions);
};

// Очистка объекта (рекурсивно)
const cleanObject = (obj) => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return cleanString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => cleanObject(item));
  }
  
  if (typeof obj === 'object') {
    const cleaned = {};
    for (const key in obj) {
      cleaned[key] = cleanObject(obj[key]);
    }
    return cleaned;
  }
  
  return obj;
};

// Middleware
const sanitize = (req, res, next) => {
  if (req.body) req.body = cleanObject(req.body);
  if (req.query) req.query = cleanObject(req.query);
  if (req.params) req.params = cleanObject(req.params);
  next();
};

module.exports = sanitize;*/