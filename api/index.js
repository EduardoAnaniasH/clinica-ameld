const jsonServer = require('json-server');
const path = require('path');

const server = jsonServer.create();
// O caminho para o db.json precisa ser absoluto no ambiente da Vercel
const router = jsonServer.router(path.resolve(process.cwd(), 'public', 'db.json'));
const middlewares = jsonServer.defaults();

server.use(middlewares);

// Reescreve as rotas para remover o prefixo /api
server.use(jsonServer.rewriter({
    '/api/*': '/$1',
}));

server.use(router);

module.exports = server;
