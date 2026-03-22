# MealFinder - Full Stack Meal Suggestion Web Application

## Team Contributions

| **Luca** | Sign-up/Login authentication, user authentication middleware, and database user management
| **Ubin** | Recipe creation feature and recipe dashboard display (Read & Create operations)  
| **Leana** | Recipe updating and deletion functionality (Update & Delete operations)
| **Hyde** | Recipe suggestion engine with filtering and randomization logic

## How to Run the Application Locally

### Quick Setup - Copy to Copilot (Automated)

**Instructions for Instructor**: Copy the following text and paste it into Copilot/ChatGPT. It will automate most of the setup process. You only need to have PostgreSQL installed and running beforehand.

---

**Copilot Setup Instructions** (Copy from here):

I need to set up a Node.js web application called MealFinder. The project folder is already downloaded. Please help me complete these automated setup steps in order. I'm using Windows PowerShell.

1. First, create a `.env` file in the project root with these contents:

```
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mealfinder
SESSION_SECRET=your_secret_key_12345
PORT=3000
```

2. Create a PostgreSQL database called `mealfinder` by running this command:

```
createdb mealfinder
```

3. Install all npm dependencies:

```
npm install
```

4. Initialize the database tables:

```
node init-db.js
```

5. Start the application:

```
npm start
```

The application should now be running at http://localhost:3000

---

**Note**: Replace `postgres` in `DB_PASSWORD` if you set a different password during PostgreSQL installation. If the `createdb` command fails, use pgAdmin to create the database manually.

---

### Prerequisites

Make sure you have the following installed on your system:

