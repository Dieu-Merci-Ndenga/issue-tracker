const express = require('express');
const crypto = require('crypto');

const router = express.Router();
const issues = new Map();

function projectIssues(project) {
  if (!issues.has(project)) issues.set(project, []);
  return issues.get(project);
}

function issueId() {
  return crypto.randomBytes(12).toString('hex');
}

function findIssue(project, id) {
  return projectIssues(project).find((issue) => issue._id === id);
}

router.post('/issues/:project', (request, response) => {
  const { issue_title, issue_text, created_by } = request.body;
  if (!issue_title || !issue_text || !created_by) {
    return response.json({ error: 'required field(s) missing' });
  }

  const now = new Date().toISOString();
  const issue = {
    issue_title,
    issue_text,
    created_by,
    assigned_to: request.body.assigned_to || '',
    status_text: request.body.status_text || '',
    created_on: now,
    updated_on: now,
    open: true,
    _id: issueId()
  };

  projectIssues(request.params.project).push(issue);
  return response.status(201).json(issue);
});

router.get('/issues/:project', (request, response) => {
  const filters = request.query;
  const result = projectIssues(request.params.project).filter((issue) =>
    Object.entries(filters).every(([field, value]) => String(issue[field]) === value)
  );
  return response.json(result);
});

router.put('/issues/:project', (request, response) => {
  const { _id, ...updates } = request.body;
  if (!_id) return response.json({ error: 'missing _id' });

  const updateFields = Object.keys(updates).filter((field) => field !== '_id');
  if (updateFields.length === 0) {
    return response.json({ error: 'no update field(s) sent', _id });
  }

  const issue = findIssue(request.params.project, _id);
  if (!issue) return response.json({ error: 'could not update', _id });

  updateFields.forEach((field) => {
    if (field in issue && field !== 'created_on' && field !== '_id') issue[field] = updates[field];
  });
  issue.updated_on = new Date().toISOString();
  return response.json({ result: 'successfully updated', _id });
});

router.delete('/issues/:project', (request, response) => {
  const { _id } = request.body;
  if (!_id) return response.json({ error: 'missing _id' });

  const project = projectIssues(request.params.project);
  const index = project.findIndex((issue) => issue._id === _id);
  if (index === -1) return response.json({ error: 'could not delete', _id });

  project.splice(index, 1);
  return response.json({ result: 'successfully deleted', _id });
});

router.delete('/issues/:project/all', (request, response) => {
  issues.delete(request.params.project);
  return response.json({ result: 'successfully cleared' });
});

module.exports = router;
module.exports.clear = () => issues.clear();