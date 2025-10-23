// @ts-ignore


const config = {
  projectName: 'myApp',
  date: '2025-10-17',
  designWidth: 750,
  deviceRatio: {
    '640': 2.34,
    '750': 1,
    '828': 1.81
  },
  // API地址根据环境自动切换
  apiBaseUrl: process.env.NODE_ENV === 'development'
    ? 'http://127.0.0.1:5000/api'  // 开发环境：本地后端
    : 'https://test.3fenban.com/api', // 生产环境：线上后端
  sourceRoot: 'src',
  outputRoot: 'dist',
  framework: 'vue3',
  compiler: 'webpack5',
  plugins: [],
  alias: {
    '@': 'src'
  },
  cache: {
    enable: true
  },
  copy: {
    patterns: [],
    options: {}
  },
  defineConstants: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  mini: {
    postcss: {
      pxtransform: {
        enable: true,
        config: {}
      },
      url: {
        enable: true,
        config: {
          limit: 1024 // 1KB
        }
      },
      cssModules: {
        enable: false,
        config: {}
      }
    }
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    postcss: {
      autoprefixer: {
        enable: true,
        config: {}
      },
      cssModules: {
        enable: false,
        config: {}
      }
    }
  }
}

export default function () {
  if (process.env.NODE_ENV === 'development') {
    return Object.assign({}, config, { env: { NODE_ENV: 'development' } })
  }
  return Object.assign({}, config, { env: { NODE_ENV: 'production' } })
}
