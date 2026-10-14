const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

// Définition du schéma Mongoose conforme aux exigences de freeCodeCamp
const issueSchema = new mongoose.Schema({
  project: { type: String, required: true },
  issue_title: { type: String, required: true },
  issue_text: { type: String, required: true },
  created_by: { type: String, required: true },
  assigned_to: { type: String, default: '' },
  status_text: { type: String, default: '' },
  open: { type: Boolean, default: true },
  created_on: { type: Date, default: Date.now },
  updated_on: { type: Date, default: Date.now }
});

const Issue = mongoose.models.Issue || mongoose.model('Issue', issueSchema);

router.post('/issues/:project', async (request, response) => {
  const { issue_title, issue_text, created_by, assigned_to, status_text } = request.body;
  if (!issue_title || !issue_text || !created_by) {
    return response.json({ error: 'required field(s) missing' });
  }

  try {
    const newIssue = new Issue({
      project: request.params.project,
      issue_title,
      issue_text,
      created_by,
      assigned_to: assigned_to || '',
      status_text: status_text || ''
    });

    const savedIssue = await newIssue.save();
    return response.status(201).json(savedIssue);
  } catch (err) {
    return response.json({ error: 'required field(s) missing' });
  }
});

router.get('/issues/:project', async (request, response) => {
  try {
    const filters = { project: request.params.project, ...request.query };

    // Gestion propre des tableaux de paramètres et des booléens
    if (filters.open !== undefined) {
      if (Array.isArray(filters.open)) {
        filters.open = filters.open.map((v) => v === 'true' || v === true);
      } else {
        filters.open = filters.open === 'true' || filters.open === true;
      }
    }

    // Sécurité contre les CastError sur un _id invalide passé en query string
    if (filters._id && !mongoose.Types.ObjectId.isValid(filters._id)) {
      return response.json([]);
    }

    const issues = await Issue.find(filters);
    return response.json(issues);
  } catch (err) {
    return response.json([]);
  }
});

router.put('/issues/:project', async (request, response) => {
  const { _id, ...updates } = request.body;
  if (!_id) return response.json({ error: 'missing _id' });

  // Vérification de la validité de l'ObjectId avant d'interroger MongoDB
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return response.json({ error: 'could not update', _id });
  }

  const updateFields = Object.keys(updates).filter(
    (field) => updates[field] !== undefined && updates[field] !== null && field !== '_id'
  );

  if (updateFields.length === 0) {
    return response.json({ error: 'no update field(s) sent', _id });
  }

  const allowedFields = ['issue_title', 'issue_text', 'created_by', 'assigned_to', 'status_text', 'open'];
  const updateData = {};
  let validCount = 0;

  updateFields.forEach((field) => {
    if (allowedFields.includes(field)) {
      if (field === 'open') {
        updateData[field] = updates[field] === 'true' || updates[field] === true;
      } else {
        updateData[field] = updates[field];
      }
      validCount++;
    }
  });

  if (validCount === 0) {
    return response.json({ error: 'no update field(s) sent', _id });
  }

  updateData.updated_on = new Date();

  try {
    const updatedIssue = await Issue.findOneAndUpdate(
      { _id, project: request.params.project },
      { $set: updateData },
      { new: true }
    );

    if (!updatedIssue) {
      return response.json({ error: 'could not update', _id });
    }

    return response.json({ result: 'successfully updated', _id });
  } catch (err) {
    return response.json({ error: 'could not update', _id });
  }
});

router.delete('/issues/:project', async (request, response) => {
  const { _id } = request.body;
  if (!_id) return response.json({ error: 'missing _id' });

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return response.json({ error: 'could not delete', _id });
  }

  try {
    const deletedIssue = await Issue.findOneAndDelete({ _id, project: request.params.project });
    if (!deletedIssue) {
      return response.json({ error: 'could not delete', _id });
    }
    return response.json({ result: 'successfully deleted', _id });
  } catch (err) {
    return response.json({ error: 'could not delete', _id });
  }
});

router.delete('/issues/:project/all', async (request, response) => {
  try {
    await Issue.deleteMany({ project: request.params.project });
    return response.json({ result: 'successfully cleared' });
  } catch (err) {
    return response.json({ error: 'could not clear' });
  }
});

module.exports = router;
// api.clear() devient asynchrone pour garantir le nettoyage avant chaque test
module.exports.clear = async () => {
  await Issue.deleteMany({});
};