async function deleteRecipe(recipeId) {
    if (!confirm('Are you sure you want to delete this recipe?')) {
        return;
    }

    try {
        const response = await fetch(`/recipe/delete/${recipeId}`, {
            method: 'POST',
        });

        const data = await response.json();

        if (data.success) {
            // Reload the page to show updated recipes
            location.reload();
        } else {
            alert('Error deleting recipe: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error deleting recipe');
    }
}
