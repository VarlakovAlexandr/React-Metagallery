module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Находим HtmlWebpackPlugin
      const htmlWebpackPlugin = webpackConfig.plugins.find(
        plugin => plugin.constructor.name === 'HtmlWebpackPlugin'
      );
      
      // Отключаем минификацию HTML
      if (htmlWebpackPlugin) {
        htmlWebpackPlugin.options.minify = false;
      }
      
      // Переименовываем файлы только для production сборки
      if (env === 'production') {
        // Меняем имена JS файлов
        webpackConfig.output.filename = 'static/js/main-app.js';
        webpackConfig.output.chunkFilename = 'static/js/[name].chunk.js';
        
        // Меняем имена CSS файлов
        const miniCssExtractPlugin = webpackConfig.plugins.find(
          plugin => plugin.constructor.name === 'MiniCssExtractPlugin'
        );
        if (miniCssExtractPlugin) {
          miniCssExtractPlugin.options.filename = 'static/css/main-app.css';
          miniCssExtractPlugin.options.chunkFilename = 'static/css/[name].chunk.css';
        }
        
        // Обновляем манифест для корректных путей
        const manifestPlugin = webpackConfig.plugins.find(
          plugin => plugin.constructor.name === 'ManifestPlugin'
        );
        if (manifestPlugin) {
          // Плагин манифеста автоматически подхватит новые имена файлов
        }
      }
      
      return webpackConfig;
    }
  }
};