const assert = require('assert');
const request = require('supertest');
const app = require('../server');
const api = require('../routes/api');

describe('Issue Tracker API', function () {
  const project = 'functional-test-project';
  let issue;

  beforeEach(() => api.clear());

  it('creates an issue with every field', async function () {
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

  it('creates an issue with only required fields', async function () {
    const response = await request(app).post(`/api/issues/${project}`).send({
      issue_title: 'Required', issue_text: 'Only required values', created_by: 'Ada'
    });
    assert.strictEqual(response.body.assigned_to, '');
    assert.strictEqual(response.body.status_text, '');
  });

  it('rejects an issue with missing required fields', async function () {
    const response = await request(app).post(`/api/issues/${project}`).send({ issue_title: 'Missing' });
    assert.deepStrictEqual(response.body, { error: 'required field(s) missing' });
  });

  it('views all issues on a project', async function () {
    await request(app).post(`/api/issues/${project}`).send({ issue_title: 'One', issue_text: 'Text', created_by: 'A' });
    const response = await request(app).get(`/api/issues/${project}`);
    assert.strictEqual(response.body.length, 1);
  });

  it('filters issues with one query field', async function () {
    await request(app).post(`/api/issues/${project}`).send({ issue_title: 'Open', issue_text: 'Text', created_by: 'A' });
    const response = await request(app).get(`/api/issues/${project}?open=true`);
    assert.strictEqual(response.body.length, 1);
  });

  it('filters issues with multiple query fields', async function () {
    await request(app).post(`/api/issues/${project}`).send({ issue_title: 'Match', issue_text: 'Text', created_by: 'A', status_text: 'new' });
    const response = await request(app).get(`/api/issues/${project}?created_by=A&status_text=new`);
    assert.strictEqual(response.body.length, 1);
  });

  async function createIssueForMutation() {
    const response = await request(app).post(`/api/issues/${project}`).send({ issue_title: 'Update me', issue_text: 'Text', created_by: 'A' });
    issue = response.body;
  }

  it('updates one field', async function () {
    await createIssueForMutation();
    const response = await request(app).put(`/api/issues/${project}`).send({ _id: issue._id, issue_title: 'Updated' });
    assert.deepStrictEqual(response.body, { result: 'successfully updated', _id: issue._id });
  });

  it('updates multiple fields', async function () {
    await createIssueForMutation();
    const response = await request(app).put(`/api/issues/${project}`).send({ _id: issue._id, issue_title: 'Updated', status_text: 'done' });
    assert.strictEqual(response.body.result, 'successfully updated');
    const saved = (await request(app).get(`/api/issues/${project}?_id=${issue._id}`)).body[0];
    assert.strictEqual(saved.status_text, 'done');
  });

  it('rejects an update with missing _id', async function () {
    const response = await request(app).put(`/api/issues/${project}`).send({ issue_title: 'Updated' });
    assert.deepStrictEqual(response.body, { error: 'missing _id' });
  });

  it('rejects an update with no fields to update', async function () {
    await createIssueForMutation();
    const response = await request(app).put(`/api/issues/${project}`).send({ _id: issue._id });
    assert.deepStrictEqual(response.body, { error: 'no update field(s) sent', _id: issue._id });
  });

  it('rejects an update with an invalid _id', async function () {
    const response = await request(app).put(`/api/issues/${project}`).send({ _id: 'invalid', issue_title: 'Updated' });
    assert.deepStrictEqual(response.body, { error: 'could not update', _id: 'invalid' });
  });

  it('deletes an issue', async function () {
    await createIssueForMutation();
    const response = await request(app).delete(`/api/issues/${project}`).send({ _id: issue._id });
    assert.deepStrictEqual(response.body, { result: 'successfully deleted', _id: issue._id });
  });

  it('rejects a delete with an invalid _id', async function () {
    await createIssueForMutation();
    const response = await request(app).delete(`/api/issues/${project}`).send({ _id: 'invalid' });
    assert.deepStrictEqual(response.body, { error: 'could not delete', _id: 'invalid' });
  });

  it('rejects a delete with missing _id', async function () {
    const response = await request(app).delete(`/api/issues/${project}`).send({});
    assert.deepStrictEqual(response.body, { error: 'missing _id' });
  });
});