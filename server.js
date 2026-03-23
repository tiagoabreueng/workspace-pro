const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, './')));

// STRING DE CONEXÃO CORRETA
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
console.log('🔄 Conectando ao MongoDB...');

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
  
  setupModelsAndRoutes();
});

function setupModelsAndRoutes() {
  // ESQUEMAS
  const UsuarioSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    username: String,
    name: String,
    password: String,
    color: String,
    role: String,
    email: String,
    phone: String,
    cargo: String,
    type: String,
    firstAccess: { type: Boolean, default: true }
  });

  const ProjetoSchema = new mongoose.Schema({
    id: { type: Number, unique: true },
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

  // ==================== ROTAS DA API ====================

  // GET - Carregar todos os dados
  app.get('/api/dados', async (req, res) => {
    console.log('📥 GET /api/dados');
    
    try {
      const usuarios = await Usuario.find();
      const projetos = await Projeto.find();
      console.log(`✅ ${usuarios.length} usuários, ${projetos.length} projetos`);
      res.json({ team: usuarios, boards: projetos });
    } catch (error) {
      console.error('❌ Erro ao buscar dados:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // POST - Salvar todos os usuários
  app.post('/api/equipe', async (req, res) => {
    console.log('📥 POST /api/equipe');
    
    try {
      const { team } = req.body;
      await Usuario.deleteMany({});
      await Usuario.insertMany(team);
      console.log(`✅ ${team.length} usuários salvos`);
      res.json({ success: true });
    } catch (error) {
      console.error('❌ Erro ao salvar equipe:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // POST - Salvar um usuário individual (para alteração de senha)
  app.post('/api/usuario', async (req, res) => {
    console.log('📥 POST /api/usuario');
    
    try {
      const usuario = req.body;
      await Usuario.findOneAndUpdate(
        { id: usuario.id },
        usuario,
        { upsert: true, new: true }
      );
      console.log(`✅ Usuário ${usuario.name} atualizado (firstAccess: ${usuario.firstAccess})`);
      res.json({ success: true });
    } catch (error) {
      console.error('❌ Erro ao atualizar usuário:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // POST - Salvar todos os projetos
  app.post('/api/boards', async (req, res) => {
    console.log('📥 POST /api/boards');
    
    try {
      const { boards } = req.body;
      await Projeto.deleteMany({});
      await Projeto.insertMany(boards);
      console.log(`✅ ${boards.length} projetos salvos`);
      res.json({ success: true });
    } catch (error) {
      console.error('❌ Erro ao salvar projetos:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // POST - Salvar/atualizar um projeto individual
  app.post('/api/board', async (req, res) => {
    console.log('📥 POST /api/board');
    
    try {
      const board = req.body;
      await Projeto.findOneAndUpdate(
        { id: board.id },
        board,
        { upsert: true, new: true }
      );
      console.log(`✅ Projeto "${board.name}" salvo (${board.groups?.length || 0} grupos)`);
      res.json({ success: true });
    } catch (error) {
      console.error('❌ Erro ao salvar projeto:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE - Remover um projeto
  app.delete('/api/board/:id', async (req, res) => {
    console.log('📥 DELETE /api/board');
    
    try {
      await Projeto.deleteOne({ id: parseInt(req.params.id) });
      console.log(`✅ Projeto ${req.params.id} removido`);
      res.json({ success: true });
    } catch (error) {
      console.error('❌ Erro ao deletar projeto:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // GET - Buscar um projeto específico
  app.get('/api/board/:id', async (req, res) => {
    try {
      const projeto = await Projeto.findOne({ id: parseInt(req.params.id) });
      res.json(projeto || {});
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ROTA PARA LIMPAR GRUPOS VAZIOS (utilitário)
  app.post('/api/limpar-grupos-vazios', async (req, res) => {
    console.log('📥 POST /api/limpar-grupos-vazios');
    
    try {
      const projetos = await Projeto.find();
      let modificados = 0;
      
      for (const projeto of projetos) {
        let alterado = false;
        
        if (projeto.groups && projeto.groups.length > 0) {
          const gruposOriginais = projeto.groups.length;
          projeto.groups = projeto.groups.filter(group => {
            return group.tasks && group.tasks.length > 0;
          });
          
          if (gruposOriginais !== projeto.groups.length) {
            alterado = true;
            modificados++;
            console.log(`   Projeto "${projeto.name}": removidos ${gruposOriginais - projeto.groups.length} grupos vazios`);
          }
        }
        
        if (alterado) {
          await Projeto.findOneAndUpdate(
            { id: projeto.id },
            projeto,
            { upsert: true, new: true }
          );
        }
      }
      
      console.log(`✅ Limpeza concluída: ${modificados} projetos modificados`);
      res.json({ success: true, modificados });
    } catch (error) {
      console.error('❌ Erro ao limpar grupos vazios:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  console.log('✅ Rotas configuradas com sucesso!');
  console.log('   - GET  /api/dados');
  console.log('   - POST /api/equipe');
  console.log('   - POST /api/usuario');
  console.log('   - POST /api/boards');
  console.log('   - POST /api/board');
  console.log('   - DELETE /api/board/:id');
  console.log('   - POST /api/limpar-grupos-vazios');
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`🌐 Acesse: http://localhost:${PORT}`);
});
