# MealFinder - Presentation Script

## Full Stack Web Application Demo & Code Explanation

---

## PART 1: TECHNICAL OVERVIEW (Define This Section First Before Demo)

### Introduction to MealFinder

"Hello everyone! We're presenting **MealFinder**, a full-stack web application that solves the everyday problem of deciding what to cook. Our app allows users to build their personal recipe collection and get intelligent random suggestions based on their preferences for difficulty level and cooking time. Today, we'll first demonstrate the live application, then dive into the code architecture that powers it."

---

## PART 2: TECHNOLOGY STACK EXPLANATION

### "What We Built With - The Tech Stack"

#### **Frontend Layer:**

- **HTML5**: Semantic structure for all web pages
- **CSS3**: Custom styling with responsive design (no frameworks)
- **JavaScript (Vanilla)**: Client-side interactivity without frameworks
    - Dynamic form handling for recipe creation
    - Async API calls for suggestions
    - Real-time DOM manipulation

#### **Backend Layer:**

- **Node.js**: JavaScript runtime for server-side execution
- **Express.js**: Lightweight web framework for routing and middleware
    - Handles HTTP requests/responses
    - Manages all API endpoints
    - Integrates middleware for authentication and data parsing

#### **Database:**

- **PostgreSQL**: Relational database for persistent data storage
    - 4 main tables: `users`, `recipes`, `ingredients`, `instructions`
    - Foreign key relationships for data integrity
    - Session storage for user authentication

#### **Authentication & Security:**

- **bcryptjs**: Password hashing library
    - Passwords hashed with salt rounds before storage
    - ~2.4.3 version used for security
- **express-session**: Session management middleware
    - Stores session data in PostgreSQL
    - Maintains user authentication state
    - 24-hour cookie expiration

#### **Templating:**

- **EJS (Embedded JavaScript)**: Server-side templating engine
    - Renders dynamic HTML based on server data
    - Conditionally displays UI elements (login vs logout)
    - Loops through recipe data to generate lists

---

## PART 3: HOW THE PROJECT WORKS - CODE ARCHITECTURE

### "Under the Hood - The Architecture"

#### **Project Structure Overview:**

```
MealFinder/
├── server.js                 # Express app initialization
├── config/db.js              # PostgreSQL connection pool
├── middleware/auth.js        # Authentication guards
├── routes/
│   ├── auth.js              # Login/Signup/Logout routes
│   └── recipes.js           # Recipe CRUD & Suggestion routes
├── views/                    # EJS templates (14 files total)
├── public/
│   ├── css/style.css        # All styling
│   └── js/                  # Client-side scripts
└── init-db.js               # Database initialization
```

#### **How The Server Starts - server.js:**

