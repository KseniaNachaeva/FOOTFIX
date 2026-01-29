const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  
  // Ваши настройки путей (оставлены без изменений)
  outputDir: '/var/www/html/vue-app/',
  publicPath: '/vue-app/',

  // !!! ДОБАВЛЕННАЯ СЕКЦИЯ ДЛЯ РЕШЕНИЯ CORS !!!
  devServer: {
    proxy: {
      // Это перехватит запросы, начинающиеся с /api
      '/api': {
        target: 'http://localhost:3000', // Адрес вашего бэкенда
        changeOrigin: true,
        secure: false,
        // Если на бэкенде нет префикса /api, раскомментируйте строчку ниже:
        // pathRewrite: { '^/api': '' }
      }
    }
  },
  // !!! КОНЕЦ ДОБАВЛЕННОЙ СЕКЦИИ !!!

  chainWebpack: config => {
    config
      .plugin('html')
      .tap(args => {
        args[0].title = 'SiteDB - Современное веб-приложение';
        return args;
      })
  }
})