// =====================================================
// IMPORTS & CONFIGURATION
// =====================================================

const express = require("express");
const path = require("path");
const mysql = require("mysql2");
const multer = require("multer");
const fs = require("fs");
const session = require("express-session");
const bcrypt = require("bcrypt");

require("dotenv").config();

const app = express();


// =====================================================
// MYSQL CONNECTION
// =====================================================

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});


connection.connect((err) => {
    if (err) {
        console.log("Database Connection Error:");
        console.log(err);
        return;
    }
    console.log("MySQL Connected Successfully");
});


// =====================================================
// EXPRESS SETUP
// =====================================================

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// PUBLIC FOLDER
app.use(express.static(path.join(__dirname, "public")));

// UPLOADS FOLDER PUBLIC ACCESS
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// =====================================================
// SESSION MIDDLEWARE
// =====================================================

app.use(
    session({
        secret: process.env.SESSION_SECRET || "vardaone-secret-key-12345",
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false,
            maxAge: 24 * 60 * 60 * 1000
        }
    })
);


// =====================================================
// AUTHENTICATION MIDDLEWARES
// =====================================================

function requireLogin(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
    }
    next();
}

function requireLoginPage(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.redirect("/login");
    }
    next();
}

function requireRole(role) {
    return (req, res, next) => {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ message: "Authentication required" });
        }
        if (req.session.user.role !== role) {
            return res.status(403).json({ message: "Access denied: unauthorized role" });
        }
        next();
    };
}

function requireRolePage(role) {
    return (req, res, next) => {
        if (!req.session || !req.session.user) {
            return res.redirect("/login");
        }
        if (req.session.user.role !== role) {
            if (req.session.user.role === "vsc_admin") {
                return res.redirect("/vsc-admin/dashboard");
            } else if (req.session.user.role === "data_collector") {
                return res.redirect("/data-entry");
            } else if (req.session.user.role === "company_admin") {
                return res.redirect("/company/dashboard");
            } else if (req.session.user.role === "supervisor") {
                return res.redirect("/supervisor/dashboard");
            }
            return res.redirect("/login");
        }
        next();
    };
}


// =====================================================
// CREATE UPLOAD DIRECTORY
// =====================================================

const uploadDirectory = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}


// =====================================================
// MULTER CONFIGURATION
// PDF + PNG + JPG + JPEG
// =====================================================

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDirectory);
    },
    filename: function (req, file, cb) {
        const uniqueName =
            Date.now() + "-" + Math.round(Math.random() * 100000000) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        const allowedTypes = ["application/pdf", "image/png", "image/jpeg"];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only PDF, PNG, JPG and JPEG files are allowed."));
        }
    }
});


// =====================================================
// HOME PAGE
// =====================================================

app.get("/", (req, res) => {
    res.render("home.ejs");
});


// =====================================================
// LOGIN PAGE
// =====================================================

app.get("/login", (req, res) => {
    if (req.session && req.session.user) {
        if (req.session.user.role === "vsc_admin") {
            return res.redirect("/vsc-admin/dashboard");
        } else if (req.session.user.role === "data_collector") {
            return res.redirect("/data-entry");
        } else if (req.session.user.role === "company_admin") {
            return res.redirect("/company/dashboard");
        } else if (req.session.user.role === "supervisor") {
            return res.redirect("/supervisor/dashboard");
        }
    }
    res.render("login.ejs", { error: null });
});


// =====================================================
// LOGIN
// =====================================================

app.post("/login", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    const q = `SELECT * FROM users WHERE email = ? LIMIT 1`;

    connection.query(q, [email], async (err, results) => {
        if (err) {
            console.log("Login DB Error:");
            console.log(err);
            return res.status(500).render("login.ejs", { error: "Database Error" });
        }

        if (results.length === 0) {
            return res.render("login.ejs", { error: "Email not found" });
        }

        const user = results[0];

        let isPasswordValid = false;

        try {
            isPasswordValid = await bcrypt.compare(password, user.password_hash);
        } catch (compareError) {
            isPasswordValid = (password === user.password_hash);
        }

        if (!isPasswordValid && password === user.password_hash) {
            isPasswordValid = true;
        }

        if (!isPasswordValid) {
            return res.render("login.ejs", { error: "Wrong Password" });
        }

        if (!user.is_active) {
            return res.render("login.ejs", { error: "Your account is inactive" });
        }

        req.session.user = {
            id: user.id,
            name: user.name,
            role: user.role,
            company_id: user.company_id
        };

        if (user.role === "vsc_admin") {
            return res.redirect("/vsc-admin/dashboard");
        }

        if (user.role === "data_collector") {
            return res.redirect("/data-entry");
        }

        if (user.role === "company_admin") {
            return res.redirect("/company/dashboard");
        }

        if (user.role === "supervisor") {
            return res.redirect("/supervisor/dashboard");
        }

        return res.render("login.ejs", { error: "Invalid User Role" });
    });
});


// =====================================================
// LOGOUT
// =====================================================

app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) console.log("Logout Error:", err);
        res.redirect("/login");
    });
});

app.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) console.log("Logout Error:", err);
        res.redirect("/login");
    });
});


// =====================================================
// VSC ADMIN PAGE
// =====================================================

app.get("/vsc-admin/dashboard", requireRolePage("vsc_admin"), (req, res) => {
    res.render("vsc-admin.ejs");
});


// =====================================================
// DATA ENTRY PAGE
// =====================================================

app.get("/data-entry", requireRolePage("data_collector"), (req, res) => {
    res.render("data-entry.ejs");
});


// =====================================================
// COMPANY ADMIN PAGE
// =====================================================

app.get("/company/dashboard", requireRolePage("company_admin"), (req, res) => {
    res.render("company-admin.ejs");
});


// =====================================================
// SUPERVISOR PAGE
// =====================================================

app.get("/supervisor/dashboard", requireRolePage("supervisor"), (req, res) => {
    res.render("supervisor.ejs");
});


// =====================================================
// API - VSC DASHBOARD STATISTICS
// =====================================================

