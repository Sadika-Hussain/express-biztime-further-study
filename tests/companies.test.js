process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

beforeAll(async () => {
    // Ensure the test database is clean before tests begin
    await db.query("DELETE FROM company_industries");
    await db.query("DELETE FROM invoices");
    await db.query("DELETE FROM companies");
    await db.query("DELETE FROM industries");
});

afterAll(async () => {
    // Close database connection after tests
    await db.end();
});
  

describe("Test /companies routes", () => {

    let companyCode;

    // Test POST /companies route
    test("creates a new company", async () => {
        const response = await request(app)
            .post("/companies")
            .send({ name: "Test Company", description: "A test company" });

        expect(response.status).toBe(201);
        expect(response.body.company).toHaveProperty("code");
        expect(response.body.company.name).toBe("Test Company");
        expect(response.body.company.description).toBe("A test company");

        companyCode = response.body.company.code; // Save company code for later tests
    });

    test("throws an error with status 400 if required fields are missing", async () => {
        const response = await request(app)
            .post("/companies")
            .send({ description: "A test company" });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Both 'name' and 'description' are required");
    });

    // Test GET /companies route
    test("gets a list of companies", async () => {
        const response = await request(app).get("/companies");

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.companies)).toBe(true);
        expect(response.body.companies.length).toBeGreaterThan(0);
    });

    // Test GET /companies/:code route
    test("gets details of a single company", async () => {
        const response = await request(app).get(`/companies/${companyCode}`);

        expect(response.status).toBe(200);
        expect(response.body.company).toHaveProperty("code", companyCode);
        expect(response.body.company).toHaveProperty("name");
        expect(response.body.company).toHaveProperty("description");
        expect(response.body.company).toHaveProperty("industries");
        expect(response.body.company).toHaveProperty("invoices");
    });

    // Test PUT /companies/:code route
    test("updates company details", async () => {
        const response = await request(app)
            .put(`/companies/${companyCode}`)
            .send({ name: "Updated Test Company", description: "Updated description" });

        expect(response.status).toBe(200);
        expect(response.body.company.name).toBe("Updated Test Company");
        expect(response.body.company.description).toBe("Updated description");
    });

    test("throws an error if company not found", async () => {
        const response = await request(app)
            .put(`/companies/non-existent`)
            .send({ name: "Non-existent Company", description: "Non-existent company description" });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Company with code 'non-existent' not found")
    });

    // Test DELETE /companies/:code route
    test("deletes a company", async () => {
        const response = await request(app).delete(`/companies/${companyCode}`);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("deleted");

        // Ensure the company is deleted
        const checkResponse = await request(app).get(`/companies/${companyCode}`);
        expect(checkResponse.status).toBe(404); // Company should no longer exist
    });

    test("throws an error if trying to delete a non-existent company", async () => {
        const response = await request(app).delete(`/companies/non-existent`);

        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Company with code 'non-existent' not found");
    });
});