```javascript
// The entry point: server.js (Lines 1-48)

// 1. INITIALIZE EXPRESS APP & MIDDLEWARE
const app = express();
app.use(bodyParser.urlencoded({extended: true})); // Parse form data
app.use(bodyParser.json()); // Parse JSON requests
app.use(express.static(path.join(__dirname, 'public'))); // Serve CSS/JS

// 2. SESSION MANAGEMENT - STORES USER LOGIN STATE
app.use(
    session({
        store: new PostgresqlStore({pool: pool}), // Store sessions in DB
        secret: process.env.SESSION_SECRET,
        cookie: {maxAge: 24 * 60 * 60 * 1000}, // 24hr expiration
    }),
);

// 3. SET UP EJS TEMPLATING ENGINE
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 4. REGISTER ROUTES
app.use('/', require('./routes/auth')); // Login/Signup routes
app.use('/', require('./routes/recipes')); // Recipe routes

// 5. START SERVER
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

#### **Database Connection - config/db.js:**

```javascript
// Creates a connection pool to PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
});
// This pool is reused throughout the app for all database queries
```

---

## PART 4: MAIN FLOWS & FUNCTIONALITY

### **FLOW 1: USER AUTHENTICATION**

#### **1A. User Registration (Signup)**

**Route: `/signup` (GET & POST)**

Code Flow:

```javascript
// routes/auth.js - Lines 45-88
router.post('/signup', isNotAuthenticated, async (req, res) => {
    const {email, password, passwordConfirm} = req.body;

    // STEP 1: Validate input
    if (!email || !password || !passwordConfirm) {
        return res.render('signup', {message: 'Please provide all fields'});
    }

    // STEP 2: Check passwords match
    if (password !== passwordConfirm) {
        return res.render('signup', {message: 'Passwords do not match'});
    }

    // STEP 3: Check if email already exists
    const result = await pool.query(
        'SELECT email FROM users WHERE email = $1',
        [email],
    );
    if (result.rows.length > 0) {
        return res.render('signup', {message: 'Email already in use'});
    }

    // STEP 4: Hash password with bcrypt (security!)
    const hashedPassword = await bcrypt.hash(password, 10);

    // STEP 5: Insert new user into database
    await pool.query('INSERT INTO users (email, password) VALUES ($1, $2)', [
        email,
        hashedPassword,
    ]);

    return res.render('signup', {message: 'User registered successfully!'});
});
```

**Key Concept - isNotAuthenticated Middleware:**

```javascript
// middleware/auth.js
function isNotAuthenticated(req, res, next) {
    if (req.session && req.session.userId) {
        // If already logged in, redirect to dashboard
        res.redirect('/dashboard');
    } else {
        // If not logged in, allow access to signup/login
        next();
    }
}
```

This prevents logged-in users from seeing the signup page again.

#### **1B. User Login**

**Route: `/login` (GET & POST)**

Code Flow:

```javascript
// routes/auth.js - Lines 24-46
router.post('/login', isNotAuthenticated, async (req, res) => {
    const {email, password} = req.body;

    // STEP 1: Find user by email
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [
        email,
    ]);

    if (result.rows.length === 0) {
        return res.render('login', {message: 'Email or password is incorrect'});
    }

    const user = result.rows[0];

    // STEP 2: Compare entered password with stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return res.render('login', {message: 'Email or password is incorrect'});
    }

    // STEP 3: Create session for this user
    req.session.userId = user.id;
    req.session.email = user.email;

    // STEP 4: Redirect to dashboard
    res.redirect('/dashboard');
});
```

**What Happens After Login:**

- Session stored in PostgreSQL with user's ID
- Session cookie sent to browser (24hr expiration)
- On every request, Express checks `req.session.userId` to verify login
- User stays logged in until logout or cookie expires

#### **1C. Logout**

Code Flow:

```javascript
// routes/auth.js - Lines 90-98
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.send('Error logging out');
        res.redirect('/'); // Back to home page
    });
});
```

Simple: Destroy the session and redirect home.

---

### **FLOW 2: RECIPE MANAGEMENT (CRUD Operations)**

#### **2A. Create Recipe (Add Recipe)**

**Route: `/recipe/add` (GET & POST)**

Display Page (GET):

```javascript
// routes/recipes.js - Lines 29-31
router.get('/recipe/add', isAuthenticated, (req, res) => {
    res.render('add-recipe', {isAuthenticated: req.session.userId});
});
// isAuthenticated middleware ensures user is logged in
// If not logged in, redirects to /login
```

Add Recipe (POST):

```javascript
// routes/recipes.js - Lines 33-113
router.post('/recipe/add', isAuthenticated, async (req, res) => {
    const {name, difficulty, prepTime, cookTime, serves, recipeLink, ingredients, instructions} = req.body;

    const client = await pool.connect();  // Get DB connection

    try {
        await client.query('BEGIN');  // Start transaction

        // STEP 1: Calculate total time
        const totalTime = parseInt(prepTime) + parseInt(cookTime);

        // STEP 2: Insert recipe and get the new recipe ID
        const recipeResult = await client.query(
            'INSERT INTO recipes (user_id, name, difficulty, prep_time, cook_time, total_time, serves, recipe_link)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
            [req.session.userId, name, difficulty, prepTime, cookTime, totalTime, serves, recipeLink]
        );
        const recipeId = recipeResult.rows[0].id;

        // STEP 3: Insert all ingredients
        if (Array.isArray(ingredients) && ingredients.length > 0) {
            for (const ingredient of ingredients) {
                if (ingredient.name) {
                    await client.query(
                        'INSERT INTO ingredients (recipe_id, name, quantity, unit) VALUES ($1, $2, $3, $4)',
                        [recipeId, ingredient.name, ingredient.quantity, ingredient.unit]
                    );
                }
            }
        }

        // STEP 4: Insert all instructions
        if (Array.isArray(instructions) && instructions.length > 0) {
            for (let i = 0; i < instructions.length; i++) {
                if (instructions[i]) {
                    await client.query(
                        'INSERT INTO instructions (recipe_id, step_number, instruction) VALUES ($1, $2, $3)',
                        [recipeId, i + 1, instructions[i]]
                    );
                }
            }
        }

        await client.query('COMMIT');  // Save all changes
        res.redirect('/dashboard');
    } catch (error) {
        await client.query('ROLLBACK');  // Undo all changes on error
        res.render('add-recipe', {message: 'Error adding recipe'});
    } finally {
        client.release();  // Return connection to pool
    }
});
```

**Key Concept - Transactions:**

- BEGIN/COMMIT/ROLLBACK ensure all-or-nothing atomicity
- If ingredient insert fails, entire recipe insertion is undone
- Prevents corrupted partial data in the database

#### **2B. Read Recipe Dashboard**

**Route: `/dashboard` (GET)**

Code Flow:

```javascript
// routes/recipes.js - Lines 13-28
router.get('/dashboard', isAuthenticated, async (req, res) => {
    try {
        // STEP 1: Fetch all recipes for logged-in user
        const recipes = await pool.query(
            'SELECT * FROM recipes WHERE user_id = $1 ORDER BY created_at DESC',
            [req.session.userId], // Only show THIS user's recipes
        );

        // STEP 2: Pass recipes to dashboard template
        res.render('dashboard', {
            isAuthenticated: req.session.userId,
            user: req.session.email,
            recipes: recipes.rows, // Array of recipe objects
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.render('dashboard', {message: 'Error loading recipes'});
    }
});
```

**EJS Template Rendering:**

```ejs
<!-- views/dashboard.ejs -->
<div class="recipes-grid">
    <% if (recipes && recipes.length > 0) { %>
        <% recipes.forEach(recipe => { %>
            <div class="recipe-card">
                <h3><%= recipe.name %></h3>
                <span><%= recipe.difficulty %></span>
                <span>⏱️ <%= recipe.total_time %> min</span>
                <a href="/recipe/<%= recipe.id %>">View</a>
                <a href="/recipe/edit/<%= recipe.id %>">Edit</a>
                <button onclick="deleteRecipe(<%= recipe.id %>)">Delete</button>
            </div>
        <% }); %>
    <% } else { %>
        <p>No recipes yet. Create your first recipe!</p>
    <% } %>
</div>
```

#### **2C. Update Recipe (Edit Recipe)**

**Route: `/recipe/update/:id` (POST)**

Code Flow:

```javascript
// routes/recipes.js - Lines 152-232
router.post('/recipe/update/:id', isAuthenticated, async (req, res) => {
    const {id} = req.params;
    const {
        name,
        difficulty,
        prepTime,
        cookTime,
        serves,
        ingredients,
        instructions,
    } = req.body;

    const client = await pool.connect();

    try {
        // STEP 1: Verify user owns this recipe (security!)
        const recipeCheck = await pool.query(
            'SELECT * FROM recipes WHERE id = $1 AND user_id = $2',
            [id, req.session.userId],
        );

        if (recipeCheck.rows.length === 0) {
            return res.status(403).render('error', {message: 'Unauthorized'});
        }

        await client.query('BEGIN');

        const totalTime = parseInt(prepTime) + parseInt(cookTime);

        // STEP 2: Update recipe base info
        await client.query(
            'UPDATE recipes SET name = $1, difficulty = $2, prep_time = $3, cook_time = $4, total_time = $5, serves = $6 WHERE id = $7',
            [name, difficulty, prepTime, cookTime, totalTime, serves, id],
        );

        // STEP 3: Delete old ingredients and instructions (fresh start)
        await client.query('DELETE FROM ingredients WHERE recipe_id = $1', [
            id,
        ]);
        await client.query('DELETE FROM instructions WHERE recipe_id = $1', [
            id,
        ]);

        // STEP 4: Insert new ingredients and instructions (same as create)
        // ... (same loop logic as 2A)

        await client.query('COMMIT');
        res.redirect('/dashboard');
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).render('error', {message: 'Error updating recipe'});
    } finally {
        client.release();
    }
});
```

**Security Check Explained:**

```javascript
// This ensures user can only edit their OWN recipes
const recipeCheck = await pool.query(
    'SELECT * FROM recipes WHERE id = $1 AND user_id = $2',
    [id, req.session.userId], // Both ID AND user_id must match
);
```

Without this, a malicious user could directly edit another user's recipe!

#### **2D. Delete Recipe**

**Route: `/recipe/delete/:id` (POST)**

Code Flow:

```javascript
// routes/recipes.js - Lines 234-257
router.post('/recipe/delete/:id', isAuthenticated, async (req, res) => {
    const {id} = req.params;

    try {
        // STEP 1: Verify user owns recipe
        const recipeCheck = await pool.query(
            'SELECT * FROM recipes WHERE id = $1 AND user_id = $2',
            [id, req.session.userId],
        );

        if (recipeCheck.rows.length === 0) {
            return res
                .status(403)
                .json({success: false, message: 'Unauthorized'});
        }

        // STEP 2: Delete recipe (ingredients/instructions cascade delete)
        await pool.query('DELETE FROM recipes WHERE id = $1', [id]);

        res.json({success: true, message: 'Recipe deleted successfully'});
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting recipe',
        });
    }
});
```

**Frontend Delete Handler:**

```javascript
// public/js/dashboard.js
async function deleteRecipe(recipeId) {
    if (!confirm('Are you sure you want to delete this recipe?')) {
        return; // User clicked Cancel
    }

    try {
        const response = await fetch(`/recipe/delete/${recipeId}`, {
            method: 'POST', // Send POST request to backend
        });

        const data = await response.json();

        if (data.success) {
            location.reload(); // Refresh page to show updated list
        } else {
            alert('Error deleting recipe: ' + data.message);
        }
    } catch (error) {
        alert('Error deleting recipe');
    }
}
```

---

### **FLOW 3: RECIPE SUGGESTION SYSTEM (The Star Feature)**

#### **3A. Accessing Suggestion Page**

**Route: `/suggestion` (GET)**

Code Flow:

```javascript
// routes/recipes.js - Lines 274-292
router.get('/suggestion', isAuthenticated, async (req, res) => {
    try {
        // Initialize suggestion session array if needed
        // This tracks which recipes have been suggested so we don't repeat
        if (!req.session.suggestedRecipes) {
            req.session.suggestedRecipes = [];
        }

        res.render('suggestion', {
            isAuthenticated: req.session.userId,
            filters: {
                difficulty: req.query.difficulty || '',
                maxTime: req.query.maxTime || '',
            },
        });
    } catch (error) {
        res.status(500).render('error', {
            message: 'Error loading suggestion page',
        });
    }
});
```

#### **3B. Getting Random Suggestion (The Complex Part!)**

**Route: `/api/suggestion` (POST)**

Code Flow:

```javascript
// routes/recipes.js - Lines 294-365
router.post('/api/suggestion', isAuthenticated, async (req, res) => {
    const {difficulty, maxTime} = req.body;

    try {
        if (!req.session.suggestedRecipes) {
            req.session.suggestedRecipes = [];
        }

        // STEP 1: Build dynamic query based on filters
        let query = 'SELECT * FROM recipes WHERE user_id = $1';
        const params = [req.session.userId];
        let paramCount = 1;

        // Add difficulty filter if provided
        if (difficulty && difficulty !== '') {
            paramCount++;
            query += ` AND difficulty = $${paramCount}`;
            params.push(difficulty);
        }

        // Add time filter if provided
        if (maxTime && maxTime !== '') {
            paramCount++;
            query += ` AND total_time <= $${paramCount}`;
            params.push(parseInt(maxTime));
        }

        // STEP 2: IMPORTANT - Exclude already suggested recipes
        // This prevents recommending the same recipe twice in one session
        if (req.session.suggestedRecipes.length > 0) {
            const placeholders = req.session.suggestedRecipes
                .map((_, i) => `$${paramCount + i + 1}`)
                .join(',');
            query += ` AND id NOT IN (${placeholders})`;
            params.push(...req.session.suggestedRecipes);
        }

        // STEP 3: Execute final query
        const result = await pool.query(query, params);

        // STEP 4: Handle no results
        if (result.rows.length === 0) {
            const allRecipes = await pool.query(
                'SELECT id FROM recipes WHERE user_id = $1',
                [req.session.userId],
            );

            // Check if ALL recipes have been suggested
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

        // STEP 5: Pick random recipe from filtered results
        const randomIndex = Math.floor(Math.random() * result.rows.length);
        const recipe = result.rows[randomIndex];

        // STEP 6: Mark this recipe as suggested
        req.session.suggestedRecipes.push(recipe.id);

        // STEP 7: Fetch ingredients and instructions for this recipe
        const ingredients = await pool.query(
            'SELECT * FROM ingredients WHERE recipe_id = $1 ORDER BY id',
            [recipe.id],
        );

        const instructions = await pool.query(
            'SELECT * FROM instructions WHERE recipe_id = $1 ORDER BY step_number',
            [recipe.id],
        );

        // STEP 8: Return complete recipe with all details
        res.json({
            success: true,
            recipe: {
                ...recipe,
                ingredients: ingredients.rows,
                instructions: instructions.rows,
            },
        });
    } catch (error) {
        console.error('Suggestion error:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting suggestion',
        });
    }
});
```

**Frontend Suggestion Handler:**

```javascript
// public/js/suggestion.js - Lines 1-43
let suggestionHistory = [];

