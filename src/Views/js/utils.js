// Validation des formulaires
function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

// Gestion des messages d'erreur/succès
function showAlert(message, type = 'error') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `enhanced-alert ${type}`;
    
    // Emoji selon le type
    const emoji = type === 'success' ? '✅' : '⚠️';
    
    alertDiv.innerHTML = `
        <span class="icon">${emoji}</span>
        <span class="message">${message}</span>
    `;
    
    // Ajouter l'alerte au conteneur ou au body
    const container = document.querySelector('.alert-container') || document.body;
    container.appendChild(alertDiv);
    
    // Supprimer après 3 secondes
    setTimeout(() => {
        alertDiv.classList.add('fade-out');
        setTimeout(() => alertDiv.remove(), 300);
    }, 3000);
}

// Validation générique de formulaire
function validateForm(formElement) {
    const errors = [];
    
    // Parcourir tous les champs requis
    formElement.querySelectorAll('[required]').forEach(field => {
        if (!field.value.trim()) {
            errors.push(`Le champ ${field.name || 'requis'} ne peut pas être vide`);
        }
        
        // Validation spécifique pour email
        if (field.type === 'email' && !validateEmail(field.value)) {
            errors.push('Format d\'email invalide');
        }
        
        // Validation spécifique pour mot de passe
        if (field.type === 'password' && !validatePassword(field.value)) {
            errors.push('Le mot de passe doit contenir au moins 6 caractères');
        }
    });
    
    return errors;
} 