app.get("/api/vsc/dashboard", (req, res) => {
    const query = `
        SELECT
        (SELECT COUNT(*) FROM companies) AS companies,
        (SELECT COUNT(*) FROM plants) AS plants,
        (SELECT COUNT(*) FROM users WHERE role = 'company_admin' AND is_active = 1) AS admins,
        (SELECT COUNT(*) FROM users WHERE role = 'data_collector' AND is_active = 1) AS collectors
    `;

    connection.query(query, (err, results) => {
        if (err) {
            console.log("Dashboard API Error:", err);
            return res.status(500).json({ message: "Unable to load dashboard statistics." });
        }
        res.json(results[0]);
    });
});


// =====================================================
// GET ALL COMPANIES
// =====================================================

app.get("/api/companies", (req, res) => {
    const query = `
        SELECT
            c.id, c.company_name, c.company_code, c.created_at,
            COUNT(DISTINCT p.id) AS plant_count,
            MAX(CASE WHEN u.role = 'company_admin' THEN u.name END) AS admin_name,
            MAX(CASE WHEN u.role = 'data_collector' THEN u.name END) AS collector_name,
            CASE WHEN SUM(CASE WHEN u.is_active = 1 THEN 1 ELSE 0 END) > 0 THEN 1 ELSE 0 END AS is_active
        FROM companies c
        LEFT JOIN plants p ON p.company_id = c.id
        LEFT JOIN users u ON u.company_id = c.id
        GROUP BY c.id, c.company_name, c.company_code, c.created_at
        ORDER BY c.created_at DESC
    `;

    connection.query(query, (err, results) => {
        if (err) {
            console.log("Companies API Error:", err);
            return res.status(500).json({ message: "Unable to load companies." });
        }
        res.json(results);
    });
});


// =====================================================
// CREATE COMPANY
// Now accepts: plants[], admin, supervisors[] (multiple),
// collector
// =====================================================

app.post("/api/companies", (req, res) => {
    const {
        company_name,
        company_code,
        plants,
        admins,
        supervisors,
        collectors
    } = req.body;

    if (
        !company_name || !company_code ||
        !Array.isArray(plants) || plants.length === 0 ||
        !Array.isArray(admins) || admins.length === 0 ||
        !Array.isArray(supervisors) || supervisors.length === 0 ||
        !Array.isArray(collectors) || collectors.length === 0
    ) {
        return res.status(400).json({
            message: "Please provide all required company, plant, admin, supervisor and collector information."
        });
    }

    connection.beginTransaction((transactionError) => {
        if (transactionError) {
            console.log(transactionError);
            return res.status(500).json({ message: "Unable to start database transaction." });
        }

        const companyQuery = `INSERT INTO companies (company_name, company_code) VALUES (?, ?)`;

        connection.query(companyQuery, [company_name, company_code], (companyError, companyResult) => {
            if (companyError) {
                return rollbackWithError(res, companyError, "Unable to create company.");
            }

            const companyId = companyResult.insertId;

            const plantValues = plants.map((plant) => [
                companyId,
                plant.plant_code,
                plant.plant_name,
                plant.plant_address,
                plant.city,
                plant.state,
                plant.country,
                plant.pincode
            ]);

            const plantQuery = `
                INSERT INTO plants
                (company_id, plant_code, plant_name, plant_address, city, state, country, pincode)
                VALUES ?
            `;

            connection.query(plantQuery, [plantValues], (plantError) => {
                if (plantError) {
                    return rollbackWithError(res, plantError, "Unable to create company plants.");
                }

                const usersQuery = `
                    INSERT INTO users (name, email, password_hash, role, company_id, is_active)
                    VALUES ?
                `;

                const userValues = [

                    ...admins.map(admin => [
                        admin.name, admin.email, admin.password, "company_admin", companyId, 1
                    ]),

                    ...supervisors.map(sup => [
                        sup.name, sup.email, sup.password, "supervisor", companyId, 1
                    ]),

                    ...collectors.map(collector => [
                        collector.name, collector.email, collector.password, "data_collector", companyId, 1
                    ])

                ];

                connection.query(usersQuery, [userValues], (usersError) => {
                    if (usersError) {
                        return rollbackWithError(res, usersError, "Unable to create company users.");
                    }

                    connection.commit((commitError) => {
                        if (commitError) {
                            return rollbackWithError(res, commitError, "Unable to complete company creation.");
                        }

                        return res.status(201).json({
                            message: "Company created successfully.",
                            company_id: companyId
                        });
                    });
                });
            });
        });
    });
});


// =====================================================
// ROLLBACK HELPER
// =====================================================

function rollbackWithError(res, error, defaultMessage) {
    console.log("Transaction Error:", error);

    connection.rollback(() => {
        let message = defaultMessage;

        if (error.code === "ER_DUP_ENTRY") {
            message = "Company code, plant code or email already exists.";
        }

        return res.status(500).json({ message: message });
    });
}


// =====================================================
// GET COMPANY PLANTS
// =====================================================

app.get("/api/companies/:companyId/plants", (req, res) => {
    const companyId = req.params.companyId;

    const query = `
        SELECT id, company_id, plant_code, plant_name, plant_address, city, state, country, pincode, created_at
        FROM plants
        WHERE company_id = ?
        ORDER BY created_at ASC
    `;

    connection.query(query, [companyId], (err, results) => {
        if (err) {
            console.log("Plants API Error:", err);
            return res.status(500).json({ message: "Unable to load plants." });
        }
        res.json(results);
    });
});


// =====================================================
// GET COMPANY USERS
// =====================================================

app.get("/api/companies/:companyId/users", (req, res) => {
    const companyId = req.params.companyId;

    const query = `
        SELECT id, name, email, role, company_id, is_active, created_at
        FROM users
        WHERE company_id = ?
        ORDER BY created_at ASC
    `;

    connection.query(query, [companyId], (err, results) => {
        if (err) {
            console.log("Users API Error:", err);
            return res.status(500).json({ message: "Unable to load company users." });
        }
        res.json(results);
    });
});


// =====================================================
// GET COMPANY EMISSION DATA
// OPTIONAL FILTERS: plant_id, scope, reporting_period, status
// =====================================================

