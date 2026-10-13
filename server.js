const express = require('express');
const path = require('path');
const cors = require('cors');
const Mocha = require('mocha');
const apiRouter = require('./routes/api');

const app = express();

// 1. Activer le CORS globalement
app.use(cors({ optionsSuccessStatus: 200 }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Exécution différée des tests pour éviter de lancer Mocha pendant le chargement de server.js
let testResults;
let testRun;

function runMochaTests() {
  if (testRun) return testRun;

  testRun = new Promise((resolve) => {
    const mocha = new Mocha({ ui: 'bdd', timeout: 5000 });
    mocha.addFile(path.join(__dirname, 'tests', '2_functional-tests.js'));
    const results = [];
    const mochaRunner = mocha.run();

    mochaRunner.on('test end', (test) => {
      results.push({
        title: test.title,
        fullTitle: test.fullTitle(),
        context: test.parent.title,
        state: test.state,
        assertions: []
      });
    });

    mochaRunner.on('end', () => {
      testResults = results;
      resolve(results);
    });
  });

  return testRun;
}

app.get('/_api/get-tests', async (request, response) => {
  response.json(testResults || await runMochaTests());
});

// 4. Fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// 5. Routes API
app.use('/api', apiRouter);

// 6. Route pour les projets dans l'interface front-end
app.get('/:project/', (request, response) => {
  response.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 7. Gestion des erreurs de syntaxe JSON
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