const assert = require('assert');
const request = require('supertest');
const app = require('../server');
const api = require('../routes/api');

describe('Issue Tracker API', function () {
  const project = 'functional-test-project';
  let issue;

  beforeEach(() => api.clear());

  it('Create an issue with every field: POST request to /api/issues/{project}', async function () {
    const response = await request(app).post(`/api/issues/${project}`).send({
      issue_title: 'Complete API', issue_text: 'Implement every route', created_by: 'Ada',
      assigned_to: 'Grace', status_text: 'In progress'
    });
    assert.strictEqual(response.status, 201);
    issue = response.body;
    assert.strictEqual(issue.assigned_to, 'Grace');
    assert.strictEqual(issue.open, true);
    assert.ok(issue._id && issue.created_on && issue.updated_on);
  });

  it('Create an issue with only required fields: POST request to /api/issues/{project}', async function () {
    const response = await request(app).post(`/api/issues/${project}`).send({
      issue_title: 'Required', issue_text: 'Only required values', created_by: 'Ada'
    });
    assert.strictEqual(response.body.assigned_to, '');
    assert.strictEqual(response.body.status_text, '');
  });

  it('Create an issue with missing required fields: POST request to /api/issues/{project}', async function () {
    const response = await request(app).post(`/api/issues/${project}`).send({ issue_title: 'Missing' });
    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.body, { error: 'required field(s) missing' });
  });

  it('View issues on a project: GET request to /api/issues/{project}', async function () {
    await request(app).post(`/api/issues/${project}`).send({ issue_title: 'One', issue_text: 'Text', created_by: 'A' });
    const response = await request(app).get(`/api/issues/${project}`);
    assert.strictEqual(response.body.length, 1);
  });

  it('View issues on a project with one filter: GET request to /api/issues/{project}', async function () {
    await request(app).post(`/api/issues/${project}`).send({ issue_title: 'Open', issue_text: 'Text', created_by: 'A' });
    const response = await request(app).get(`/api/issues/${project}?open=true`);
    assert.strictEqual(response.body.length, 1);
  });

  it('View issues on a project with multiple filters: GET request to /api/issues/{project}', async function () {
    await request(app).post(`/api/issues/${project}`).send({ issue_title: 'Match', issue_text: 'Text', created_by: 'A', status_text: 'new' });
    const response = await request(app).get(`/api/issues/${project}?created_by=A&status_text=new`);
    assert.strictEqual(response.body.length, 1);
  });

  async function createIssueForMutation() {
    const response = await request(app).post(`/api/issues/${project}`).send({ issue_title: 'Update me', issue_text: 'Text', created_by: 'A' });
    issue = response.body;
  }

  it('Update one field on an issue: PUT request to /api/issues/{project}', async function () {
    await createIssueForMutation();
    const response = await request(app).put(`/api/issues/${project}`).send({ _id: issue._id, issue_title: 'Updated' });
    assert.deepStrictEqual(response.body, { result: 'successfully updated', _id: issue._id });
  });

  it('Update multiple fields on an issue: PUT request to /api/issues/{project}', async function () {
    await createIssueForMutation();
    const response = await request(app).put(`/api/issues/${project}`).send({ _id: issue._id, issue_title: 'Updated', status_text: 'done' });
    assert.strictEqual(response.body.result, 'successfully updated');
    const saved = (await request(app).get(`/api/issues/${project}?_id=${issue._id}`)).body[0];
    assert.strictEqual(saved.status_text, 'done');
  });

  it('Update an issue with missing _id: PUT request to /api/issues/{project}', async function () {
    const response = await request(app).put(`/api/issues/${project}`).send({ issue_title: 'Updated' });
    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.body, { error: 'missing _id' });
  });

  it('Update an issue with no fields to update: PUT request to /api/issues/{project}', async function () {
    await createIssueForMutation();
    const response = await request(app).put(`/api/issues/${project}`).send({ _id: issue._id });
    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.body, { error: 'no update field(s) sent', _id: issue._id });
  });

  it('Update an issue with an invalid _id: PUT request to /api/issues/{project}', async function () {
    const response = await request(app).put(`/api/issues/${project}`).send({ _id: 'invalid', issue_title: 'Updated' });
    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.body, { error: 'could not update', _id: 'invalid' });
  });

  it('Delete an issue: DELETE request to /api/issues/{project}', async function () {
    await createIssueForMutation();
    const response = await request(app).delete(`/api/issues/${project}`).send({ _id: issue._id });
    assert.deepStrictEqual(response.body, { result: 'successfully deleted', _id: issue._id });
  });

  it('Delete an issue with an invalid _id: DELETE request to /api/issues/{project}', async function () {
    await createIssueForMutation();
    const response = await request(app).delete(`/api/issues/${project}`).send({ _id: 'invalid' });
    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.body, { error: 'could not delete', _id: 'invalid' });
  });

  it('Delete an issue with missing _id: DELETE request to /api/issues/{project}', async function () {
    const response = await request(app).delete(`/api/issues/${project}`).send({});
    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.body, { error: 'missing _id' });
  });
});