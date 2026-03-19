const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Servir arquivos estáticos
app.use(express.static('public'));

// Rota de health check
app.get('/api/health', (req, res) => {
  res.send('OK');
});

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});