const getCompanyDataHandler = (req, res) => {
    const companyId = req.params.companyId;
    const plantId = req.query.plant_id;
    const scope = req.query.scope;
    const reportingPeriod = req.query.reporting_period;
    const status = req.query.status;

    let query = `
        SELECT
            e.id, e.company_id, e.plant_id, e.user_id, e.scope, e.reporting_period,
            e.activity_category, e.source_name, e.quantity, e.unit, e.emission_factor,
            e.calculated_emissions, e.evidence_path, e.status, e.reviewed_by,
            e.reviewed_at, e.review_notes, e.resubmission_count, e.last_resubmitted_at, e.updated_at, e.created_at,
            p.plant_name, p.plant_code,
            u.name AS submitted_by, u.email AS submitted_by_email
        FROM emission_entries e
        LEFT JOIN plants p ON p.id = e.plant_id
        LEFT JOIN users u ON u.id = e.user_id
        WHERE e.company_id = ?
    `;

    const values = [companyId];

    if (plantId) {
        query += " AND e.plant_id = ?";
        values.push(plantId);
    }

    if (scope) {
        query += " AND e.scope = ?";
        values.push(scope);
    }

    if (reportingPeriod) {
        query += " AND e.reporting_period = ?";
        values.push(reportingPeriod);
    }

    if (status) {
        query += " AND e.status = ?";
        values.push(status);
    }

    query += " ORDER BY e.created_at DESC";

    connection.query(query, values, (err, results) => {
        if (err) {
            console.log("Company Data API Error:", err);
            return res.status(500).json({ message: "Unable to load company data." });
        }
        res.json(results);
    });
};

app.get("/api/vsc/companies/:companyId/data", requireRole("vsc_admin"), getCompanyDataHandler);
app.get("/api/companies/:companyId/data", requireRole("vsc_admin"), getCompanyDataHandler);


// =====================================================
// VSC ADMIN - COMPANY DATA FILTERED BY SPECIFIC PLANT
// =====================================================

app.get(
    "/api/vsc/companies/:companyId/plants/:plantId/data",
    requireRole("vsc_admin"),
    (req, res) => {
        const companyId = req.params.companyId;
        const plantId = req.params.plantId;

        const query = `
            SELECT
                e.*,
                p.plant_name,
                p.plant_code,
                u.name AS submitted_by
            FROM emission_entries e
            LEFT JOIN plants p ON p.id = e.plant_id
            LEFT JOIN users u ON u.id = e.user_id
            WHERE e.company_id = ? AND e.plant_id = ?
            ORDER BY e.created_at DESC
        `;

        connection.query(query, [companyId, plantId], (err, results) => {
            if (err) {
                console.log("Plant-filtered Company Data Error:", err);
                return res.status(500).json({ message: "Plant data load failed." });
            }
            res.json(results);
        });
    }
);


// =====================================================
// COMPANY ADMIN
// Views ONLY their own company's data (session-scoped,
// cannot be spoofed to view another company)
// =====================================================

app.get("/api/company-admin/overview", requireRole("company_admin"), (req, res) => {
    const companyId = req.session.user.company_id;

    const query = `
        SELECT
            (SELECT COUNT(*) FROM plants WHERE company_id = ?) AS plants,
            (SELECT COUNT(*) FROM users WHERE company_id = ? AND role = 'data_collector' AND is_active = 1) AS collectors,
            (SELECT COUNT(*) FROM users WHERE company_id = ? AND role = 'supervisor' AND is_active = 1) AS supervisors,
            (SELECT COUNT(*) FROM emission_entries WHERE company_id = ? AND status = 'Pending') AS pending_entries,
            (SELECT COUNT(*) FROM emission_entries WHERE company_id = ? AND status = 'Approved') AS approved_entries,
            (SELECT COUNT(*) FROM emission_entries WHERE company_id = ? AND status = 'Rejected') AS rejected_entries
    `;

    connection.query(
        query,
        [companyId, companyId, companyId, companyId, companyId, companyId],
        (err, results) => {
            if (err) {
                console.log("Company Admin Overview Error:", err);
                return res.status(500).json({ message: "Unable to load overview." });
            }
            res.json(results[0]);
        }
    );
});


app.get("/api/company-admin/data", requireRole("company_admin"), (req, res) => {
    const companyId = req.session.user.company_id;
    const plantId = req.query.plant_id;
    const scope = req.query.scope;
    const reportingPeriod = req.query.reporting_period;
    const status = req.query.status;

    let query = `
        SELECT
            e.id, e.plant_id, e.user_id, e.scope, e.reporting_period,
            e.activity_category, e.source_name, e.quantity, e.unit, e.emission_factor,
            e.calculated_emissions, e.evidence_path, e.status, e.reviewed_by,
            e.reviewed_at, e.review_notes, e.created_at,
            p.plant_name, p.plant_code,
            u.name AS submitted_by, u.email AS submitted_by_email,
            r.name AS reviewed_by_name
        FROM emission_entries e
        LEFT JOIN plants p ON p.id = e.plant_id
        LEFT JOIN users u ON u.id = e.user_id
        LEFT JOIN users r ON r.id = e.reviewed_by
        WHERE e.company_id = ?
    `;

    const values = [companyId];

    if (plantId) {
        query += " AND e.plant_id = ?";
        values.push(plantId);
    }

    if (scope) {
        query += " AND e.scope = ?";
        values.push(scope);
    }

    if (reportingPeriod) {
        query += " AND e.reporting_period = ?";
        values.push(reportingPeriod);
    }

    if (status) {
        query += " AND e.status = ?";
        values.push(status);
    }

    query += " ORDER BY e.created_at DESC";

    connection.query(query, values, (err, results) => {
        if (err) {
            console.log("Company Admin Data Error:", err);
            return res.status(500).json({ message: "Unable to load company data." });
        }
        res.json(results);
    });
});


app.get("/api/company-admin/plants", requireRole("company_admin"), (req, res) => {
    const companyId = req.session.user.company_id;

    const query = `
        SELECT id, plant_code, plant_name, city, state, country
        FROM plants
        WHERE company_id = ?
        ORDER BY plant_name ASC
    `;

    connection.query(query, [companyId], (err, results) => {
        if (err) {
            console.log("Company Admin Plants Error:", err);
            return res.status(500).json({ message: "Unable to load plants." });
        }
        res.json(results);
    });
});


// =====================================================
// SUPERVISOR
// Reviews (approve/reject) entries for their own company
// =====================================================

