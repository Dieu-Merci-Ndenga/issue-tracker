const express = require('express');
const path = require('path');
const apiRouter = require('./routes/api');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', apiRouter);
app.get('/:project/', (request, response) => {
  response.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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