import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';

export default defineConfig({
  server: {
    port: 5173,
    open: false,
    host: true,
    fs: {
      allow: ['..']
    }
  },
  assetsInclude: ['**/*.glb', '**/*.gltf'],
  plugins: [
    {
      name: 'serve-root-assets',
      configureServer(server) {
        server.middlewares.use('/assets', (req, res, next) => {
          if (req.url && req.url.includes('?import')) {
            return next();
          }
          // Decode URL in case of encoded characters
          const cleanUrl = decodeURIComponent(req.url.split('?')[0]);
          const localPath = path.resolve(__dirname, 'assets', cleanUrl.replace(/^\//, ''));
          if (fs.existsSync(localPath) && fs.statSync(localPath).isFile()) {
            const ext = path.extname(localPath).toLowerCase();
            if (ext === '.glb' || ext === '.gltf') {
              res.setHeader('Content-Type', 'model/gltf-binary');
            } else if (ext === '.png') {
              res.setHeader('Content-Type', 'image/png');
            } else if (ext === '.jpg' || ext === '.jpeg') {
              res.setHeader('Content-Type', 'image/jpeg');
            } else if (ext === '.svg') {
              res.setHeader('Content-Type', 'image/svg+xml');
            } else {
              res.setHeader('Content-Type', 'application/octet-stream');
            }
            res.setHeader('Access-Control-Allow-Origin', '*');
            fs.createReadStream(localPath).pipe(res);
            return;
          }
          next();
        });
      }
    }
  ]
});