app.get("/api/supervisor/setup", requireRole("supervisor"), (req, res) => {
    const userId = req.session.user.id;

    const query = `
        SELECT u.id, u.name, u.email, u.company_id, c.company_name, c.company_code
        FROM users u
        JOIN companies c ON c.id = u.company_id
        WHERE u.id = ? AND u.role = 'supervisor' AND u.is_active = 1
        LIMIT 1
    `;

    connection.query(query, [userId], (err, results) => {
        if (err) {
            console.log("Supervisor Setup Error:", err);
            return res.status(500).json({ message: "Unable to load supervisor profile." });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Supervisor not found." });
        }

        const user = results[0];

        res.json({
            supervisor: { id: user.id, name: user.name, email: user.email },
            company: { id: user.company_id, company_name: user.company_name, company_code: user.company_code }
        });
    });
});


app.get("/api/supervisor/entries", requireRole("supervisor"), (req, res) => {
    const companyId = req.session.user.company_id;
    const status = req.query.status;

    let query = `
        SELECT
            e.id, e.plant_id, e.user_id, e.scope, e.reporting_period,
            e.activity_category, e.source_name, e.quantity, e.unit,
            e.emission_factor, e.calculated_emissions, e.evidence_path,
            e.status, e.reviewed_by, e.reviewed_at, e.review_notes,
            e.created_at,
            p.plant_name, p.plant_code,
            u.name AS submitted_by, u.email AS submitted_by_email
        FROM emission_entries e
        LEFT JOIN plants p ON p.id = e.plant_id
        LEFT JOIN users u ON u.id = e.user_id
        WHERE e.company_id = ?
    `;

    const values = [companyId];

    if (status) {
        query += " AND e.status = ?";
        values.push(status);
    }

    query += " ORDER BY e.created_at DESC";

    connection.query(query, values, (err, results) => {
        if (err) {
            console.log("Supervisor Entries API Error:", err);
            return res.status(500).json({ message: "Unable to load entries." });
        }
        res.json(results);
    });
});


app.get("/api/supervisor/overview", requireRole("supervisor"), (req, res) => {
    const companyId = req.session.user.company_id;

    const query = `
        SELECT
            (SELECT COUNT(*) FROM emission_entries WHERE company_id = ? AND status = 'Pending') AS pending,
            (SELECT COUNT(*) FROM emission_entries WHERE company_id = ? AND status = 'Approved') AS approved,
            (SELECT COUNT(*) FROM emission_entries WHERE company_id = ? AND status = 'Rejected') AS rejected
    `;

    connection.query(query, [companyId, companyId, companyId], (err, results) => {
        if (err) {
            console.log("Supervisor Overview Error:", err);
            return res.status(500).json({ message: "Unable to load overview." });
        }
        res.json(results[0]);
    });
});


app.put("/api/supervisor/entries/:id/review", requireRole("supervisor"), (req, res) => {
    const entryId = Number(req.params.id);
    const companyId = req.session.user.company_id;
    const reviewerId = req.session.user.id;
    const { action, notes } = req.body;

    if (!["Approved", "Rejected"].includes(action)) {
        return res.status(400).json({ message: "Action must be 'Approved' or 'Rejected'." });
    }

    if (action === "Rejected" && (!notes || !notes.trim())) {
        return res.status(400).json({ message: "A rejection comment is required." });
    }

    connection.beginTransaction((txErr) => {
        if (txErr) return res.status(500).json({ message: "Unable to start review transaction." });

        const selectQuery = `
            SELECT id, company_id, user_id, status, quantity, unit,
                   calculated_emissions, evidence_path
            FROM emission_entries
            WHERE id = ? AND company_id = ?
            FOR UPDATE
        `;

        connection.query(selectQuery, [entryId, companyId], (selectErr, rows) => {
            if (selectErr || rows.length === 0) {
                return connection.rollback(() => {
                    res.status(rows && rows.length === 0 ? 404 : 500).json({
                        message: rows && rows.length === 0 ? "Entry not found for your company." : "Unable to verify entry."
                    });
                });
            }

            const entry = rows[0];
            if (entry.status !== "Pending") {
                return connection.rollback(() => res.status(409).json({
                    message: `Only Pending entries can be reviewed. Current status: ${entry.status}.`
                }));
            }

            const updateQuery = `
                UPDATE emission_entries
                SET status = ?, reviewed_by = ?, reviewed_at = NOW(), review_notes = ?
                WHERE id = ? AND company_id = ?
            `;

            connection.query(updateQuery, [action, reviewerId, notes ? notes.trim() : null, entryId, companyId], (updateErr) => {
                if (updateErr) return connection.rollback(() => res.status(500).json({ message: "Unable to update entry status." }));

                const auditQuery = `
                    INSERT INTO emission_entry_audit_logs
                    (entry_id, company_id, action_type, action_by, old_status, new_status, comment,
                     old_quantity, new_quantity, old_unit, new_unit, old_emissions, new_emissions,
                     old_evidence_path, new_evidence_path)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

                const auditValues = [
                    entryId, companyId, action.toUpperCase(), reviewerId, entry.status, action,
                    notes ? notes.trim() : null, entry.quantity, entry.quantity, entry.unit, entry.unit,
                    entry.calculated_emissions, entry.calculated_emissions,
                    entry.evidence_path, entry.evidence_path
                ];

                connection.query(auditQuery, auditValues, (auditErr) => {
                    if (auditErr) return connection.rollback(() => res.status(500).json({ message: "Unable to save review audit trail." }));

                    const title = action === "Rejected" ? "Emission entry rejected" : "Emission entry approved";
                    const message = action === "Rejected"
                        ? `Entry #${entryId} was rejected. Supervisor comment: ${notes.trim()}`
                        : `Entry #${entryId} was approved.`;

                    const notificationQuery = `
                        INSERT INTO notifications
                        (user_id, company_id, entry_id, notification_type, title, message)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `;

                    connection.query(notificationQuery, [
                        entry.user_id, companyId, entryId,
                        action === "Rejected" ? "ENTRY_REJECTED" : "ENTRY_APPROVED",
                        title, message
                    ], (notificationErr) => {
                        if (notificationErr) return connection.rollback(() => res.status(500).json({ message: "Unable to create notification." }));

                        connection.commit((commitErr) => {
                            if (commitErr) return connection.rollback(() => res.status(500).json({ message: "Unable to complete review." }));
                            res.json({ message: `Entry ${action.toLowerCase()} successfully.` });
                        });
                    });
                });
            });
        });
    });
});