async function getSuggestion() {
    const difficulty = document.getElementById('difficulty-filter').value;
    const maxTime = document.getElementById('time-filter').value;

    try {
        // STEP 1: Send filter preferences to backend
        const response = await fetch('/api/suggestion', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({difficulty, maxTime}),
        });

        const data = await response.json();

        // STEP 2: Handle no suggestion scenarios
        if (!data.success) {
            if (data.allSuggested) {
                showAllSeenModal(); // Show "You've seen all recipes" modal
            } else {
                displayMessage(data.message); // Show filter mismatch message
            }
            return;
        }

        const recipe = data.recipe;

        // STEP 3: Add to local history (for UI)
        suggestionHistory.push(recipe);
        updateHistory();

        // STEP 4: Display the recipe to user
        displayRecipeSuggestion(recipe);
    } catch (error) {
        displayMessage('Error getting suggestion. Please try again.');
    }
}
```

**Example Query Built Dynamically:**

User selects: Difficulty = "Easy", Max Time = "30 minutes"

Query becomes:

```sql
SELECT * FROM recipes
WHERE user_id = 5
AND difficulty = 'Easy'
AND total_time <= 30
AND id NOT IN (12, 45, 67)  -- Already suggested
```

This ensures only Easy recipes under 30 min that haven't been suggested are returned!

---

## PART 5: DATABASE SCHEMA

### "How Data is Organized"

```sql
-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- Recipes Table (linked to user)
CREATE TABLE recipes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    difficulty VARCHAR(50),
    prep_time INTEGER,
    cook_time INTEGER,
    total_time INTEGER,
    serves INTEGER,
    recipe_link VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ingredients Table (linked to recipe)
