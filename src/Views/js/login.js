// Récupérer le formulaire
const loginForm = document.getElementById('login-form');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Récupérer les données du formulaire
    const email = e.target.email.value;
    const password = e.target.password.value;
    
    try {
        // Appel à l'API
        const res = await fetch('/utilisateurs/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            let errorMessage = "Erreur lors de la connexion.";
            
            if (res.status === 401) {
                errorMessage = "Email ou mot de passe incorrect.";
            } else if (res.status === 400) {
                errorMessage = "Requête invalide. Vérifiez vos champs.";
            }
            
            throw new Error(errorMessage);
        }
        
        // Stocker le token
        localStorage.setItem('token', data.token);
        
        // Message de succès avant redirection
        showAlert("Connexion réussie !", "success");
        
        // Rediriger selon le rôle
        if (data.utilisateur.role === 'candidat') {
            window.location.href = 'dashboard.html';
        } else if (data.utilisateur.role === 'recruteur') {
            window.location.href = 'recruteur.html';
        } else if (data.utilisateur.role === 'admin') {
            window.location.href = 'admin.html';
        }
        
    } catch (err) {
        showAlert(err.message, 'error');
    }
});

function showAlert(message, type = "error") {
  const container = document.querySelector(".alert-container");
  
  // Créer l'alerte
  const alert = document.createElement("div");
  alert.className = `enhanced-alert ${type}`;
  alert.setAttribute("role", "alert");
  
  // Choisir l'icône selon le type
  const icon = type === "success" ? 
    '<svg class="alert-icon success" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>' : 
    '<svg class="alert-icon error" viewBox="0 0 24 24"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg>';

  // Structure de l'alerte
  alert.innerHTML = `
    <div class="alert-content">
      ${icon}
      <span class="alert-message">${message}</span>
    </div>
    <button class="alert-close" onclick="this.parentElement.remove()">
      <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
    </button>
  `;

  // Ajouter au container
  container.appendChild(alert);

  // Animation d'entrée
  setTimeout(() => alert.classList.add("show"), 10);

  // Auto-fermeture après 5 secondes
  setTimeout(() => {
    alert.classList.remove("show");
    alert.classList.add("hide");
    setTimeout(() => alert.remove(), 300);
  }, 5000);
}

