const express = require('express');
const slugify = require("slugify");

const router = express.Router();
const ExpressError = require("../expressError");
const db = require("../db");

// List all industries
router.get("/", async function (req, res, next) {
    try {
        const results = await db.query(
            `SELECT 
                i.code AS industry_code,
                i.industry AS industry_name,
                ARRAY_AGG(ci.company_code) AS company_codes
             FROM industries i
             LEFT JOIN company_industries ci ON i.code = ci.industry_code
             GROUP BY i.code, i.industry`
        );

        const industries = results.rows.map(row => ({
            code: row.industry_code,
            name: row.industry_name,
            companies: row.company_codes.filter(Boolean), // Exclude nulls
        }));

        return res.json({ industries });
    } catch (err) {
        return next(err);
    }
});

// Route to add a new industry
router.post("/", async function (req, res, next) {
    try {
        const { industry } = req.body;

        if (!industry) {
            throw new ExpressError("Industry name is required", 400);
        }

        const code = slugify(industry, { lower: true, strict: true });

        await db.query(
            `INSERT INTO industries (code, industry)
             VALUES ($1, $2)`,
            [code, industry]
        );

        return res.status(201).json({ industry: { code, industry } });
    } catch (err) {
        return next(err);
    }
});

// Associate an industry with a company
router.post("/:code", async function (req, res, next) {
    try {
        const { code: industry_code } = req.params; // Extract industry_code from URL
        const { company_code } = req.body; // Extract company_code from JSON body

        if (!company_code) {
            throw new ExpressError("'company_code' is required", 400);
        }

        // Verify the industry exists
        const industryCheck = await db.query(
            `SELECT code FROM industries WHERE code = $1`,
            [industry_code]
        );

        if (industryCheck.rows.length === 0) {
            throw new ExpressError(`Industry with code '${industry_code}' not found`, 404);
        }

        // Verify the company exists
        const companyCheck = await db.query(
            `SELECT code FROM companies WHERE code = $1`,
            [company_code]
        );

        if (companyCheck.rows.length === 0) {
            throw new ExpressError(`Company with code '${company_code}' not found`, 404);
        }

        // Associate the industry with the company
        await db.query(
            `INSERT INTO company_industries (company_code, industry_code)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [company_code, industry_code]
        );

        return res.status(201).json({ message: `Company '${company_code}' associated with industry '${industry_code}'` });
    } catch (err) {
        return next(err);  
    }
});

module.exports = router;