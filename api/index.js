const jsonServer = require('json-server');
const path = require('path');

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, '..', 'public', 'db.json'));
const middlewares = jsonServer.defaults();

// Re-escreve as rotas para remover o prefixo /api
server.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
        req.url = req.url.substring(4); // Remove /api
    }
    next();
});

server.use(middlewares);
server.use(router);

module.exports = server;