const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, './')));

// STRING DE CONEXÃO
const MONGODB_URI = 'mongodb+srv://tiagoabreuenge_db_user:S1gpoc%40207042@tiagocluster.wi6sszn.mongodb.net/projetos?retryWrites=true&w=majority&appName=TiagoCluster';

console.log('🚀 Servidor iniciando...');

// Variável para controlar se o banco está conectado
let isDbConnected = false;
let db = null;

// CONEXÃO COM MONGODB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Conectado ao MongoDB!');
    isDbConnected = true;
    db = mongoose.connection.db;
    console.log('📊 Banco:', db.databaseName);
  })
  .catch(err => {
    console.error('❌ Erro ao conectar:', err.message);
    isDbConnected = false;
  });

// ROTA DE TESTE
app.get('/ping', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'pong',
    db_connected: isDbConnected
  });
});

// ROTA PRINCIPAL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ROTA PARA DADOS
app.get('/api/dados', async (req, res) => {
  console.log('📥 GET /api/dados');
  
  // Verificar se o banco está conectado
  if (!isDbConnected || !db) {
    console.log('⚠️ Banco não conectado ainda');
    return res.status(503).json({ 
      error: 'Banco de dados não conectado. Aguarde alguns segundos e tente novamente.',
      connected: false
    });
  }
  
  try {
    const usuarios = await db.collection('usuarios').find({}).toArray();
    const projetos = await db.collection('projetos').find({}).toArray();
    
    console.log(`✅ ${usuarios.length} usuários, ${projetos.length} projetos`);
    res.json({ usuarios, projetos });
  } catch (error) {
    console.error('❌ Erro ao buscar dados:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ROTA PARA SALVAR USUÁRIOS
app.post('/api/usuarios', async (req, res) => {
  if (!isDbConnected || !db) {
    return res.status(503).json({ error: 'Banco não conectado' });
  }
  
  try {
    const { usuarios } = req.body;
    await db.collection('usuarios').deleteMany({});
    await db.collection('usuarios').insertMany(usuarios);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ROTA PARA SALVAR PROJETOS
app.post('/api/projetos', async (req, res) => {
  if (!isDbConnected || !db) {
    return res.status(503).json({ error: 'Banco não conectado' });
  }
  
  try {
    const { projetos } = req.body;
    await db.collection('projetos').deleteMany({});
    await db.collection('projetos').insertMany(projetos);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ROTA PARA SALVAR PROJETO INDIVIDUAL
app.post('/api/projeto', async (req, res) => {
  if (!isDbConnected || !db) {
    return res.status(503).json({ error: 'Banco não conectado' });
  }
  
  try {
    const projeto = req.body;
    await db.collection('projetos').updateOne(
      { id: projeto.id },
      { $set: projeto },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ROTA PARA REMOVER PROJETO
app.delete('/api/projeto/:id', async (req, res) => {
  if (!isDbConnected || !db) {
    return res.status(503).json({ error: 'Banco não conectado' });
  }
  
  try {
    await db.collection('projetos').deleteOne({ id: parseInt(req.params.id) });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});
