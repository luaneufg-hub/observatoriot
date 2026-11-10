/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // deck.gl e maplibre são ESM puros
  transpilePackages: ['@deck.gl/core', '@deck.gl/layers', '@deck.gl/mapbox', '@deck.gl/extensions'],
  async headers() {
    // geometrias: cache longo (os arquivos só mudam quando regerados)
    return [{ source: '/geo/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }] }];
  },
};
export default nextConfig;
