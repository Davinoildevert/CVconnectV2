document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('admin-login-form');
  const messageDiv = document.getElementById('admin-login-message');

  // Vérifier si déjà connecté avec un token admin valide
  const token = localStorage.getItem('token');
  if (token) {
    // Vérifier que c'est bien un token admin valide
    fetch('/admin/utilisateurs', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(res => {
      if (res.status === 401 || res.status === 403) {
        // Token invalide ou non admin, on le supprime
        localStorage.removeItem('token');
        messageDiv.textContent = 'Session expirée, veuillez vous reconnecter';
        messageDiv.className = 'error';
      } else if (res.ok) {
        // Token admin valide, redirection
        window.location.href = 'admin.html';
      }
    })
    .catch(() => {
      // Erreur de connexion, on supprime le token
      localStorage.removeItem('token');
      messageDiv.textContent = 'Erreur de connexion au serveur';
      messageDiv.className = 'error';
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const key = document.getElementById('admin-key').value;

    try {
      const response = await fetch('/admin/login-dev', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        messageDiv.textContent = 'Connexion réussie !';
        messageDiv.className = 'success';
        setTimeout(() => {
          window.location.href = 'admin.html';
        }, 1000);
      } else {
        messageDiv.textContent = data.message || 'Erreur de connexion';
        messageDiv.className = 'error';
      }
    } catch (error) {
      messageDiv.textContent = 'Erreur de connexion au serveur';
      messageDiv.className = 'error';
    }
  });
}); 