- **Node.js (v14 or higher)** - [Download here](https://nodejs.org/)
- **npm** - Comes with Node.js
- **PostgreSQL (v12 or higher)** - [Download here](https://www.postgresql.org/download/)

If you don't have PostgreSQL installed, please download and install it before proceeding.

### Step 1: Download and Navigate to the Project

1. Download or clone the project to your local machine
2. Open a terminal (Command Prompt, PowerShell, or Git Bash)
3. Navigate to the project directory:

```bash
cd path/to/meal-suggestion-app
```

### Step 2: Create the PostgreSQL Database

1. Open **pgAdmin** (the PostgreSQL admin tool) or use the PostgreSQL command line
2. Create a new database called `mealfinder`:
    - **In pgAdmin**: Right-click on "Databases" → Create → Database → Name it `mealfinder`
    - **In Command Line**: Run `createdb mealfinder`

### Step 3: Set Up Environment Variables

1. In the project root directory, create a file named `.env` (with no extension)
2. Add the following environment variables to the `.env` file:

```
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mealfinder
SESSION_SECRET=your_secret_key_here
PORT=3000
```

**Important**: Replace the following with your actual values:

- `your_postgres_password` - The password you set when installing PostgreSQL (default is usually `postgres`)
- `your_secret_key_here` - Can be any random string (used for session encryption)

### Step 4: Install Dependencies

In your terminal, run:

```bash
npm install
```

This will install all required packages listed in `package.json`.

### Step 5: Initialize the Database Tables

Run the database initialization script to create all required tables:

```bash
node init-db.js
```

You should see output like:

```
✓ Users table created
✓ Recipes table created
✓ Ingredients table created
✓ Instructions table created
✓ Recipe tags table created
✓ Session table created

✅ Database initialization complete!
```

### Step 6: Start the Application

To start the application, run:

```bash
npm start
```

Or, if you want to use development mode with auto-reload (requires nodemon):

```bash
npm run dev
```

The application will start and you should see:

```
Server is running on http://localhost:3000
```

### Step 7: Access the Application

Open your web browser and navigate to:

```
http://localhost:3000
```

You should see the MealFinder home page. You can now:

1. Sign up for a new account
2. Log in with your credentials
3. Start adding recipes to your collection
4. Use the suggestion feature to get random recipe ideas

---

## Troubleshooting

**Issue: "Error: connect ECONNREFUSED (Connection refused)"**

- **Solution**: Make sure PostgreSQL is running. Start the PostgreSQL service on your system.

**Issue: "Error: password authentication failed for user 'postgres'"**

- **Solution**: Check your `.env` file and make sure `DB_PASSWORD` matches your PostgreSQL password.

**Issue: "Database 'mealfinder' does not exist"**

- **Solution**: Make sure you created the `mealfinder` database in pgAdmin or command line before running `init-db.js`.

**Issue: "Cannot find module" error**

- **Solution**: Run `npm install` again to ensure all dependencies are installed.

---

## Project Structure

```
meal-suggestion-app/
├── config/
│   └── db.js                 # PostgreSQL database connection configuration
├── middleware/
│   └── auth.js               # Authentication middleware for route protection
├── public/
│   ├── css/
│   │   └── style.css         # Application styling
│   └── js/
│       ├── suggestion.js     # Suggestion engine frontend logic
│       ├── recipe-form.js    # Recipe form handling
│       ├── dashboard.js      # Dashboard functionality
│       └── recipe-detail.js  # Recipe detail page interactions
├── routes/
│   ├── auth.js               # Sign-up, login, logout routes
│   └── recipes.js            # Recipe CRUD and suggestion API routes
├── views/
│   ├── header.ejs            # Navigation header
│   ├── footer.ejs            # Footer
│   ├── index.ejs             # Home page
│   ├── login.ejs             # Login page
│   ├── signup.ejs            # Sign-up page
│   ├── dashboard.ejs         # User's recipe dashboard
│   ├── add-recipe.ejs        # Add recipe form
│   ├── edit-recipe.ejs       # Edit recipe form
│   ├── recipe-detail.ejs     # Recipe detail view
│   ├── suggestion.ejs        # Suggestion interface
│   ├── 404.ejs               # 404 error page
│   └── error.ejs             # Error page
├── .env                      # Environment variables (create this - not included)
├── init-db.js                # Database table initialization script
├── server.js                 # Main Express application server
├── package.json              # Project dependencies and scripts
└── README.md                 # This file
```

### Adding Recipes

1. Click "Dashboard" or "Manage My Recipes"
2. Click "+ Add New Recipe"
3. Fill in recipe details:
    - Recipe name
    - Difficulty level
    - Prep time and cook time
    - Number of servings
    - Ingredients (with quantities and units)
    - Step-by-step instructions
    - Optional: Link to external recipe
4. Click "Save Recipe"

### Getting Recipe Suggestions

1. Click "Get Suggestion" from home or dashboard
2. (Optional) Apply filters:
    - Select difficulty level
    - Enter maximum cooking time
3. Click "Get Suggestion" button
4. A recipe card will appear with all details
5. Either:
    - Click "Make This Recipe" to view full recipe
    - Click "Get Another" for another suggestion
6. Use the history section to revisit previous suggestions

### Managing Recipes

- **View**: Click "View" on any recipe card to see full details
- **Edit**: Click "Edit" to modify recipe details
- **Delete**: Click "Delete" to remove a recipe
- **Track Progress**: Check off ingredients and instructions while cooking

## Database Schema

### users table

```sql
- id: SERIAL PRIMARY KEY
- email: VARCHAR(255) UNIQUE
- password: VARCHAR(255) (hashed)
- created_at: TIMESTAMP
```

### recipes table

```sql
- id: SERIAL PRIMARY KEY
- user_id: FOREIGN KEY (users)
- name: VARCHAR(255)
- difficulty: VARCHAR(50)
- prep_time: INTEGER (minutes)
- cook_time: INTEGER (minutes)
- total_time: INTEGER (minutes) - auto-calculated
- serves: INTEGER
- recipe_link: VARCHAR(500)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### ingredients table

```sql
- id: SERIAL PRIMARY KEY
- recipe_id: FOREIGN KEY (recipes)
- name: VARCHAR(255)
- quantity: DECIMAL(10, 2)
- unit: VARCHAR(50)
- created_at: TIMESTAMP
```

### instructions table

```sql
- id: SERIAL PRIMARY KEY
- recipe_id: FOREIGN KEY (recipes)
- step_number: INTEGER
- instruction: TEXT
- created_at: TIMESTAMP
```

### recipe_tags table

```sql
- id: SERIAL PRIMARY KEY
- recipe_id: FOREIGN KEY (recipes)
- tag: VARCHAR(100)
- created_at: TIMESTAMP
```

## API Endpoints

### Authentication

- `GET /login` - Login page
- `POST /login` - Submit login
- `GET /signup` - Sign up page
- `POST /signup` - Submit sign up
- `GET /logout` - Logout user

### Pages

- `GET /` - Home page
- `GET /dashboard` - User's recipe dashboard
- `GET /suggestion` - Suggestion interface

### Recipe CRUD

- `GET /recipe/add` - Add recipe form
- `POST /recipe/add` - Create new recipe
- `GET /recipe/:id` - View recipe details
- `GET /recipe/edit/:id` - Edit recipe form
- `POST /recipe/update/:id` - Update recipe
- `POST /recipe/delete/:id` - Delete recipe

### API Routes

- `POST /api/suggestion` - Get random recipe suggestion
- `POST /api/reset-suggestion` - Reset suggestion cycle

## Features Explained

### Session-Based Suggestion Tracking

- Each user session tracks which recipes have been suggested
- The app maintains a list of suggested recipe IDs in the session
- When requesting a new suggestion, recipes already suggested are excluded
- This ensures users see diverse recipes during a session
- When all recipes are suggested, a popup appears allowing users to reset and see them again

### Automatic Time Calculation

- Cook Time + Prep Time = Total Time
- This is calculated automatically when adding/editing recipes

### Responsive Design

- The app is designed for web browsers
- Responsive CSS ensures good experience on different screen sizes
- Mobile-friendly layout with proper touch targets

## Common Issues & Troubleshooting

### Database Connection Error

**Error**: `Error: connect ECONNREFUSED`

- **Solution**: Check your `.env` file credentials are correct
- Verify Supabase database is running
- Test connection using a PostgreSQL client

### Session Not Persisting

**Problem**: Login session is lost after refresh

- **Solution**: Make sure `SESSION_SECRET` is set in `.env`
- Sessions are stored in memory (not persistent after server restart)

### Recipes Not Loading

**Problem**: Dashboard shows no recipes

- **Solution**: Ensure database tables were created with `node init-db.js`
- Check that you're logged into the correct user account

### Recipe Not Suggested

**Problem**: A recipe won't appear in suggestions

- **Solution**: Check recipe meets filter criteria (difficulty, time)
- Clear session history and try again

## Security Considerations

- Passwords are hashed using bcryptjs before storing
- Sessions are HTTP-only and cannot be accessed by JavaScript
- User recipes are isolated per user in the database
- Input validation should be added for production (currently basic)

## Future Enhancements

- Add recipe ratings and reviews
- Ingredient search and meal planning
- Recipe sharing with other users
- Nutritional information tracking
- Shopping list generation
- Mobile app version
- Enhanced input validation and error handling
- Input sanitization for production
- Rate limiting for API endpoints
- Email verification for sign up

## Team Member Responsibilities

_(To be filled in by your team)_

- Team Member 1: [Responsibilities]
- Team Member 2: [Responsibilities]
- Team Member 3: [Responsibilities]
- Team Member 4: [Responsibilities - if applicable]

## Technologies Used

- **HTML5**: Semantic markup and form structure
- **CSS3**: Flexbox, Grid, and modern styling
- **JavaScript**: DOM manipulation and async operations
- **Node.js**: Server runtime
- **Express.js**: Web framework and routing
- **PostgreSQL**: Relational database
- **Supabase**: Database hosting
- **EJS**: Server-side templating
- **bcryptjs**: Password security
- **express-session**: Session management

## Challenges Faced

_(To be documented by your team during development)_

## Lessons Learned

_(To be documented by your team during development)_

## How to Run Locally

1. Set up Node.js and PostgreSQL
2. Clone this repository
3. Install dependencies: `npm install`
4. Configure `.env` file with database credentials
5. Initialize database: `node init-db.js`
6. Start development server: `npm run dev`
7. Open browser to `http://localhost:3000`

## Support

For issues or questions, please check:

1. The Troubleshooting section above
2. Console logs in browser (F12 > Console)
3. Server terminal output

---

**Project Created**: March 2026
**Last Updated**: March 16, 2026
