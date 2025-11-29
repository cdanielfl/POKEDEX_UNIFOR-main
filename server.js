// Servidor Pokédex - Implementação com Código Limpo

const express = require('express');
const path = require('path');

// Constantes
const PORT = process.env.PORT || 3001;
const PUBLIC_DIR = path.join(__dirname, 'public');

// Configuração da aplicação Express
const app = express();

// Middleware
app.use(express.static(PUBLIC_DIR));

// Rotas
app.get('/', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Rota catch-all para SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error('Erro do servidor:', err.stack);
    res.status(500).send('Algo deu errado no servidor!');
});

// Iniciar servidor com detecção automática de porta
const startServer = (port = PORT) => {
    const server = app.listen(port, () => {
        console.log(`🚀 Servidor Pokédex rodando em http://localhost:${port}`);
        console.log(`📁 Servindo arquivos de: ${PUBLIC_DIR}`);
        console.log('🎮 Pronto para explorar o mundo Pokémon!');
    });
    
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`⚠️  Porta ${port} ocupada, tentando ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('Erro do servidor:', err);
        }
    });
};

// Gerenciar desligamento gracioso
process.on('SIGTERM', () => {
    console.log('🛑 Servidor desligando graciosamente...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n🛑 Servidor desligando graciosamente...');
    process.exit(0);
});

// Iniciar a aplicação
startServer();

module.exports = app;