const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const pool = require('../config/db');
const {isAuthenticated, isNotAuthenticated} = require('../middleware/auth');

// GET login page
router.get('/login', isNotAuthenticated, (req, res) => {
    res.render('login');
});

// POST login
router.post('/login', isNotAuthenticated, async (req, res) => {
    const {email, password} = req.body;

    try {
        if (!email || !password) {
            return res.render('login', {
                message: 'Please provide email and password',
            });
        }

        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email],
        );

        if (result.rows.length === 0) {
            return res.render('login', {
                message: 'Email or password is incorrect',
            });
        }

        const user = result.rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.render('login', {
                message: 'Email or password is incorrect',
            });
        }

        req.session.userId = user.id;
        req.session.email = user.email;

        res.redirect('/dashboard');
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', {message: 'An error occurred during login'});
    }
});

// GET signup page
router.get('/signup', isNotAuthenticated, (req, res) => {
    res.render('signup');
});

// POST signup
router.post('/signup', isNotAuthenticated, async (req, res) => {
    const {email, password, passwordConfirm} = req.body;

    try {
        if (!email || !password || !passwordConfirm) {
            return res.render('signup', {message: 'Please provide all fields'});
        }

        if (password !== passwordConfirm) {
            return res.render('signup', {message: 'Passwords do not match'});
        }

        const result = await pool.query(
            'SELECT email FROM users WHERE email = $1',
            [email],
        );

        if (result.rows.length > 0) {
            return res.render('signup', {message: 'Email already in use'});
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            'INSERT INTO users (email, password) VALUES ($1, $2)',
            [email, hashedPassword],
        );

        return res.render('signup', {message: 'User registered successfully!'});
    } catch (error) {
        console.error('Signup error:', error);
        res.render('signup', {message: 'An error occurred during signup'});
    }
});

// GET logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.send('Error logging out');
        }
        res.redirect('/');
    });
});

module.exports = router;
