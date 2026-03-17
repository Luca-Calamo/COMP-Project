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
            // Redirect to dashboard after successful delete
            window.location.href = '/dashboard';
        } else {
            alert('Error deleting recipe: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error deleting recipe');
    }
}

// Allow checkbox interaction for ingredient tracking
document
    .querySelectorAll('.ingredients-list input[type="checkbox"]')
    .forEach((checkbox) => {
        checkbox.addEventListener('change', function () {
            this.parentElement.style.opacity = this.checked ? '0.5' : '1';
            this.parentElement.style.textDecoration = this.checked
                ? 'line-through'
                : 'none';
        });
    });

document
    .querySelectorAll('.instructions-list input[type="checkbox"]')
    .forEach((checkbox) => {
        checkbox.addEventListener('change', function () {
            this.parentElement.style.opacity = this.checked ? '0.5' : '1';
            this.parentElement.style.textDecoration = this.checked
                ? 'line-through'
                : 'none';
        });
    });