CREATE TABLE ingredients (
    id SERIAL PRIMARY KEY,
    recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
    name VARCHAR(255),
    quantity DECIMAL,
    unit VARCHAR(50)
);

-- Instructions Table (linked to recipe)
CREATE TABLE instructions (
    id SERIAL PRIMARY KEY,
    recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
    step_number INTEGER,
    instruction TEXT
);

-- Session Table (managed by express-session)
CREATE TABLE session (
    sid VARCHAR PRIMARY KEY,
    sess JSONB,
    expire TIMESTAMP
);
```

### "Relationships Explained"

- **One user → Many recipes**: Each user can have multiple recipes
- **One recipe → Many ingredients/instructions**: Each recipe has multiple ingredients and steps
- **Cascading delete**: If recipe is deleted, its ingredients and instructions auto-delete

---

## PART 6: AUTHENTICATION FLOW DIAGRAM

```
User visits /login
      ↓
Submits email + password via form
      ↓
Backend validates email exists && password matches hash
      ↓
CREATE SESSION: req.session.userId = user.id
      ↓
Session stored in PostgreSQL (session table)
      ↓
Session cookie sent to browser (24hr expiration)
      ↓
Redirect to /dashboard
      ↓
On every subsequent request, Express checks req.session.userId
      ↓
