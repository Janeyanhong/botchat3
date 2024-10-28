/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true
  },
  // 移除条件判断，始终使用 basePath
  basePath: '/botfreechat',
  // 禁用 WebSocket 连接
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        ws: false,
      };
    }
    return config;
  },
  // 添加资源处理配置
  assetPrefix: '/botfreechat',
  // 确保静态资源正确加载
  publicRuntimeConfig: {
    basePath: '/botfreechat',
  }
}

module.exports = nextConfig
