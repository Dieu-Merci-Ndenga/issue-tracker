# Issue Tracker API

A small issue tracker API built with Node.js, Express and MongoDB Atlas.

## Features

- Create issues for a project
- List issues by project
- Filter issues by any field
- Update issue data
- Delete issues

## Local setup

1. Install dependencies
   ```bash
   npm install
   ```
2. Add your MongoDB connection string in `.env`
   ```env
   PORT=3000
   NODE_ENV=test
   DB=mongodb+srv://<user>:<password>@<cluster>/<database>?retryWrites=true&w=majority
   ```
3. Start the app
   ```bash
   npm start
   ```

## Run the tests

```bash
npm test
```

## API shape

`POST /api/issues/:project`

`GET /api/issues/:project`

`PUT /api/issues/:project`

`DELETE /api/issues/:project`

The project stores the issue data in MongoDB and returns the fields required by the issue tracker contract.