isAuthenticated middleware verifies session exists
      ↓
User stays logged in until logout or cookie expires
```

---

## PART 7: SUGGESTION ALGORITHM FLOW

```
User clicks "Get Suggestion"
      ↓
Frontend sends POST /api/suggestion with filters
      ↓
Backend builds dynamic SQL:
  - SELECT recipes WHERE user_id = thisUser
  - IF difficulty selected: AND difficulty = $difficulty
  - IF maxTime selected: AND total_time <= $maxTime
  - AND id NOT IN (already_suggested)
      ↓
Execute query → Get filtered recipe list
      ↓
If NO recipes match:
  - Check if ALL recipes seen
  - Show "You've seen all recipes" modal OR "No matches" message
      ↓
If recipes found:
  - Pick random recipe from list
  - Add recipe.id to req.session.suggestedRecipes
  - Fetch ingredients & instructions for this recipe
  - Return complete recipe to frontend
      ↓
Frontend displays recipe with all details
```

---

## PART 8: KEY CODE PATTERNS & EXPLANATIONS

### **Pattern 1: Async/Await for Database Operations**

```javascript
// All database queries are asynchronous
const result = await pool.query(query, params);
// This waits for the database to respond before continuing
// Prevents code from running before data is retrieved
```

### **Pattern 2: SQL Injection Prevention (Parameterized Queries)**

```javascript
// WRONG - Vulnerable to SQL injection:
query = "SELECT * FROM users WHERE email = '" + email + "'";