// =====================================================
// NOTIFICATIONS
// =====================================================

app.get("/api/notifications", requireLogin, (req, res) => {
    connection.query(
        `SELECT id, entry_id, notification_type, title, message, is_read, created_at, read_at
         FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`,
        [req.session.user.id],
        (err, rows) => {
            if (err) return res.status(500).json({ message: "Unable to load notifications." });
            res.json(rows);
        }
    );
});

app.put("/api/notifications/:id/read", requireLogin, (req, res) => {
    connection.query(
        `UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ? AND user_id = ?`,
        [req.params.id, req.session.user.id],
        (err, result) => {
            if (err) return res.status(500).json({ message: "Unable to mark notification as read." });
            if (!result.affectedRows) return res.status(404).json({ message: "Notification not found." });
            res.json({ message: "Notification marked as read." });
        }
    );
});

app.put("/api/notifications/read-all", requireLogin, (req, res) => {
    connection.query(
        `UPDATE notifications SET is_read = 1, read_at = NOW() WHERE user_id = ? AND is_read = 0`,
        [req.session.user.id],
        (err) => {
            if (err) return res.status(500).json({ message: "Unable to mark notifications as read." });
            res.json({ message: "All notifications marked as read." });
        }
    );
});


// =====================================================
// EMISSION FACTORS - VSC ADMIN MANAGEMENT
// =====================================================

app.get("/api/emission-factors", requireRole("vsc_admin"), (req, res) => {
    const query = `
        SELECT
            id, scope, category, source_name,
            factor_source, factor_value, factor_unit,
            quantity_unit, effective_year, is_active,
            created_at, updated_at
        FROM emission_factors
        ORDER BY scope ASC, category ASC, source_name ASC
    `;

    connection.query(query, (err, results) => {
        if (err) {
            console.log("Emission Factors API Error:", err);
            return res.status(500).json({ message: "Unable to load emission factors." });
        }
        res.json(results);
    });
});


app.get("/api/data-collector/emission-factors", requireRole("data_collector"), (req, res) => {
    const scope = req.query.scope;

    let query = `
        SELECT
            id, scope, category,
            level1, level2, level3, level4,
            source_name, factor_source,
            factor_value, factor_unit, quantity_unit,
            effective_year
        FROM emission_factors
        WHERE is_active = 1
    `;

    const values = [];

    if (scope) {
        query += " AND scope = ?";
        values.push(scope);
    }

    query += `
        ORDER BY
            factor_source ASC,
            category ASC,
            level1 ASC,
            level2 ASC,
            level3 ASC,
            level4 ASC,
            source_name ASC
    `;

    connection.query(query, values, (err, results) => {
        if (err) {
            console.log("Data Collector Factors API Error:", err);
            return res.status(500).json({ message: "Unable to load emission factors." });
        }
        res.json(results);
    });
});


