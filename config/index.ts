import path from 'path'

const config = {
  projectName: 'myApp',
  date: '2025-10-17',
  designWidth: 750,
  deviceRatio: {
    '640': 2.34,
    '750': 1,
    '828': 1.81
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  framework: 'vue3',
  compiler: 'webpack5',
  plugins: [],
  alias: {
    '@': path.resolve(__dirname, '..', 'src')
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

export default function (merge) {
  if (process.env.NODE_ENV === 'development') {
    return merge({}, config, { env: { NODE_ENV: 'development' } })
  }
  return merge({}, config, { env: { NODE_ENV: 'production' } })
}
