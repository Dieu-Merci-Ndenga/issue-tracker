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
  const projectItems = projectIssues(request.params.project);

  const result = projectItems.filter((issue) => {
    return Object.entries(filters).every(([field, value]) => {
      if (!(field in issue)) return false;

      // 1. Guard against array query parameters (e.g., ?status_text=open&status_text=closed)
      if (Array.isArray(value)) {
        return value.includes(String(issue[field]));
      }

      // 2. Strict boolean coercion for the 'open' field
      if (field === 'open') {
        const boolVal = value === 'true' || value === true;
        return issue[field] === boolVal;
      }

      return String(issue[field]) === String(value);
    });
  });

  return response.json(result);
});

router.put('/issues/:project', (request, response) => {
  const { _id, ...updates } = request.body;
  if (!_id) return response.json({ error: 'missing _id' });

  // Filter out undefined/null payload values
  const updateFields = Object.keys(updates).filter(
    (field) => updates[field] !== undefined && updates[field] !== null && field !== '_id'
  );

  if (updateFields.length === 0) {
    return response.json({ error: 'no update field(s) sent', _id });
  }

  const issue = findIssue(request.params.project, _id);
  if (!issue) return response.json({ error: 'could not update', _id });

  // 3. Explicit whitelist of mutable fields to prevent prototype pollution or invalid overwrites
  const allowedFields = ['issue_title', 'issue_text', 'created_by', 'assigned_to', 'status_text', 'open'];
  let updatedCount = 0;

  updateFields.forEach((field) => {
    if (allowedFields.includes(field)) {
      if (field === 'open') {
        issue[field] = updates[field] === 'true' || updates[field] === true;
      } else {
        issue[field] = updates[field];
      }
      updatedCount++;
    }
  });

  if (updatedCount === 0) {
    return response.json({ error: 'no update field(s) sent', _id });
  }

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