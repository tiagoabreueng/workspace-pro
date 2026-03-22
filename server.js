const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, './')));

// CONEXÃO COM MONGODB (use o mesmo cluster)
const MONGODB_URI = 'mongodb+srv://admin_processos:Esgr-207042@gestaoprocessos.ciymuyb.mongodb.net/workspacepro?retryWrites=true&w=majority&appName=gestaoprocessos';

console.log('🚀 Servidor Workspace Pro iniciando...');

// ROTA DE TESTE
app.get('/ping', (req, res) => { res.json({ status: 'ok', message: 'pong', timestamp: new Date().toISOString() }); });

// ROTA PRINCIPAL
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });

// CONEXÃO COM MONGODB
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on('error', (err) => console.error('❌ Erro ao conectar:', err.message));
db.once('open', () => { console.log('✅ Conectado ao MongoDB!'); setupModelsAndRoutes(); });

function setupModelsAndRoutes() {
    const EquipeSchema = new mongoose.Schema({
        id: { type: String, unique: true },
        username: String, name: String, password: String, color: String,
        role: String, email: String, phone: String, cargo: String,
        type: String, firstAccess: Boolean
    });
    const BoardSchema = new mongoose.Schema({
        id: { type: Number, unique: true },
        name: String, managerId: String,
        groups: [{
            id: String, name: String, color: String,
            tasks: [{ id: String, title: String, ownerId: String, status: String, priority: String, timeline: [String] }]
        }]
    });
    const Equipe = mongoose.model('Equipe', EquipeSchema);
    const Board = mongoose.model('Board', BoardSchema);

    app.get('/api/dados', async (req, res) => {
        try {
            const equipe = await Equipe.find();
            const boards = await Board.find();
            res.json({ team: equipe, boards: boards });
        } catch (error) { res.status(500).json({ error: error.message }); }
    });

    app.post('/api/equipe', async (req, res) => {
        try {
            const { team } = req.body;
            await Equipe.deleteMany({});
            await Equipe.insertMany(team);
            res.json({ success: true });
        } catch (error) { res.status(500).json({ error: error.message }); }
    });

    app.post('/api/boards', async (req, res) => {
        try {
            const { boards } = req.body;
            await Board.deleteMany({});
            await Board.insertMany(boards);
            res.json({ success: true });
        } catch (error) { res.status(500).json({ error: error.message }); }
    });

    app.post('/api/board', async (req, res) => {
        try {
            const board = req.body;
            await Board.findOneAndUpdate({ id: board.id }, board, { upsert: true, new: true });
            res.json({ success: true });
        } catch (error) { res.status(500).json({ error: error.message }); }
    });

    app.delete('/api/board/:id', async (req, res) => {
        try {
            await Board.deleteOne({ id: parseInt(req.params.id) });
            res.json({ success: true });
        } catch (error) { res.status(500).json({ error: error.message }); }
    });

    console.log('✅ Rotas configuradas!');
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => { console.log(`✅ Servidor rodando na porta ${PORT}`); });
