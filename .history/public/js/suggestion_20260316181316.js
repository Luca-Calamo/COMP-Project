let suggestionHistory = [];

async function getSuggestion() {
    const difficulty = document.getElementById('difficulty-filter').value;
    const maxTime = document.getElementById('time-filter').value;

    try {
        const response = await fetch('/api/suggestion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                difficulty,
                maxTime,
            }),
        });

        const data = await response.json();

        if (!data.success) {
            if (data.allSuggested) {
                showAllSeenModal();
            } else {
                displayMessage(
                    data.message || 'No recipes match your filters.',
                );
            }
            return;
        }

        const recipe = data.recipe;

        // Add to history
        suggestionHistory.push(recipe);
        updateHistory();

        // Display the recipe
        displayRecipeSuggestion(recipe);
    } catch (error) {
        console.error('Error getting suggestion:', error);
        displayMessage('Error getting suggestion. Please try again.');
    }
}

function displayRecipeSuggestion(recipe) {
    const suggestionDisplay = document.getElementById('suggestion-display');

    let ingredientsList = '';
    recipe.ingredients.forEach((ingredient) => {
        ingredientsList += `<li>${ingredient.quantity} ${ingredient.unit} ${ingredient.name}</li>`;
    });

    let instructionsList = '';
    recipe.instructions.forEach((instruction) => {
        instructionsList += `<li>${instruction.instruction}</li>`;
    });

    suggestionDisplay.innerHTML = `
    <div class="suggestion-card">
      <h2>${recipe.name}</h2>
      <div class="recipe-info-grid">
        <div class="recipe-info-item">
          <span class="info-label">⏱️ Prep Time:</span>
          <span class="info-value">${recipe.prep_time} min</span>
        </div>
        <div class="recipe-info-item">
          <span class="info-label">🔥 Cook Time:</span>
          <span class="info-value">${recipe.cook_time} min</span>
        </div>
        <div class="recipe-info-item">
          <span class="info-label">⏲️ Total Time:</span>
          <span class="info-value">${recipe.total_time} min</span>
        </div>
        <div class="recipe-info-item">
          <span class="info-label">👥 Serves:</span>
          <span class="info-value">${recipe.serves} people</span>
        </div>
        <div class="recipe-info-item">
          <span class="info-label">📊 Difficulty:</span>
          <span class="info-value" style="color: ${getDifficultyColor(recipe.difficulty)}">${recipe.difficulty}</span>
        </div>
      </div>

      <div style="margin-bottom: 1.5rem;">
        <h3>Ingredients</h3>
        <ul class="ingredients-list">
          ${ingredientsList}
        </ul>
      </div>

      <div style="margin-bottom: 1.5rem;">
        <h3>Instructions</h3>
        <ol class="instructions-list">
          ${instructionsList}
        </ol>
      </div>

      ${recipe.recipe_link ? `<p style="margin-bottom: 1rem;"><a href="${recipe.recipe_link}" target="_blank" class="btn btn-secondary">View Full Recipe</a></p>` : ''}

      <div class="suggestion-actions">
        <a href="/recipe/${recipe.id}" class="btn btn-primary">Make This Recipe</a>
        <button onclick="getSuggestion()" class="btn btn-secondary">Get Another</button>
      </div>
    </div>
  `;
}

function displayMessage(message) {
    const suggestionDisplay = document.getElementById('suggestion-display');
    suggestionDisplay.innerHTML = `<p style="text-align: center; padding: 2rem;">${message}</p>`;
}

function getDifficultyColor(difficulty) {
    switch (difficulty) {
        case 'Easy':
            return '#27ae60';
        case 'Medium':
            return '#f39c12';
        case 'Hard':
            return '#e74c3c';
        default:
            return '#95a5a6';
    }
}

function updateHistory() {
    const historyList = document.getElementById('history-list');

    if (suggestionHistory.length === 0) {
        historyList.innerHTML = '<p>No suggestions yet</p>';
        return;
    }

    let html = '';
    suggestionHistory.forEach((recipe, index) => {
        html += `
      <div class="history-item">
        <span>${recipe.name}</span>
        <button onclick="goToHistoryItem(${index})">View</button>
      </div>
    `;
    });

    historyList.innerHTML = html;
}

function goToHistoryItem(index) {
    const recipe = suggestionHistory[index];
    displayRecipeSuggestion(recipe);
}

function showAllSeenModal() {
    document.getElementById('allSeenModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('allSeenModal').style.display = 'none';
}

async function continueSuggestions() {
    closeModal();
    try {
        await fetch('/api/reset-suggestion', {method: 'POST'});
        getSuggestion();
    } catch (error) {
        console.error('Error resetting suggestions:', error);
    }
}

// Close modal when clicking outside
window.onclick = function (event) {
    const modal = document.getElementById('allSeenModal');
    if (event.target === modal) {
        closeModal();
    }
};