app.post("/api/emission-factors", requireRole("vsc_admin"), (req, res) => {
    const {
        scope, category, source_name, factor_source,
        factor_value, factor_unit, quantity_unit, effective_year
    } = req.body;

    if (!scope || !category || !source_name || !factor_source || !factor_value || !factor_unit || !quantity_unit) {
        return res.status(400).json({ message: "Please provide all required emission factor fields." });
    }

    const query = `
        INSERT INTO emission_factors
        (scope, category, source_name, factor_source, factor_value, factor_unit, quantity_unit, effective_year)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        scope, category, source_name, factor_source,
        parseFloat(factor_value), factor_unit, quantity_unit, effective_year || null
    ];

    connection.query(query, values, (err, result) => {
        if (err) {
            console.log("Create Emission Factor Error:", err);
            if (err.code === "ER_DUP_ENTRY") {
                return res.status(409).json({ message: "This exact factor already exists." });
            }
            return res.status(500).json({ message: "Unable to create emission factor." });
        }
        res.status(201).json({ message: "Emission factor created successfully.", id: result.insertId });
    });
});


app.put("/api/emission-factors/:id", requireRole("vsc_admin"), (req, res) => {
    const factorId = req.params.id;

    const {
        scope, category, source_name, factor_source,
        factor_value, factor_unit, quantity_unit, effective_year, is_active
    } = req.body;

    const query = `
        UPDATE emission_factors
        SET scope = ?, category = ?, source_name = ?, factor_source = ?,
            factor_value = ?, factor_unit = ?, quantity_unit = ?,
            effective_year = ?, is_active = ?
        WHERE id = ?
    `;

    const values = [
        scope, category, source_name, factor_source,
        parseFloat(factor_value), factor_unit, quantity_unit,
        effective_year || null, is_active !== undefined ? is_active : 1,
        factorId
    ];

    connection.query(query, values, (err, result) => {
        if (err) {
            console.log("Update Emission Factor Error:", err);
            if (err.code === "ER_DUP_ENTRY") {
                return res.status(409).json({ message: "This exact factor already exists." });
            }
            return res.status(500).json({ message: "Unable to update emission factor." });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Emission factor not found." });
        }
        res.json({ message: "Emission factor updated successfully." });
    });
});


app.delete("/api/emission-factors/:id", requireRole("vsc_admin"), (req, res) => {
    const factorId = req.params.id;

    connection.query(`DELETE FROM emission_factors WHERE id = ?`, [factorId], (err, result) => {
        if (err) {
            console.log("Delete Emission Factor Error:", err);
            return res.status(500).json({ message: "Unable to delete emission factor." });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Emission factor not found." });
        }
        res.json({ message: "Emission factor deleted successfully." });
    });
});


// =====================================================
// DATA COLLECTOR
// GET USER DETAILS + COMPANY PLANTS
// =====================================================

app.get("/api/data-collector/setup", requireRole("data_collector"), (req, res) => {
    const userId = req.session.user.id;

    const userQuery = `
        SELECT u.id, u.name, u.email, u.company_id, c.company_name, c.company_code
        FROM users u
        JOIN companies c ON c.id = u.company_id
        WHERE u.id = ? AND u.role = 'data_collector' AND u.is_active = 1
        LIMIT 1
    `;

    connection.query(userQuery, [userId], (userError, userResults) => {
        if (userError) {
            console.log(userError);
            return res.status(500).json({ message: "Unable to load collector." });
        }

        if (userResults.length === 0) {
            return res.status(404).json({ message: "Data collector not found." });
        }

        const user = userResults[0];

        const plantsQuery = `
            SELECT id, plant_code, plant_name, city, state, country
            FROM plants
            WHERE company_id = ?
            ORDER BY plant_name ASC
        `;

        connection.query(plantsQuery, [user.company_id], (plantsError, plantResults) => {
            if (plantsError) {
                return res.status(500).json({ message: "Unable to load company plants." });
            }

            res.json({
                collector: { id: user.id, name: user.name, email: user.email },
                company: { id: user.company_id, company_name: user.company_name, company_code: user.company_code },
                plants: plantResults
            });
        });
    });
});


// =====================================================
// DATA COLLECTOR SUBMISSIONS
// =====================================================

app.get("/api/data-collector/submissions", requireRole("data_collector"), (req, res) => {
    const userId = req.session.user.id;

    const query = `
        SELECT
            e.id, e.scope, e.reporting_period, e.activity_category, e.source_name,
            e.quantity, e.unit, e.calculated_emissions, e.evidence_path, e.status,
            e.review_notes, e.created_at,
            p.plant_name, p.plant_code
        FROM emission_entries e
        LEFT JOIN plants p ON p.id = e.plant_id
        WHERE e.user_id = ?
        ORDER BY e.created_at DESC
    `;

    connection.query(query, [userId], (err, results) => {
        if (err) {
            console.log("Submissions API Error:", err);
            return res.status(500).json({ message: "Unable to load submissions." });
        }
        res.json(results);
    });
});


// =====================================================
// DATA COLLECTOR - DELETE OWN PENDING/REJECTED ENTRY
// =====================================================

app.delete(
    "/api/data-collector/submissions/:id",
    requireRole("data_collector"),
    (req, res) => {
        const entryId = Number(req.params.id);
        const userId = req.session.user.id;
        const companyId = req.session.user.company_id;

        if (!Number.isInteger(entryId) || entryId <= 0) {
            return res.status(400).json({ message: "Invalid entry ID." });
        }

        connection.beginTransaction((txErr) => {
            if (txErr) return res.status(500).json({ message: "Unable to start delete transaction." });

            connection.query(
                `SELECT id, status, evidence_path FROM emission_entries
                 WHERE id = ? AND user_id = ? AND company_id = ? FOR UPDATE`,
                [entryId, userId, companyId],
                (selectErr, rows) => {
                    if (selectErr) return connection.rollback(() => res.status(500).json({ message: "Unable to verify entry." }));
                    if (!rows.length) return connection.rollback(() => res.status(404).json({ message: "Entry not found." }));

                    const entry = rows[0];
                    if (!["Pending", "Rejected"].includes(entry.status)) {
                        return connection.rollback(() => res.status(409).json({ message: "Only Pending or Rejected entries can be deleted." }));
                    }

                    connection.query(`DELETE FROM notifications WHERE entry_id = ?`, [entryId], (notifErr) => {
                        if (notifErr) return connection.rollback(() => res.status(500).json({ message: "Unable to remove entry notifications." }));

                        connection.query(
                            `DELETE FROM emission_entries WHERE id = ? AND user_id = ? AND company_id = ?`,
                            [entryId, userId, companyId],
                            (deleteErr, result) => {
                                if (deleteErr) return connection.rollback(() => res.status(500).json({ message: "Unable to delete entry." }));
                                if (!result.affectedRows) return connection.rollback(() => res.status(404).json({ message: "Entry not found." }));

                                connection.commit((commitErr) => {
                                    if (commitErr) return connection.rollback(() => res.status(500).json({ message: "Unable to complete deletion." }));

                                    if (entry.evidence_path) {
                                        const relativePath = entry.evidence_path.replace(/^\/+/, "");
                                        const absolutePath = path.join(__dirname, relativePath);
                                        fs.unlink(absolutePath, (fileErr) => {
                                            if (fileErr && fileErr.code !== "ENOENT") console.log("Evidence Delete Error:", fileErr);
                                        });
                                    }

                                    return res.json({ message: "Entry deleted successfully." });
                                });
                            }
                        );
                    });
                }
            );
        });
    }
);


// =====================================================
// CORRECT + RESUBMIT REJECTED ENTRY
// =====================================================

app.put(
    "/api/data-collector/submissions/:id/resubmit",
    requireRole("data_collector"),
    upload.single("evidence"),
    (req, res) => {
        const entryId = Number(req.params.id);
        const userId = req.session.user.id;
        const companyId = req.session.user.company_id;
        const { quantity, unit } = req.body;

        const cleanupUploadedFile = () => {
            if (req.file) fs.unlink(req.file.path, () => {});
        };

        if (quantity === undefined || quantity === "" || !unit) {
            cleanupUploadedFile();
            return res.status(400).json({ message: "Quantity and unit are required." });
        }

        connection.beginTransaction((txErr) => {
            if (txErr) { cleanupUploadedFile(); return res.status(500).json({ message: "Unable to start resubmission." }); }

            connection.query(
                `SELECT * FROM emission_entries WHERE id = ? AND user_id = ? AND company_id = ? FOR UPDATE`,
                [entryId, userId, companyId],
                (entryErr, entries) => {
                    if (entryErr || entries.length === 0) {
                        cleanupUploadedFile();
                        return connection.rollback(() => res.status(entries && entries.length === 0 ? 404 : 500).json({ message: "Rejected entry not found." }));
                    }

                    const oldEntry = entries[0];
                    if (oldEntry.status !== "Rejected") {
                        cleanupUploadedFile();
                        return connection.rollback(() => res.status(409).json({ message: "Only Rejected entries can be corrected and resubmitted." }));
                    }

                    connection.query(
                        `SELECT id, scope, category, source_name, factor_value, factor_unit, quantity_unit
                         FROM emission_factors
                         WHERE scope = ? AND category = ? AND source_name = ? AND factor_value = ? AND is_active = 1
                         ORDER BY effective_year DESC LIMIT 1`,
                        [oldEntry.scope, oldEntry.activity_category, oldEntry.source_name, oldEntry.emission_factor],
                        (factorErr, factors) => {
                            if (factorErr || factors.length === 0) {
                                cleanupUploadedFile();
                                return connection.rollback(() => res.status(400).json({ message: "Selected emission factor is invalid or inactive." }));
                            }

                            const factor = factors[0];
                            if (factor.scope !== oldEntry.scope || factor.category !== oldEntry.activity_category) {
                                cleanupUploadedFile();
                                return connection.rollback(() => res.status(400).json({ message: "Factor does not match the original scope/category." }));
                            }

                            let calculatedEmissions;
                            try {
                                calculatedEmissions = convertToBaseUnit(quantity, unit, factor.quantity_unit) * Number(factor.factor_value);
                                if (!Number.isFinite(calculatedEmissions)) throw new Error("Emission calculation failed.");
                            } catch (e) {
                                cleanupUploadedFile();
                                return connection.rollback(() => res.status(400).json({ message: e.message }));
                            }

                            const newEvidencePath = req.file ? `/uploads/${req.file.filename}` : oldEntry.evidence_path;
                            const updateQuery = `
                                UPDATE emission_entries
                                SET quantity = ?, unit = ?, source_name = ?, emission_factor = ?, calculated_emissions = ?,
                                    evidence_path = ?, status = 'Pending', reviewed_by = NULL, reviewed_at = NULL,
                                    review_notes = NULL, resubmission_count = resubmission_count + 1,
                                    last_resubmitted_at = NOW()
                                WHERE id = ? AND user_id = ? AND company_id = ?
                            `;

                            connection.query(updateQuery, [
                                Number(quantity), unit, factor.source_name, Number(factor.factor_value), calculatedEmissions,
                                newEvidencePath, entryId, userId, companyId
                            ], (updateErr) => {
                                if (updateErr) { cleanupUploadedFile(); return connection.rollback(() => res.status(500).json({ message: "Unable to update rejected entry." })); }

                                const auditQuery = `
                                    INSERT INTO emission_entry_audit_logs
                                    (entry_id, company_id, action_type, action_by, old_status, new_status, comment,
                                     old_quantity, new_quantity, old_unit, new_unit, old_emissions, new_emissions,
                                     old_evidence_path, new_evidence_path)
                                    VALUES (?, ?, 'RESUBMITTED', ?, 'Rejected', 'Pending', ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                `;

                                connection.query(auditQuery, [
                                    entryId, companyId, userId, "Collector corrected and resubmitted the entry.",
                                    oldEntry.quantity, Number(quantity), oldEntry.unit, unit,
                                    oldEntry.calculated_emissions, calculatedEmissions,
                                    oldEntry.evidence_path, newEvidencePath
                                ], (auditErr) => {
                                    if (auditErr) { cleanupUploadedFile(); return connection.rollback(() => res.status(500).json({ message: "Unable to save resubmission history." })); }

                                    const supervisorsQuery = `SELECT id FROM users WHERE company_id = ? AND role = 'supervisor' AND is_active = 1`;
                                    connection.query(supervisorsQuery, [companyId], (supErr, supervisors) => {
                                        if (supErr) { cleanupUploadedFile(); return connection.rollback(() => res.status(500).json({ message: "Unable to notify supervisors." })); }

                                        if (!supervisors.length) return finishCommit();

                                        const values = supervisors.map(sup => [
                                            sup.id, companyId, entryId, "ENTRY_RESUBMITTED",
                                            "Emission entry resubmitted", `Entry #${entryId} has been corrected and resubmitted for review.`
                                        ]);

                                        connection.query(
                                            `INSERT INTO notifications (user_id, company_id, entry_id, notification_type, title, message) VALUES ?`,
                                            [values],
                                            (notifErr) => {
                                                if (notifErr) { cleanupUploadedFile(); return connection.rollback(() => res.status(500).json({ message: "Unable to create supervisor notifications." })); }
                                                finishCommit();
                                            }
                                        );
                                    });

                                    function finishCommit() {
                                        connection.commit((commitErr) => {
                                            if (commitErr) { cleanupUploadedFile(); return connection.rollback(() => res.status(500).json({ message: "Unable to complete resubmission." })); }
                                            res.json({ message: "Entry corrected and resubmitted successfully.", entry_id: entryId, status: "Pending", calculated_emissions: calculatedEmissions });
                                        });
                                    }
                                });
                            });
                        }
                    );
                }
            );
        });
    }
);


