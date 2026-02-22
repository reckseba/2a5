/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,
    compress: false, // will be enabled through nginx
    output: "standalone"
};

module.exports = nextConfig;
