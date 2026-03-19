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

        // Insert sample user
        const userResult = await pool.query(`
      INSERT INTO users (email, password) 
      VALUES ($1, $2) 
      ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
      RETURNING id;
    `, ['dannyslangs@gmail.com', 'abc']);
        const userId = userResult.rows[0].id;
        console.log('✓ Sample user created');

        // Insert sample recipes
        const recipes = [
            {
                name: 'Classic Spaghetti Carbonara',
                difficulty: 'Medium',
                prep_time: 10,
                cook_time: 20,
                serves: 4,
                recipe_link: 'https://example.com/carbonara'
            },
            {
                name: 'Chocolate Chip Cookies',
                difficulty: 'Easy',
                prep_time: 15,
                cook_time: 12,
                serves: 24,
                recipe_link: 'https://example.com/cookies'
            },
            {
                name: 'Beef Tacos',
                difficulty: 'Easy',
                prep_time: 15,
                cook_time: 10,
                serves: 4,
                recipe_link: 'https://example.com/tacos'
            },
            {
                name: 'Chicken Tikka Masala',
                difficulty: 'Hard',
                prep_time: 30,
                cook_time: 45,
                serves: 6,
                recipe_link: 'https://example.com/tikka'
            }
        ];

        const recipeIds = [];
        for (const recipe of recipes) {
            const result = await pool.query(`
        INSERT INTO recipes (user_id, name, difficulty, prep_time, cook_time, total_time, serves, recipe_link)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id;
      `, [userId, recipe.name, recipe.difficulty, recipe.prep_time, recipe.cook_time,
                recipe.prep_time + recipe.cook_time, recipe.serves, recipe.recipe_link]);
            recipeIds.push(result.rows[0].id);
        }
        console.log('✓ Sample recipes created');

        // Insert ingredients for Spaghetti Carbonara
        const carbonaraIngredients = [
            { ingredient: 'Spaghetti', quantity: 400, unit: 'g' },
            { ingredient: 'Eggs', quantity: 4, unit: 'whole' },
            { ingredient: 'Pancetta', quantity: 200, unit: 'g' },
            { ingredient: 'Parmesan Cheese', quantity: 100, unit: 'g' },
            { ingredient: 'Black Pepper', quantity: 1, unit: 'tsp' }
        ];
        for (const ing of carbonaraIngredients) {
            await pool.query(`
        INSERT INTO ingredients (recipe_id, name, quantity, unit)
        VALUES ($1, $2, $3, $4)
      `, [recipeIds[0], ing.ingredient, ing.quantity, ing.unit]);
        }

        // Insert ingredients for Chocolate Chip Cookies
        const cookieIngredients = [
            { ingredient: 'Flour', quantity: 2.25, unit: 'cups' },
            { ingredient: 'Butter', quantity: 1, unit: 'cup' },
            { ingredient: 'Brown Sugar', quantity: 0.75, unit: 'cup' },
            { ingredient: 'White Sugar', quantity: 0.75, unit: 'cup' },
            { ingredient: 'Eggs', quantity: 2, unit: 'whole' },
            { ingredient: 'Vanilla Extract', quantity: 1, unit: 'tsp' },
            { ingredient: 'Chocolate Chips', quantity: 2, unit: 'cups' }
        ];
        for (const ing of cookieIngredients) {
            await pool.query(`
        INSERT INTO ingredients (recipe_id, name, quantity, unit)
        VALUES ($1, $2, $3, $4)
      `, [recipeIds[1], ing.ingredient, ing.quantity, ing.unit]);
        }

        // Insert ingredients for Beef Tacos
        const tacoIngredients = [
            { ingredient: 'Ground Beef', quantity: 1, unit: 'lb' },
            { ingredient: 'Taco Shells', quantity: 12, unit: 'whole' },
            { ingredient: 'Lettuce', quantity: 2, unit: 'cups' },
            { ingredient: 'Tomato', quantity: 2, unit: 'whole' },
            { ingredient: 'Cheddar Cheese', quantity: 1, unit: 'cup' },
            { ingredient: 'Sour Cream', quantity: 0.5, unit: 'cup' }
        ];
        for (const ing of tacoIngredients) {
            await pool.query(`
        INSERT INTO ingredients (recipe_id, name, quantity, unit)
        VALUES ($1, $2, $3, $4)
      `, [recipeIds[2], ing.ingredient, ing.quantity, ing.unit]);
        }

        // Insert ingredients for Chicken Tikka Masala
        const tikkaIngredients = [
            { ingredient: 'Chicken Breast', quantity: 2, unit: 'lb' },
            { ingredient: 'Yogurt', quantity: 1, unit: 'cup' },
            { ingredient: 'Tikka Masala Spice', quantity: 3, unit: 'tbsp' },
            { ingredient: 'Coconut Milk', quantity: 1, unit: 'can' },
            { ingredient: 'Tomato Sauce', quantity: 1, unit: 'can' },
            { ingredient: 'Garlic', quantity: 4, unit: 'cloves' },
            { ingredient: 'Ginger', quantity: 1, unit: 'tbsp' }
        ];
        for (const ing of tikkaIngredients) {
            await pool.query(`
        INSERT INTO ingredients (recipe_id, name, quantity, unit)
        VALUES ($1, $2, $3, $4)
      `, [recipeIds[3], ing.ingredient, ing.quantity, ing.unit]);
        }
        console.log('✓ Sample ingredients created');

        // Insert instructions for Spaghetti Carbonara
        const carbonaraSteps = [
            'Bring a large pot of salted water to boil and cook spaghetti.',
            'While pasta cooks, fry pancetta until crispy, then set aside.',
            'In a bowl, whisk together eggs and grated Parmesan cheese.',
            'Drain pasta, reserving 1 cup of pasta water.',
            'Toss hot pasta with pancetta, then remove from heat.',
            'Pour egg mixture over pasta and toss quickly, adding pasta water to create creamy sauce.',
            'Season with black pepper and serve immediately.'
        ];
        for (let i = 0; i < carbonaraSteps.length; i++) {
            await pool.query(`
        INSERT INTO instructions (recipe_id, step_number, instruction)
        VALUES ($1, $2, $3)
      `, [recipeIds[0], i + 1, carbonaraSteps[i]]);
        }

        // Insert instructions for Chocolate Chip Cookies
        const cookieSteps = [
            'Preheat oven to 375°F.',
            'In a large bowl, cream together butter and sugars.',
            'Beat in eggs one at a time, then add vanilla extract.',
            'In a separate bowl, combine flour, baking soda, and salt.',
            'Gradually blend the dry mixture into the creamed mixture.',
            'Stir in chocolate chips.',
            'Drop spoonfuls onto ungreased cookie sheets.',
            'Bake for 9-12 minutes or until golden brown.'
        ];
        for (let i = 0; i < cookieSteps.length; i++) {
            await pool.query(`
        INSERT INTO instructions (recipe_id, step_number, instruction)
        VALUES ($1, $2, $3)
      `, [recipeIds[1], i + 1, cookieSteps[i]]);
        }

        // Insert instructions for Beef Tacos
        const tacoSteps = [
            'Brown ground beef in a skillet over medium heat.',
            'Add taco seasoning and water, simmer for 5 minutes.',
            'Warm taco shells according to package directions.',
            'Chop lettuce and tomato into small pieces.',
            'Grate cheddar cheese.',
            'Fill taco shells with cooked beef.',
            'Top with lettuce, tomato, cheese, and sour cream.',
            'Serve immediately.'
        ];
        for (let i = 0; i < tacoSteps.length; i++) {
            await pool.query(`
        INSERT INTO instructions (recipe_id, step_number, instruction)
        VALUES ($1, $2, $3)
      `, [recipeIds[2], i + 1, tacoSteps[i]]);
        }

        // Insert instructions for Chicken Tikka Masala
        const tikkaSteps = [
            'Marinate chicken in yogurt and tikka masala spice for at least 30 minutes.',
            'Heat oil in a large pan and cook marinated chicken until done, set aside.',
            'In the same pan, sauté garlic and ginger.',
            'Add tomato sauce and cook for 2-3 minutes.',
            'Stir in coconut milk and bring to simmer.',
            'Return chicken to the pan and simmer for 10 minutes.',
            'Taste and adjust seasonings as needed.',
            'Serve over rice or with naan bread.'
        ];
        for (let i = 0; i < tikkaSteps.length; i++) {
            await pool.query(`
        INSERT INTO instructions (recipe_id, step_number, instruction)
        VALUES ($1, $2, $3)
      `, [recipeIds[3], i + 1, tikkaSteps[i]]);
        }
        console.log('✓ Sample instructions created');

        console.log('\n✅ Database initialization complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database initialization error:', error);
        process.exit(1);
    }
}

initializeDatabase();
