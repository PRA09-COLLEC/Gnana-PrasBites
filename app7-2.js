const express = require("express");
const mysql = require("mysql2");
const path = require("path");

const app = express();
const PORT = 3000;

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ==========================================
// MYSQL CONNECTION
// ==========================================
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Swamuluroot",
    database: "foody"
});

db.connect((err) => {
    if (err) {
        console.error("MySQL connection failed:", err.message);
        return;
    }

    console.log("Connected to MySQL database: foody");
});

// ==========================================
// HELPER: VALIDATE FOOD ID
// ==========================================
function validateId(req, res, next) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid food ID"
        });
    }

    req.foodId = id;
    next();
}

// ==========================================
// 1. INSERT FOOD
// POST /food
// ==========================================
app.post("/food", (req, res) => {
    const {
        food_name,
        category,
        price,
        description,
        availability
    } = req.body;

    if (
        !food_name ||
        !category ||
        price === undefined ||
        price === "" ||
        availability === undefined ||
        availability === ""
    ) {
        return res.status(400).json({
            success: false,
            message: "Please fill in all required fields."
        });
    }

    const numericPrice = Number(price);
    const numericAvailability = Number(availability);

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
        return res.status(400).json({
            success: false,
            message: "Enter a valid food price."
        });
    }

    if (![0, 1].includes(numericAvailability)) {
        return res.status(400).json({
            success: false,
            message: "Availability must be 1 or 0."
        });
    }

    const sql = `
        INSERT INTO food
        (food_name, category, price, description, availability)
        VALUES (?, ?, ?, ?, ?)
    `;

    const values = [
        food_name.trim(),
        category.trim(),
        numericPrice,
        description || "",
        numericAvailability
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Insert error:", err.message);

            return res.status(500).json({
                success: false,
                message: "Food insertion failed.",
                error: err.message
            });
        }

        res.status(201).json({
            success: true,
            message: "Food inserted successfully!",
            food_id: result.insertId
        });
    });
});

// ==========================================
// 2. LIST ALL FOOD
// GET /food
// ==========================================
app.get("/food", (req, res) => {
    db.query(
        "SELECT * FROM food ORDER BY food_id ASC",
        (err, results) => {
            if (err) {
                console.error("List error:", err.message);

                return res.status(500).json({
                    success: false,
                    message: "Unable to retrieve food items.",
                    error: err.message
                });
            }

            res.json(results);
        }
    );
});

// ==========================================
// 3. LIST ONE FOOD
// GET /food/:id
// ==========================================
app.get("/food/:id", validateId, (req, res) => {
    db.query(
        "SELECT * FROM food WHERE food_id = ?",
        [req.foodId],
        (err, results) => {
            if (err) {
                console.error("Fetch error:", err.message);

                return res.status(500).json({
                    success: false,
                    message: "Unable to retrieve food item.",
                    error: err.message
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Food item not found."
                });
            }

            res.json(results[0]);
        }
    );
});

// ==========================================
// 4. UPDATE FOOD
// PUT /food/:id
// ==========================================
app.put("/food/:id", validateId, (req, res) => {
    const {
        food_name,
        category,
        price,
        description,
        availability
    } = req.body;

    if (
        !food_name ||
        !category ||
        price === undefined ||
        price === "" ||
        availability === undefined ||
        availability === ""
    ) {
        return res.status(400).json({
            success: false,
            message: "Please fill in all required fields."
        });
    }

    const numericPrice = Number(price);
    const numericAvailability = Number(availability);

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
        return res.status(400).json({
            success: false,
            message: "Enter a valid food price."
        });
    }

    if (![0, 1].includes(numericAvailability)) {
        return res.status(400).json({
            success: false,
            message: "Availability must be 1 or 0."
        });
    }

    // Check that the food item exists first.
    db.query(
        "SELECT food_id FROM food WHERE food_id = ?",
        [req.foodId],
        (checkErr, rows) => {
            if (checkErr) {
                console.error("Update check error:", checkErr.message);

                return res.status(500).json({
                    success: false,
                    message: "Unable to check food item.",
                    error: checkErr.message
                });
            }

            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Food item not found."
                });
            }

            const sql = `
                UPDATE food
                SET food_name = ?,
                    category = ?,
                    price = ?,
                    description = ?,
                    availability = ?
                WHERE food_id = ?
            `;

            const values = [
                food_name.trim(),
                category.trim(),
                numericPrice,
                description || "",
                numericAvailability,
                req.foodId
            ];

            db.query(sql, values, (err) => {
                if (err) {
                    console.error("Update error:", err.message);

                    return res.status(500).json({
                        success: false,
                        message: "Food update failed.",
                        error: err.message
                    });
                }

                res.json({
                    success: true,
                    message: "Food item updated successfully!",
                    
                });
            });
        }
    );
});

// ==========================================
// 5. DELETE FOOD
// DELETE /food/:id
// ==========================================
app.delete("/food/:id", validateId, (req, res) => {
    db.query(
        "DELETE FROM food WHERE food_id = ?",
        [req.foodId],
        (err, result) => {
            if (err) {
                console.error("Delete error:", err.message);

                return res.status(500).json({
                    success: false,
                    message: "Food deletion failed.",
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Food item not found."
                });
            }

            res.json({
                success: true,
                message: "Food item deleted successfully!",
            
            });
        }
    );
});

// ==========================================
// HOME PAGE
// ==========================================
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ==========================================
// HANDLE UNKNOWN FOOD API ROUTES
// ==========================================
app.use("/food", (req, res) => {
    res.status(404).json({
        success: false,
        message: "Food API route not found."
    });
});

// ==========================================
// START SERVER
// ==========================================
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});