process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

beforeAll(async () => {
    await db.query('DELETE FROM invoices');
    await db.query('DELETE FROM companies');
});

afterAll(async () => {
    await db.end();
});

describe('Invoices Routes', () => {
    let company;

    beforeAll(async () => {
        // Create a company for testing
        const result = await db.query(`
        INSERT INTO companies (code, name, description)
        VALUES ('testcode', 'Test Company', 'Test description')
        RETURNING code, name, description
      `);
        company = result.rows[0];
    });

    // Test GET /invoices - List of invoices
    test('GET /invoices - should return a list of invoices', async () => {
        const response = await request(app).get('/invoices');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('invoices');
        expect(Array.isArray(response.body.invoices)).toBe(true);
    });

    // Test GET /invoices/:id - Invoice details by ID
    test('GET /invoices/:id - should return details of a specific invoice', async () => {
        // Insert a test invoice
        const result = await db.query(`
        INSERT INTO invoices (comp_code, amt)
        VALUES ('testcode', 100.00)
        RETURNING id, comp_code, amt, paid, add_date, paid_date
      `);
        const invoice = result.rows[0];
        const response = await request(app).get(`/invoices/${invoice.id}`);
        expect(response.status).toBe(200);
        expect(response.body.invoice).toHaveProperty('id', invoice.id);
        expect(response.body.invoice).toHaveProperty('amt', invoice.amt);
    });

    // Test POST /invoices - Add a new invoice
    test('POST /invoices - should create a new invoice', async () => {
        const response = await request(app)
            .post('/invoices')
            .send({ comp_code: 'testcode', amt: 200.00 });
        expect(response.status).toBe(201);
        expect(response.body.invoice).toHaveProperty('amt', 200.00);
        expect(response.body.invoice).toHaveProperty('comp_code', 'testcode');
    });

    test('POST /invoices - returns an error if company does not exist', async () => {
        const response = await request(app)
            .post('/invoices')
            .send({ comp_code: 'non-existent', amt: 200.00 });
        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Company with code 'non-existent' not found");
    });

    // Test PUT /invoices/:id - Update an existing invoice
    test('PUT /invoices/:id - should update an invoice', async () => {
        // Insert a test invoice
        const result = await db.query(`
        INSERT INTO invoices (comp_code, amt)
        VALUES ('testcode', 100.00)
        RETURNING id, comp_code, amt, paid, add_date, paid_date
      `);
        const invoice = result.rows[0];

        const response = await request(app)
            .put(`/invoices/${invoice.id}`)
            .send({ amt: 300.00, paid: true });
        expect(response.status).toBe(200);
        expect(response.body.invoice).toHaveProperty('amt', 300.00);
        expect(response.body.invoice).toHaveProperty('paid', true);
    });

    test('PUT /invoices/:id - should return an error if invoice amount is invalid', async () => {
        // Insert a test invoice
        const result = await db.query(`
        INSERT INTO invoices (comp_code, amt)
        VALUES ('testcode', 100.00)
        RETURNING id, comp_code, amt, paid, add_date, paid_date
      `);
        const invoice = result.rows[0];

        const response = await request(app)
            .put(`/invoices/${invoice.id}`)
            .send({ amt: -300.00, paid: true });
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Amount must be a positive number');

    });

    test('PUT /invoices/:id - should return an error if invoice ID does not exist', async () => {
        const response = await request(app)
            .put(`/invoices/999`)
            .send({ amt: 300.00, paid: true });
        expect(response.status).toBe(404);
        expect(response.body.message).toBe(`Invoice with ID '999' not found`);

    });

    it('PUT /invoices/:id - should set paid_date to null if paid is false', async () => {
        // Insert a test invoice
        const result = await db.query(`
          INSERT INTO invoices (comp_code, amt)
          VALUES ('testcode', 100.00)
          RETURNING id, comp_code, amt, paid, add_date, paid_date
        `);
        const invoice = result.rows[0];

        // Update the invoice to set paid to false
        const response = await request(app)
            .put(`/invoices/${invoice.id}`)
            .send({ paid: false, amt: 100.00 });

        // Check if the paid_date is null
        expect(response.status).toBe(200);
        expect(response.body.invoice.paid_date).toBeNull();
    });

    // Test DELETE /invoices/:id - Delete an invoice
    test('DELETE /invoices/:id - should delete an invoice', async () => {
        // Insert a test invoice
        const result = await db.query(`
        INSERT INTO invoices (comp_code, amt)
        VALUES ('testcode', 100.00)
        RETURNING id, comp_code, amt, paid, add_date, paid_date
      `);
        const invoice = result.rows[0];

        const response = await request(app).delete(`/invoices/${invoice.id}`);
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('deleted');
    });

    test('DELETE /invoices/:id - should return an error if invoice ID does not exist ', async () => {
        const response = await request(app).delete(`/invoices/999`);
        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Invoice with ID '999' not found");
    });

    // Test POST /invoices - Should return an error if amount is <= 0
    test('POST /invoices - should return error if amount is <= 0', async () => {
        const response = await request(app)
            .post('/invoices')
            .send({ comp_code: 'testcode', amt: -10.00 });
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Amount must be a positive number');
    });

    // Test GET /invoices/:id - Should return an error if invoice not found
    test('GET /invoices/:id - should return an error if invoice not found', async () => {
        const response = await request(app).get('/invoices/999');
        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Invoice with ID '999' not found");
    });
});

