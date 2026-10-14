require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const Mocha = require('mocha');
const apiRouter = require('./routes/api');
const mongoose = require('mongoose');

const app = express();

// Connexion à MongoDB si la variable d'environnement DB est définie
if (process.env.DB) {
  mongoose.connect(process.env.DB)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));
}

// 1. Enable CORS globally
app.use(cors({ optionsSuccessStatus: 200 }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Deferred Mocha execution with guaranteed callback resolution
let testResults;
let testRun;

function runMochaTests() {
  if (testRun) return testRun;

  testRun = new Promise((resolve) => {
    // const mocha = new Mocha({ ui: 'bdd', timeout: 5000 });
    // Updating the Mocha configuration:
    const mocha = new Mocha({ ui: 'bdd', timeout: 10000 });
    
    try {
      mocha.addFile(path.join(__dirname, 'tests', '2_functional-tests.js'));
    } catch (err) {
      console.error('Failed to add test file:', err);
      testResults = [];
      return resolve([]);
    }

    const results = [];

    try {
      // Pass a completion callback to mocha.run() so it NEVER hangs
      const mochaRunner = mocha.run(() => {
        testResults = results;
        resolve(results);
      });

      mochaRunner.on('test end', (test) => {
        results.push({
          title: test.title,
          fullTitle: test.fullTitle(),
          context: test.parent ? test.parent.title : '',
          state: test.state,
          assertions: []
        });
      });

      mochaRunner.on('error', (err) => {
        console.error('Mocha runner error:', err);
        testResults = results;
        resolve(results);
      });
    } catch (err) {
      console.error('Failed to run mocha:', err);
      testResults = [];
      resolve([]);
    }
  });

  return testRun;
}

app.get('/_api/get-tests', async (request, response) => {
  response.json(testResults || await runMochaTests());
});

// 4. Static files
app.use(express.static(path.join(__dirname, 'public')));

// 5. API routes
app.use('/api', apiRouter);

// 6. Project route for front-end
app.get('/:project/', (request, response) => {
  response.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 7. JSON syntax error handler
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