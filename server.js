const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const SECRET_KEY = 'your_secret_key';

// Set up SQLite database
const dbPath = path.resolve(__dirname, 'mydatabase.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err);
    } else {
        console.log('Connected to the SQLite database');
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                password TEXT
            )`, (err) => {
            if (err) {
                console.error('Error creating users table', err);
            } else {
                console.log('Users table ready');
            }
        });
    }
});

// Register route
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) return res.status(500).json({ error: 'Hashing error' });

        db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashedPassword], function (err) {
            if (err) {
                return res.status(400).json({ error: 'User already exists' });
            }
            res.json({ message: 'User registered successfully' });
        });
    });
});

// Login route
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
        if (err || !user) return res.status(400).json({ error: 'Invalid credentials' });

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) return res.status(500).json({ error: 'Comparison error' });
            if (isMatch) {
                const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: '1h' });
                res.json({ message: 'Login successful', token });
            } else {
                res.status(400).json({ error: 'Invalid credentials' });
            }
        });
    });
});

app.post('/sales', (req, res) => {
    const { category, subcategory, paint_name, liters, customer_name, mobile_number, pc_id, sale_date } = req.body;

    // Validate required fields
    if (!category || !subcategory || !paint_name || !liters || !customer_name || !mobile_number || !pc_id) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Insert into database (assuming you’re using a database connection)
    // Example for SQL insert, using a placeholder variable db for the database connection
    db.query(
        'INSERT INTO Sales (category, subcategory, paint_name, liters, customer_name, mobile_number, pc_id, sale_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [category, subcategory, paint_name, liters, customer_name, mobile_number, pc_id, new Date()],
        (error, results) => {
            if (error) {
                console.error('Error inserting sales data:', error);
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ message: 'Sales data inserted successfully' });
        }
    );
});


// Start server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
