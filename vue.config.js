const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: process.env.NODE_ENV === 'production'
    ? '/dist/'
    : '/',
    configureWebpack: {
      devtool: 'source-map'
    }
  // devtool : 'source-map'
})
