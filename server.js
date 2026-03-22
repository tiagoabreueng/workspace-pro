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

// CONEXÃO SIMPLES
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Conectado ao MongoDB!');
    console.log('📊 Banco:', mongoose.connection.db.databaseName);
  })
  .catch(err => {
    console.error('❌ Erro:', err.message);
  });

// ROTA DE TESTE
app.get('/ping', (req, res) => {
  res.json({ status: 'ok', message: 'pong' });
});

// ROTA PRINCIPAL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ROTA PARA DADOS
app.get('/api/dados', async (req, res) => {
  console.log('📥 GET /api/dados');
  
  try {
    const db = mongoose.connection.db;
    const usuarios = await db.collection('usuarios').find({}).toArray();
    const projetos = await db.collection('projetos').find({}).toArray();
    
    console.log(`✅ ${usuarios.length} usuários, ${projetos.length} projetos`);
    res.json({ usuarios, projetos });
  } catch (error) {
    console.error('❌ Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ROTA PARA SALVAR USUÁRIOS
app.post('/api/usuarios', async (req, res) => {
  console.log('📥 POST /api/usuarios');
  
  try {
    const { usuarios } = req.body;
    const db = mongoose.connection.db;
    await db.collection('usuarios').deleteMany({});
    await db.collection('usuarios').insertMany(usuarios);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ROTA PARA SALVAR PROJETOS
app.post('/api/projetos', async (req, res) => {
  console.log('📥 POST /api/projetos');
  
  try {
    const { projetos } = req.body;
    const db = mongoose.connection.db;
    await db.collection('projetos').deleteMany({});
    await db.collection('projetos').insertMany(projetos);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ROTA PARA SALVAR PROJETO INDIVIDUAL
app.post('/api/projeto', async (req, res) => {
  console.log('📥 POST /api/projeto');
  
  try {
    const projeto = req.body;
    const db = mongoose.connection.db;
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
  console.log('📥 DELETE /api/projeto');
  
  try {
    const db = mongoose.connection.db;
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
