const express = require('express');
const slugify = require("slugify");

const router = express.Router();
const ExpressError = require("../expressError");
const db = require("../db");


// Returns list of companies with their codes and names
router.get("/", async function (req, res, next) {
    try {
        const results = await db.query(
            `SELECT code, name FROM companies`);

        return res.json({ companies: results.rows });
    }

    catch (err) {
        return next(err);
    }
});

// Returns details of a single company including its invoices and industries (if any)
router.get("/:code", async function (req, res, next) {
    try {
        const code = req.params.code;

        // Single query to fetch company details, invoices, and industries
        const results = await db.query(
            `SELECT 
                c.code AS company_code, 
                c.name AS company_name, 
                c.description AS company_description,
                i.id AS invoice_id, 
                i.amt AS invoice_amt, 
                i.paid AS invoice_paid, 
                TO_CHAR(i.add_date, 'YYYY-MM-DD') AS invoice_add_date, 
                TO_CHAR(i.paid_date, 'YYYY-MM-DD') AS invoice_paid_date,
                ind.industry AS industry_name
             FROM companies c
             LEFT JOIN invoices i ON c.code = i.comp_code
             LEFT JOIN company_industries ci ON c.code = ci.company_code
             LEFT JOIN industries ind ON ci.industry_code = ind.code
             WHERE c.code = $1`,
            [code]
        );

        if (results.rows.length === 0) {
            throw new ExpressError(`Company with code '${code}' not found`, 404);
        }

        // Extract company details from the first row
        const { company_code, company_name, company_description } = results.rows[0];

        // Collect invoices
        const invoices = results.rows
            .filter(row => row.invoice_id !== null) // Exclude null invoices
            .map(row => ({
                id: row.invoice_id,
                amt: row.invoice_amt,
                paid: row.invoice_paid,
                add_date: row.invoice_add_date,
                paid_date: row.invoice_paid_date,
            }));

        // Collect industries (remove duplicates)
        const industries = Array.from(
            new Set(results.rows.map(row => row.industry_name).filter(Boolean))
        );

        // Build the response object
        return res.json({
            company: {
                code: company_code,
                name: company_name,
                description: company_description,
                industries: industries,
                invoices: invoices,
            },
        });
    } catch (err) {
        return next(err);
    }
});

// Adds a new company and returns the created company object
router.post("/", async function (req, res, next) {
    try {
        const { name, description } = req.body;

        // Validate required fields
        if (!name || !description) {
            throw new ExpressError("Both 'name' and 'description' are required", 400);
        }

        // Generate a slugified code from the company name
        const code = slugify(name, {
            lower: true,       // Convert to lowercase
            strict: true       // Remove special characters
        });

        // Insert the new company into the database
        const result = await db.query(
            `INSERT INTO companies (code, name, description) 
                VALUES ($1, $2, $3)
                RETURNING code, name, description`,
            [code, name, description]
        );

        // Return the created company object
        return res.status(201).json({ company: result.rows[0] });
    } catch (err) {
        return next(err);
    }
});

// Edits a company's details and returns the updated company object
router.put("/:code", async function (req, res, next) {
    try {
        const code = req.params.code;
        const { name, description } = req.body;

        const results = await db.query(
            `UPDATE companies SET name=$1, description=$2
            WHERE code = $3
            RETURNING code, name, description`,
            [name, description, code]);

        if (results.rows.length === 0) {
            throw new ExpressError(`Company with code '${code}' not found`, 404);
        }

        return res.json({ company: results.rows[0] });
    }

    catch (err) {
        return next(err);
    }
});

// Deletes a company and returns a confirmation message 
router.delete("/:code", async function (req, res, next) {
    try {
        const code = req.params.code;
        const results = await db.query(
            `DELETE FROM companies WHERE code=$1 RETURNING code`, [code]);

        if (results.rows.length === 0) {
            throw new ExpressError(`Company with code '${code}' not found`, 404);
        }

        return res.json({ status: "deleted" });
    }

    catch (err) {
        return next(err);
    }
});

module.exports = router;