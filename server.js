const express = require('express');
const path = require('path');
const cors = require('cors'); // INDISPENSABLE pour éviter les blocages cross-origin
const apiRouter = require('./routes/api');

const app = express();

// 1. Activer le CORS globalement
app.use(cors({ optionsSuccessStatus: 200 }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// 3. Routes API
app.use('/api', apiRouter);

// 4. Route pour les projets dans l'interface front-end
app.get('/:project/', (request, response) => {
  response.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 5. Gestion des erreurs de syntaxe JSON
app.use((error, request, response, next) => {
  if (error instanceof SyntaxError && error.status === 400 && error.body) {
    return response.status(400).json({ error: 'invalid request body' });
  }
  return next(error);
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Issue Tracker listening on port ${port}`));
}

module.exports = app;