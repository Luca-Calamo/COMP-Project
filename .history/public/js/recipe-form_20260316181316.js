// Recipe form functionality
let ingredientCount = 1;
let instructionCount = 1;

function addIngredient() {
    const ingredientsList = document.getElementById('ingredients-list');
    const ingredientItem = document.createElement('div');
    ingredientItem.className = 'ingredient-item';
    ingredientItem.innerHTML = `
    <input type="text" name="ingredients[${ingredientCount}][name]" placeholder="Ingredient name" class="ingredient-input">
    <input type="number" name="ingredients[${ingredientCount}][quantity]" placeholder="Quantity" step="0.1" class="ingredient-input">
    <input type="text" name="ingredients[${ingredientCount}][unit]" placeholder="Unit (cups, g, etc.)" class="ingredient-input">
    <button type="button" class="btn btn-small btn-danger" onclick="removeIngredient(this)">Remove</button>
  `;
    ingredientsList.appendChild(ingredientItem);
    ingredientCount++;
}

function removeIngredient(button) {
    button.parentElement.remove();
}

function addInstruction() {
    const instructionsList = document.getElementById('instructions-list');
    const textarea = document.createElement('textarea');
    textarea.name = `instructions[${instructionCount}]`;
    textarea.placeholder = `Step ${instructionCount + 1}: Instructions...`;
    textarea.className = 'instruction-textarea';
    instructionsList.appendChild(textarea);
    instructionCount++;
}
