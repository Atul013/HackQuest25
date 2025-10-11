import http from 'http';
import fs from 'fs';
import path from 'path';
import url from 'url';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = 8080;

const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;
    
    // Default to success.html for testing
    if (pathname === '/') {
        pathname = '/success.html';
    }
    
    const filePath = path.join(__dirname, pathname);
    const ext = path.extname(filePath);
    const mimeType = mimeTypes[ext] || 'text/plain';
    
    console.log(`📝 Request: ${pathname}`);
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.log(`❌ File not found: ${filePath}`);
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 - File Not Found</h1>');
            return;
        }
        
        console.log(`✅ Serving: ${filePath}`);
        res.writeHead(200, { 'Content-Type': mimeType });
        res.end(data);
    });
});

server.listen(port, () => {
    console.log(`🚀 Local test server running at http://localhost:${port}`);
    console.log(`📱 Test URLs:`);
    console.log(`   Main: http://localhost:${port}/success.html`);
    console.log(`   Test: http://localhost:${port}/test-live.html`);
    console.log(`   Debug: http://localhost:${port}/debug-supabase.html`);
    console.log(`\n⚡ Press Ctrl+C to stop\n`);
});