const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const {isAuthenticated} = require('../middleware/auth');

// GET home page
router.get('/', (req, res) => {
    res.render('index', {isAuthenticated: req.session.userId});
});

// GET dashboard
router.get('/dashboard', isAuthenticated, async (req, res) => {
    try {
        const recipes = await pool.query(
            'SELECT * FROM recipes WHERE user_id = $1 ORDER BY created_at DESC',
            [req.session.userId],
        );

        res.render('dashboard', {
            user: req.session.email,
            recipes: recipes.rows,
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.render('dashboard', {message: 'Error loading recipes'});
    }
});

// GET add recipe page
router.get('/recipe/add', isAuthenticated, (req, res) => {
    res.render('add-recipe');
});

// POST add recipe
router.post('/recipe/add', isAuthenticated, async (req, res) => {
    const {
        name,
        difficulty,
        prepTime,
        cookTime,
        serves,
        recipeLink,
        ingredients,
        instructions,
    } = req.body;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const totalTime = parseInt(prepTime) + parseInt(cookTime);

        // Insert recipe
        const recipeResult = await client.query(
            'INSERT INTO recipes (user_id, name, difficulty, prep_time, cook_time, total_time, serves, recipe_link) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
            [
                req.session.userId,
                name,
                difficulty,
                prepTime,
                cookTime,
                totalTime,
                serves,
                recipeLink,
            ],
        );

        const recipeId = recipeResult.rows[0].id;

        // Insert ingredients
        if (Array.isArray(ingredients) && ingredients.length > 0) {
            for (const ingredient of ingredients) {
                if (ingredient.name) {
                    await client.query(
                        'INSERT INTO ingredients (recipe_id, name, quantity, unit) VALUES ($1, $2, $3, $4)',
                        [
                            recipeId,
                            ingredient.name,
                            ingredient.quantity,
                            ingredient.unit,
                        ],
                    );
                }
            }
        }

        // Insert instructions
        if (Array.isArray(instructions) && instructions.length > 0) {
            for (let i = 0; i < instructions.length; i++) {
                if (instructions[i]) {
                    await client.query(
                        'INSERT INTO instructions (recipe_id, step_number, instruction) VALUES ($1, $2, $3)',
                        [recipeId, i + 1, instructions[i]],
                    );
                }
            }
        }

        await client.query('COMMIT');
        res.redirect('/dashboard');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Add recipe error:', error);
        res.render('add-recipe', {message: 'Error adding recipe'});
    } finally {
        client.release();
    }
});

// GET edit recipe page
router.get('/recipe/edit/:id', isAuthenticated, async (req, res) => {
    const {id} = req.params;

    try {
        const recipe = await pool.query(
            'SELECT * FROM recipes WHERE id = $1 AND user_id = $2',
            [id, req.session.userId],
        );

        if (recipe.rows.length === 0) {
            return res.status(404).render('404');
        }

        const ingredients = await pool.query(
            'SELECT * FROM ingredients WHERE recipe_id = $1 ORDER BY id',
            [id],
        );

        const instructions = await pool.query(
            'SELECT * FROM instructions WHERE recipe_id = $1 ORDER BY step_number',
            [id],
        );

        res.render('edit-recipe', {
            recipe: recipe.rows[0],
            ingredients: ingredients.rows,
            instructions: instructions.rows,
        });
    } catch (error) {
        console.error('Edit recipe page error:', error);
        res.status(500).render('error', {message: 'Error loading recipe'});
    }
});

// POST update recipe
router.post('/recipe/update/:id', isAuthenticated, async (req, res) => {
    const {id} = req.params;
    const {
        name,
        difficulty,
        prepTime,
        cookTime,
        serves,
        recipeLink,
        ingredients,
        instructions,
    } = req.body;

    const client = await pool.connect();

    try {
        // Check ownership
        const recipeCheck = await pool.query(
            'SELECT * FROM recipes WHERE id = $1 AND user_id = $2',
            [id, req.session.userId],
        );

        if (recipeCheck.rows.length === 0) {
            return res.status(403).render('error', {message: 'Unauthorized'});
        }

        await client.query('BEGIN');

        const totalTime = parseInt(prepTime) + parseInt(cookTime);

        // Update recipe
        await client.query(
            'UPDATE recipes SET name = $1, difficulty = $2, prep_time = $3, cook_time = $4, total_time = $5, serves = $6, recipe_link = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8',
            [
                name,
                difficulty,
                prepTime,
                cookTime,
                totalTime,
                serves,
                recipeLink,
                id,
            ],
        );

        // Delete old ingredients and instructions
        await client.query('DELETE FROM ingredients WHERE recipe_id = $1', [
            id,
        ]);
        await client.query('DELETE FROM instructions WHERE recipe_id = $1', [
            id,
        ]);

        // Insert new ingredients
        if (Array.isArray(ingredients) && ingredients.length > 0) {
            for (const ingredient of ingredients) {
                if (ingredient.name) {
                    await client.query(
                        'INSERT INTO ingredients (recipe_id, name, quantity, unit) VALUES ($1, $2, $3, $4)',
                        [
                            id,
                            ingredient.name,
                            ingredient.quantity,
                            ingredient.unit,
                        ],
                    );
                }
            }
        }

        // Insert new instructions
        if (Array.isArray(instructions) && instructions.length > 0) {
            for (let i = 0; i < instructions.length; i++) {
                if (instructions[i]) {
                    await client.query(
                        'INSERT INTO instructions (recipe_id, step_number, instruction) VALUES ($1, $2, $3)',
                        [id, i + 1, instructions[i]],
                    );
                }
            }
        }

        await client.query('COMMIT');
        res.redirect('/dashboard');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Update recipe error:', error);
        res.status(500).render('error', {message: 'Error updating recipe'});
    } finally {
        client.release();
    }
});

// POST delete recipe
router.post('/recipe/delete/:id', isAuthenticated, async (req, res) => {
    const {id} = req.params;

    try {
        // Check ownership
        const recipeCheck = await pool.query(
            'SELECT * FROM recipes WHERE id = $1 AND user_id = $2',
            [id, req.session.userId],
        );

        if (recipeCheck.rows.length === 0) {
            return res
                .status(403)
                .json({success: false, message: 'Unauthorized'});
        }

        // Delete recipe (cascades to ingredients and instructions)
        await pool.query('DELETE FROM recipes WHERE id = $1', [id]);

        res.json({success: true, message: 'Recipe deleted successfully'});
    } catch (error) {
        console.error('Delete recipe error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting recipe',
        });
    }
});

