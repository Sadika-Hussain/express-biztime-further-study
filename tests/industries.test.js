process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

beforeAll(async () => {
    // Clean up before tests
    await db.query("DELETE FROM company_industries");
    await db.query("DELETE FROM industries");
});

afterAll(async () => {
    // Close database connection after tests
    await db.end();
});

describe("Test /industries routes", () => {

    let industryCode;
    let companyCode;

    // Test POST /industries route
    test("creates a new industry", async () => {
        const response = await request(app)
            .post("/industries")
            .send({ industry: "Technology" });

        expect(response.status).toBe(201);
        expect(response.body.industry).toHaveProperty("code");
        expect(response.body.industry.industry).toBe("Technology");

        industryCode = response.body.industry.code; // Save industry code for later tests
    });

    // Test GET /industries route
    test("gets a list of industries", async () => {
        const response = await request(app).get("/industries");

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.industries)).toBe(true);
        expect(response.body.industries.length).toBeGreaterThan(0);
    });

    // Test POST /industries/:code route
    test("associates a company with an industry", async () => {
        // Create a company to associate with the industry
        const companyResponse = await request(app)
            .post("/companies")
            .send({ name: "Tech Corp", description: "A technology company" });

        companyCode = companyResponse.body.company.code;

        const response = await request(app)
            .post(`/industries/${industryCode}`)
            .send({ company_code: companyCode });

        expect(response.status).toBe(201);
        expect(response.body.message).toBe(`Company '${companyCode}' associated with industry '${industryCode}'`);
    });

    // Test POST /industries/:code route for invalid industry
    test("returns an error when the industry does not exist", async () => {
        const response = await request(app)
            .post(`/industries/nonexistent_code`)
            .send({ company_code: companyCode });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Industry with code 'nonexistent_code' not found");
    });

    // Test POST /industries/:code route for invalid company
    test("returns an error when the company does not exist", async () => {
        const response = await request(app)
            .post(`/industries/${industryCode}`)
            .send({ company_code: "non-existent" });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Company with code 'non-existent' not found");
    });

    test("returns an error when the company name is missing", async () => {
        const response = await request(app)
            .post(`/industries/${industryCode}`)

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("'company_code' is required");
    });

    // Test POST /industries route for missing industry name
    test("returns an error when the industry name is missing", async () => {
        const response = await request(app).post("/industries").send({});

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Industry name is required");
    });

});