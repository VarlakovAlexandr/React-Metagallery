const { override, adjustStyleLoaders, adjustWorkbox } = require('customize-cra');

module.exports = override(
  adjustWorkbox(wb => 
    Object.assign(wb, {
      skipWaiting: true,
      exclude: (wb.exclude || []).concat('index.html')
    })
  )
);