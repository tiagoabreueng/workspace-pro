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

console.log('🚀 Servidor Workspace Pro iniciando...');

// ROTA DE TESTE
app.get('/ping', (req, res) => {
  res.json({ status: 'ok', message: 'pong', timestamp: new Date().toISOString() });
});

// ROTA PRINCIPAL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// CONEXÃO COM MONGODB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error', (err) => {
  console.error('❌ Erro ao conectar:', err.message);
});

db.once('open', async () => {
  console.log('✅ Conectado ao MongoDB!');
  console.log('📊 Banco de dados:', db.db.databaseName);
  
  // Listar coleções para debug
  const collections = await db.db.listCollections().toArray();
  console.log('📁 Coleções disponíveis:', collections.map(c => c.name));
  
  setupRoutes();
});

function setupRoutes() {
  // Esquema para USUARIOS (coleção: usuarios)
  const UsuarioSchema = new mongoose.Schema({
    id: String,
    username: String,
    name: String,
    password: String,
    color: String,
    role: String,
    email: String,
    phone: String,
    cargo: String,
    type: String,
    firstAccess: Boolean
  });

  // Esquema para PROJETOS (coleção: projetos)
  const ProjetoSchema = new mongoose.Schema({
    id: Number,
    name: String,
    managerId: String,
    groups: [{
      id: String,
      name: String,
      color: String,
      tasks: [{
        id: String,
        title: String,
        ownerId: String,
        status: String,
        priority: String,
        timeline: [String]
      }]
    }]
  });

  // Modelos com os nomes exatos das coleções
  const Usuario = mongoose.model('Usuario', UsuarioSchema, 'usuarios');
  const Projeto = mongoose.model('Projeto', ProjetoSchema, 'projetos');

  // ==================== ROTAS ====================

  // GET - Carregar todos os dados
  app.get('/api/dados', async (req, res) => {
    console.log('📥 GET /api/dados');
    
    try {
      const usuarios = await Usuario.find();
      const projetos = await Projeto.find();
      console.log(`✅ ${usuarios.length} usuários, ${projetos.length} projetos`);
      res.json({ usuarios: usuarios, projetos: projetos });
    } catch (error) {
      console.error('❌ Erro:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // POST - Salvar todos os usuários
  app.post('/api/usuarios', async (req, res) => {
    console.log('📥 POST /api/usuarios');
    
    try {
      const { usuarios } = req.body;
      await Usuario.deleteMany({});
      await Usuario.insertMany(usuarios);
      console.log(`✅ ${usuarios.length} usuários salvos`);
      res.json({ success: true });
    } catch (error) {
      console.error('❌ Erro:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // POST - Salvar todos os projetos
  app.post('/api/projetos', async (req, res) => {
    console.log('📥 POST /api/projetos');
    
    try {
      const { projetos } = req.body;
      await Projeto.deleteMany({});
      await Projeto.insertMany(projetos);
      console.log(`✅ ${projetos.length} projetos salvos`);
      res.json({ success: true });
    } catch (error) {
      console.error('❌ Erro:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // POST - Salvar/atualizar um projeto individual
  app.post('/api/projeto', async (req, res) => {
    console.log('📥 POST /api/projeto');
    
    try {
      const projeto = req.body;
      await Projeto.findOneAndUpdate(
        { id: projeto.id },
        projeto,
        { upsert: true, new: true }
      );
      console.log(`✅ Projeto "${projeto.name}" salvo`);
      res.json({ success: true });
    } catch (error) {
      console.error('❌ Erro:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE - Remover um projeto
  app.delete('/api/projeto/:id', async (req, res) => {
    console.log('📥 DELETE /api/projeto');
    
    try {
      await Projeto.deleteOne({ id: parseInt(req.params.id) });
      console.log(`✅ Projeto ${req.params.id} removido`);
      res.json({ success: true });
    } catch (error) {
      console.error('❌ Erro:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // GET - Buscar um projeto específico
  app.get('/api/projeto/:id', async (req, res) => {
    try {
      const projeto = await Projeto.findOne({ id: parseInt(req.params.id) });
      res.json(projeto || {});
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  console.log('✅ Rotas configuradas!');
  console.log('   - GET  /api/dados');
  console.log('   - POST /api/usuarios');
  console.log('   - POST /api/projetos');
  console.log('   - POST /api/projeto');
  console.log('   - DELETE /api/projeto/:id');
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`🌐 Acesse: https://workspace-pro-production.up.railway.app`);
});
