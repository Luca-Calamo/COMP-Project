require('dotenv').config();
const pool = require('./config/db');

async function initializeDatabase() {
    try {
        // Create users table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✓ Users table created');

        // Create recipes table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS recipes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        difficulty VARCHAR(50),
        prep_time INTEGER,
        cook_time INTEGER,
        total_time INTEGER,
        serves INTEGER,
        recipe_link VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✓ Recipes table created');

        // Create ingredients table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS ingredients (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        quantity DECIMAL(10, 2),
        unit VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✓ Ingredients table created');

        // Create instructions table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS instructions (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        step_number INTEGER NOT NULL,
        instruction TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✓ Instructions table created');

        // Create tags table (for difficulty filtering)
        await pool.query(`
      CREATE TABLE IF NOT EXISTS recipe_tags (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        tag VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✓ Recipe tags table created');

        // Create session table for connect-pg-simple
        await pool.query(`
      CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR NOT NULL COLLATE "default" PRIMARY KEY,
        sess JSON NOT NULL,
        expire TIMESTAMP NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_session_expire ON session (expire);
    `);
        console.log('✓ Session table created');

        console.log('\n✅ Database initialization complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database initialization error:', error);
        process.exit(1);
    }
}

initializeDatabase();