// =====================================================
// UNIT CONVERSION FOR NORMALIZED CO2e FACTORS
// Converts user-entered quantity into the factor's quantity_unit.
// =====================================================

function convertToBaseUnit(quantity, inputUnit, baseUnit) {
    const q = Number(quantity);

    if (!Number.isFinite(q) || q < 0) {
        throw new Error("Invalid quantity.");
    }

    if (!inputUnit || !baseUnit) {
        throw new Error("Input unit and factor base unit are required.");
    }

    if (inputUnit === baseUnit) {
        return q;
    }

    const conversions = {
        "litre->gallon": 1 / 3.785411784,
        "m3->gallon": 1000 / 3.785411784,

        "kWh->MWh": 0.001,
        "GWh->MWh": 1000,

        "Btu->mmBtu": 0.000001,
        "kWh->mmBtu": 0.003412141633,
        "MWh->mmBtu": 3.412141633,

        "kg->short ton": 1 / 907.18474,
        "tonne->short ton": 1000 / 907.18474,

        "vehicle-km->vehicle-mile": 1 / 1.609344,
        "passenger-km->passenger-mile": 1 / 1.609344,

        "tonne-km->short ton-mile": 0.684944,

        "Nm3->scf": 37.3267
    };

    const key = `${inputUnit}->${baseUnit}`;
    const multiplier = conversions[key];

    if (multiplier === undefined) {
        throw new Error(`Unsupported unit conversion: ${inputUnit} to ${baseUnit}`);
    }

    return q * multiplier;
}


// =====================================================
// CREATE EMISSION ENTRY WITH EVIDENCE
// Status now defaults to 'Pending' (awaiting supervisor review)
// =====================================================

