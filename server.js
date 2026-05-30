const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const root = path.resolve(__dirname);
const accountsFile = path.join(root, 'accounts.json');

function ensureAccountsFile() {
  if (!fs.existsSync(accountsFile)) {
    fs.writeFileSync(accountsFile, '[]', 'utf8');
  }
}

function loadAccounts() {
  ensureAccountsFile();
  try {
    const data = fs.readFileSync(accountsFile, 'utf8');
    return JSON.parse(data) || [];
  } catch (error) {
    console.error('Failed to load accounts.json:', error);
    return [];
  }
}

function saveAccounts(accounts) {
  fs.writeFileSync(accountsFile, JSON.stringify(accounts, null, 2), 'utf8');
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(data));
}

function serveStaticFile(req, res) {
  let pathname = url.parse(req.url).pathname || '/';
  if (pathname === '/') {
    pathname = '/LOGEN .HTML';
  }
  const safePath = path.normalize(path.join(root, pathname));
  if (!safePath.startsWith(root)) {
    res.writeHead(403, {'Content-Type': 'text/plain'});
    res.end('Forbidden');
    return;
  }

  const ext = path.extname(safePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(safePath, (err, data) => {
    if (err) {
      res.writeHead(404, {'Content-Type': 'text/plain'});
      res.end('Not found');
      return;
    }
    res.writeHead(200, {'Content-Type': contentType});
    res.end(data);
  });
}

function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);

  if (parsedUrl.pathname === '/api/signup' && req.method === 'POST') {
    try {
      const { username, password } = await parseRequestBody(req);
      if (!username || !password) {
        sendJson(res, 400, { message: 'Username and password are required.' });
        return;
      }
      const accounts = loadAccounts();
      const existing = accounts.find(acc => acc.username.toLowerCase() === username.toLowerCase());
      if (existing) {
        sendJson(res, 400, { message: 'Username already exists. Choose another one.' });
        return;
      }
      accounts.push({ username, password });
      saveAccounts(accounts);
      sendJson(res, 200, { message: 'Account created.' });
    } catch (error) {
      sendJson(res, 500, { message: 'Unable to create account.' });
    }
    return;
  }

  if (parsedUrl.pathname === '/api/login' && req.method === 'POST') {
    try {
      const { username, password } = await parseRequestBody(req);
      if (!username || !password) {
        sendJson(res, 400, { message: 'Username and password are required.' });
        return;
      }
      const accounts = loadAccounts();
      const account = accounts.find(acc => acc.username.toLowerCase() === username.toLowerCase());
      if (!account || account.password !== password) {
        sendJson(res, 400, { message: 'Invalid username or password.' });
        return;
      }
      sendJson(res, 200, { message: 'Login successful.' });
    } catch (error) {
      sendJson(res, 500, { message: 'Unable to authenticate.' });
    }
    return;
  }

  serveStaticFile(req, res);
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
