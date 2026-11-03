module.exports = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/webapp',
        destination: '/webapp/index.html',
      },
    ];
  },
}