// GET suggestion page
router.get('/suggestion', isAuthenticated, async (req, res) => {
    try {
        // Initialize suggestion session if not exists
        if (!req.session.suggestedRecipes) {
            req.session.suggestedRecipes = [];
        }

        res.render('suggestion', {
            filters: {
                difficulty: req.query.difficulty || '',
                maxTime: req.query.maxTime || '',
            },
        });
    } catch (error) {
        console.error('Suggestion page error:', error);
        res.status(500).render('error', {
            message: 'Error loading suggestion page',
        });
    }
});

// POST get random recipe suggestion
router.post('/api/suggestion', isAuthenticated, async (req, res) => {
    const {difficulty, maxTime} = req.body;

    try {
        // Initialize suggestion session if not exists
        if (!req.session.suggestedRecipes) {
            req.session.suggestedRecipes = [];
        }

        let query = 'SELECT * FROM recipes WHERE user_id = $1';
        const params = [req.session.userId];
        let paramCount = 1;

        // Add filters
        if (difficulty && difficulty !== '') {
            paramCount++;
            query += ` AND difficulty = $${paramCount}`;
            params.push(difficulty);
        }

        if (maxTime && maxTime !== '') {
            paramCount++;
            query += ` AND total_time <= $${paramCount}`;
            params.push(parseInt(maxTime));
        }

        // Exclude already suggested recipes
        if (req.session.suggestedRecipes.length > 0) {
            const placeholders = req.session.suggestedRecipes
                .map((_, i) => `$${paramCount + i + 1}`)
                .join(',');
            query += ` AND id NOT IN (${placeholders})`;
            params.push(...req.session.suggestedRecipes);
        }

        const result = await pool.query(query, params);

        // If no recipes available
        if (result.rows.length === 0) {
            // Check if all recipes have been suggested
            const allRecipes = await pool.query(
                'SELECT id FROM recipes WHERE user_id = $1',
                [req.session.userId],
            );

            if (
                allRecipes.rows.length === req.session.suggestedRecipes.length
            ) {
                return res.json({
                    recipe: null,
                    allSuggested: true,
                    message:
                        'You have seen all recipes! Click continue to cycle through again.',
                });
            }

            return res.json({
                recipe: null,
                message: 'No recipes match your filters.',
            });
        }

        // Select random recipe from results
        const randomIndex = Math.floor(Math.random() * result.rows.length);
        const recipe = result.rows[randomIndex];

        // Mark this recipe as suggested
        req.session.suggestedRecipes.push(recipe.id);

        // Get ingredients and instructions
        const ingredients = await pool.query(
            'SELECT * FROM ingredients WHERE recipe_id = $1 ORDER BY id',
            [recipe.id],
        );

        const instructions = await pool.query(
            'SELECT * FROM instructions WHERE recipe_id = $1 ORDER BY step_number',
            [recipe.id],
        );

        res.json({
            success: true,
            recipe: {
                ...recipe,
                ingredients: ingredients.rows,
                instructions: instructions.rows,
            },
        });
    } catch (error) {
        console.error('Suggestion API error:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting suggestion',
        });
    }
});

// POST reset suggestion cycle (when all recipes seen)
router.post('/api/reset-suggestion', isAuthenticated, (req, res) => {
    req.session.suggestedRecipes = [];
    res.json({success: true, message: 'Suggestion cycle reset'});
});

// GET recipe details
router.get('/recipe/:id', isAuthenticated, async (req, res) => {
    const {id} = req.params;

    try {
        const recipe = await pool.query(
            'SELECT * FROM recipes WHERE id = $1 AND user_id = $2',
            [id, req.session.userId],
        );

        if (recipe.rows.length === 0) {
            return res.status(404).render('404');
        }

        const ingredients = await pool.query(
            'SELECT * FROM ingredients WHERE recipe_id = $1 ORDER BY id',
            [id],
        );

        const instructions = await pool.query(
            'SELECT * FROM instructions WHERE recipe_id = $1 ORDER BY step_number',
            [id],
        );

        res.render('recipe-detail', {
            recipe: recipe.rows[0],
            ingredients: ingredients.rows,
            instructions: instructions.rows,
        });
    } catch (error) {
        console.error('Recipe detail error:', error);
        res.status(500).render('error', {message: 'Error loading recipe'});
    }
});

module.exports = router;
