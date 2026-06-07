const { createProxyMiddleware } = require("http-proxy-middleware");

const target =
  process.env.REACT_APP_DEV_API_TARGET || "https://localhost:7019";

module.exports = function (app) {
  const opts = {
    target,
    changeOrigin: true,
    secure: false,
  };
  app.use("/api", createProxyMiddleware(opts));
  app.use("/Uploads", createProxyMiddleware(opts));
  app.use("/uploads", createProxyMiddleware(opts));
};
