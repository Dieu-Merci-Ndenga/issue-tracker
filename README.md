# Issue Tracker

A full-stack JavaScript issue tracker with the freeCodeCamp API contract.

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:3000` for the browser client. The API is available at
`/api/issues/:project` and supports creating, listing, filtering, updating, and
deleting issues.

## Test

The test environment is configured in `.env`, and the complete functional suite
can be run with:

```bash
npm test
```