// RIGHT - Our approach with parameters:
query = 'SELECT * FROM users WHERE email = $1';
const result = await pool.query(query, [email]);
// The $1 is a placeholder, email is a safe parameter
```

### **Pattern 3: Session-based Authentication**

```javascript
// After successful login:
req.session.userId = user.id;
req.session.email = user.email;
// Session persists across requests

// In middleware:
if (req.session && req.session.userId) {
    // User is logged in
    next(); // Allow access
} else {
    // User is NOT logged in
    res.redirect('/login'); // Deny access
}
```

### **Pattern 4: Conditional Rendering in EJS**

```ejs
<!-- Show different UI based on authentication state -->
<% if (typeof isAuthenticated !== 'undefined' && isAuthenticated) { %>
    <a href="/dashboard">My Recipes</a>
    <a href="/logout">Logout</a>
<% } else { %>
    <a href="/login">Login</a>
    <a href="/signup">Sign Up</a>
<% } %>
```

### **Pattern 5: Database Transactions for Data Integrity**

```javascript
await client.query('BEGIN');
try {
    // All these operations happen together
    await client.query('INSERT INTO recipes ...');
    await client.query('INSERT INTO ingredients ...');
    await client.query('INSERT INTO instructions ...');
    await client.query('COMMIT'); // Save all
} catch (error) {
    await client.query('ROLLBACK'); // Undo all if error
}
```

---

## PART 9: PROJECT HIGHLIGHTS & LEARNING OUTCOMES

### "What Makes This Project Notable"

1. **Full CRUD Operations**: Create, Read, Update, Delete recipes - demonstrates all fundamental database operations

2. **User Authentication**: Secure password hashing with bcryptjs, session management - critical for real-world apps

3. **Smart Filtering Algorithm**: The suggestion system dynamically builds SQL queries and prevents duplicate suggestions - shows advanced backend logic

4. **Data Relationships**: Multiple tables with foreign keys and cascading deletes - demonstrates relational database concepts

5. **Transaction Handling**: Multi-step recipe creation uses transactions to ensure data consistency - shows database best practices

6. **Security Implementation**:
    - Parameterized queries prevent SQL injection
    - Password hashing prevents plaintext storage
    - User authentication verification prevents unauthorized access to other users' recipes

7. **Responsive Architecture**:
    - Separation of concerns (routes, middleware, views)
    - Reusable middleware functions
    - Clean code organization

---

## PART 10: SAMPLE PRESENTATION FLOW

### Opening (2 minutes)

1. Introduce the problem: "How many times have you stood in front of your fridge not knowing what to cook?"
2. Introduce the solution: "MealFinder solves this with an intelligent recipe suggestion system"
3. Briefly mention the tech stack

### Demo (5-7 minutes per team member)

1. Show signup/login flow
2. Add a new recipe with ingredients and instructions
3. Navigate to My Recipes dashboard
4. Go to suggestion page and apply filters
5. Get a random suggestion
6. Show editing/deleting a recipe
7. Log out

### Code Explanation (5-8 minutes per team member)

1. **Slide 1**: Tech Stack overview with diagram
2. **Slide 2**: Application architecture and folder structure
3. **Slide 3**: Authentication flow with code example
4. **Slide 4**: Recipe CRUD operations with code snippets
5. **Slide 5**: Suggestion algorithm - most complex logic
6. **Slide 6**: Database schema and relationships
7. **Slide 7**: Security implementation
8. **Slide 8**: Key challenges and solutions

---

## PRESENTATION TIPS

1. **Show, Don't Just Tell**: Always navigate the code while explaining
2. **Highlight Key Lines**: Point to specific `req.session.userId` or database queries
3. **Explain the "Why"**: Don't just say what the code does, explain why it's designed that way
4. **Use Real Examples**: Trace through a complete flow (user signup → recipe creation → suggestion)
5. **Acknowledge Challenges**: Mention transaction handling and session management if things didn't work initially
6. **Team Contributions**: Each member covers their specific feature implementations

---

## TALKING POINTS FOR EACH SECTION

### Tech Stack Explanation:

"We chose **Express.js** because it's lightweight and perfect for this project size. **PostgreSQL** provides robust relational data with foreign keys. **EJS** templates let us render the HTML server-side with dynamic user data. **bcryptjs** ensures passwords are never stored in plain text. And **express-session** combined with PostgreSQL gives us persistent session management across server restarts."

### Authentication Section:

"Security was crucial. When users sign up, we validate email format and password strength. Passwords are hashed with bcrypt using a salt round of 10 - meaning even if someone accesses the database, they can't read passwords. On login, we compare the entered password's hash with the stored hash. If it matches, we create a session with the user's ID. This session persists in PostgreSQL and expires after 24 hours."

### Recipe Management:

"The recipe creation uses transactions - a database concept where multiple operations treat as one atomic unit. If adding a recipe succeeds but adding an ingredient fails, the entire transaction rolls back. This prevents orphaned recipes with missing data. We use parameterized queries with $1, $2 placeholders to prevent SQL injection attacks."

### Suggestion System:

"This is the most interesting feature. When a user requests a suggestion, we dynamically build a SQL query based on their selected filters. If they pick 'Easy' difficulty and 'under 30 minutes', the query filters for those. Crucially, we track suggested recipes in the session and exclude them from future suggestions - users won't see the same recipe twice. We generate random selection from the filtered results, creating an engaging user experience."

---

## CHALLENGE DISCUSSION POINTS

Potential challenges to mention:

1. "Getting transactions to work correctly required understanding ROLLBACK"
2. "Session persistence across server restarts needed PostgreSQL session store"
3. "Dynamic SQL building was tricky but powerful once we mastered parameterized queries"
4. "Preventing duplicate recipe suggestions required session tracking"
5. "Ensuring users only see their own recipes needed proper user authentication checks"