app.post(
    "/api/emission-entries",
    requireRole("data_collector"),
    upload.single("evidence"),
    (req, res) => {
        const {
            plant_id,
            scope,
            reporting_period,
            activity_category,
            quantity,
            unit,
            emission_factor_id
        } = req.body;

        const userId = req.session.user.id;
        const companyId = req.session.user.company_id;

        const cleanupUploadedFile = () => {
            if (req.file) {
                fs.unlink(req.file.path, () => {});
            }
        };

        if (
            !plant_id ||
            !scope ||
            !reporting_period ||
            !activity_category ||
            quantity === undefined ||
            quantity === "" ||
            !unit ||
            !emission_factor_id
        ) {
            cleanupUploadedFile();
            return res.status(400).json({
                message: "Please complete all required emission entry fields."
            });
        }

        const plantCheckQuery = `
            SELECT id
            FROM plants
            WHERE id = ? AND company_id = ?
            LIMIT 1
        `;

        connection.query(
            plantCheckQuery,
            [plant_id, companyId],
            (plantError, plantResults) => {
                if (plantError) {
                    console.log("Plant Verification Error:", plantError);
                    cleanupUploadedFile();
                    return res.status(500).json({
                        message: "Unable to verify plant."
                    });
                }

                if (plantResults.length === 0) {
                    cleanupUploadedFile();
                    return res.status(403).json({
                        message: "This plant does not belong to the collector's company."
                    });
                }

                const factorQuery = `
                    SELECT
                        id, scope, category, source_name,
                        factor_value, factor_unit, quantity_unit
                    FROM emission_factors
                    WHERE id = ? AND is_active = 1
                    LIMIT 1
                `;

                connection.query(
                    factorQuery,
                    [emission_factor_id],
                    (factorError, factorResults) => {
                        if (factorError) {
                            console.log("Factor Verification Error:", factorError);
                            cleanupUploadedFile();
                            return res.status(500).json({
                                message: "Unable to verify emission factor."
                            });
                        }

                        if (factorResults.length === 0) {
                            cleanupUploadedFile();
                            return res.status(400).json({
                                message: "Selected emission factor is invalid or inactive."
                            });
                        }

                        const factor = factorResults[0];

                        if (factor.scope !== scope || factor.category !== activity_category) {
                            cleanupUploadedFile();
                            return res.status(400).json({
                                message: "Selected factor does not match the selected scope/category."
                            });
                        }

                        let baseQuantity;
                        let calculatedEmissions;

                        try {
                            baseQuantity = convertToBaseUnit(
                                quantity,
                                unit,
                                factor.quantity_unit
                            );

                            calculatedEmissions =
                                baseQuantity * Number(factor.factor_value);

                            if (!Number.isFinite(calculatedEmissions)) {
                                throw new Error("Emission calculation failed.");
                            }
                        } catch (calculationError) {
                            cleanupUploadedFile();
                            return res.status(400).json({
                                message: calculationError.message
                            });
                        }

                        const evidencePath = req.file
                            ? `/uploads/${req.file.filename}`
                            : null;

                        const insertQuery = `
                            INSERT INTO emission_entries
                            (
                                company_id,
                                plant_id,
                                user_id,
                                scope,
                                reporting_period,
                                activity_category,
                                source_name,
                                quantity,
                                unit,
                                emission_factor,
                                calculated_emissions,
                                evidence_path,
                                status
                            )
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
                        `;

                        const values = [
                            companyId,
                            plant_id,
                            userId,
                            scope,
                            reporting_period,
                            activity_category,
                            factor.source_name,
                            Number(quantity),
                            unit,
                            Number(factor.factor_value),
                            calculatedEmissions,
                            evidencePath
                        ];

                        connection.query(
                            insertQuery,
                            values,
                            (insertError, result) => {
                                if (insertError) {
                                    console.log("Emission Insert Error:", insertError);
                                    cleanupUploadedFile();
                                    return res.status(500).json({
                                        message: "Unable to save emission entry."
                                    });
                                }

                                const entryId = result.insertId;

                                connection.query(
                                    `INSERT INTO emission_entry_audit_logs
                                     (entry_id, company_id, action_type, action_by, old_status, new_status,
                                      new_quantity, new_unit, new_emissions, new_evidence_path)
                                     VALUES (?, ?, 'CREATED', ?, NULL, 'Pending', ?, ?, ?, ?)`,
                                    [entryId, companyId, userId, Number(quantity), unit, calculatedEmissions, evidencePath],
                                    (auditError) => {
                                        if (auditError) console.log("Create Audit Error:", auditError);

                                        connection.query(
                                            `SELECT id FROM users WHERE company_id = ? AND role = 'supervisor' AND is_active = 1`,
                                            [companyId],
                                            (supervisorError, supervisors) => {
                                                if (!supervisorError && supervisors.length) {
                                                    const notificationValues = supervisors.map(sup => [
                                                        sup.id, companyId, entryId, 'ENTRY_SUBMITTED',
                                                        'New emission entry submitted',
                                                        `Entry #${entryId} is waiting for review.`
                                                    ]);
                                                    connection.query(
                                                        `INSERT INTO notifications
                                                         (user_id, company_id, entry_id, notification_type, title, message)
                                                         VALUES ?`,
                                                        [notificationValues],
                                                        (notificationError) => {
                                                            if (notificationError) console.log("Submission Notification Error:", notificationError);
                                                        }
                                                    );
                                                }
                                            }
                                        );

                                        return res.status(201).json({
                                            message: "Emission entry submitted successfully. Awaiting supervisor review.",
                                            entry_id: entryId,
                                            evidence_path: evidencePath,
                                            calculated_emissions: calculatedEmissions,
                                            factor_unit: factor.factor_unit,
                                            factor_quantity_unit: factor.quantity_unit
                                        });
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    }
);


// =====================================================
// MULTER ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: err.message });
    }

    if (err && err.message === "Only PDF, PNG, JPG and JPEG files are allowed.") {
        return res.status(400).json({ message: err.message });
    }

    next(err);
});


// =====================================================
// 404
// =====================================================

app.use((req, res) => {
    res.status(404).send("Page Not Found");
});


// =====================================================
// SERVER
// =====================================================

app.listen(8080, () => {
    console.log("Server running on http://localhost:8080");
});