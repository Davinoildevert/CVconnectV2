import { handle401 } from "./auth.js";

let currentCVs = [];
let favoris = [];

function showAlert(message, type = 'info') {
  // Supprimer les alertes existantes pour éviter les doublons
  const existingAlerts = document.querySelectorAll('.alert');
  existingAlerts.forEach(alert => alert.remove());
  
  const alertContainer = document.createElement('div');
  alertContainer.className = `alert alert-${type}`;
  
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'info' ? 'ℹ️' : '⚠️';
  
  alertContainer.innerHTML = `
    <span class="alert-icon">${icon}</span>
    <span class="alert-message">${message}</span>
  `;
  
  document.body.appendChild(alertContainer);
  
  setTimeout(() => {
    alertContainer.classList.add('alert-slide-out');
    setTimeout(() => alertContainer.remove(), 300);
  }, 3000);
}

function getInitials(name) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Fonction pour charger les favoris
async function loadFavoris() {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("Token manquant");
    showAlert("Veuillez vous reconnecter", "error");
    setTimeout(() => window.location.href = "login.html", 2000);
    return [];
  }

  try {
    const res = await fetch("/cvs/favoris", {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Lire le corps de la réponse une seule fois
    let data;
    try {
      data = await res.json();
    } catch (err) {
      console.error("Erreur parsing JSON:", err);
      data = {};
    }

    // Debug de la réponse
    if (!res.ok) {
      console.error("Détails de l'erreur:", {
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        data: data
      });
    }

    if (!res.ok) {
      if (res.status === 401) {
        showAlert("Session expirée, veuillez vous reconnecter", "error");
        setTimeout(() => window.location.href = "login.html", 2000);
        return [];
      }
      if (res.status === 403) {
        showAlert("Accès non autorisé", "error");
        return [];
      }
      if (res.status === 400) {
        showAlert(data.message || "Erreur lors du chargement des favoris", "error");
        return [];
      }
      throw new Error("Impossible de charger les favoris");
    }

    favoris = data;
    
    // Mettre à jour le compteur
    const count = document.getElementById("favoris-count");
    if (count) count.textContent = favoris.length;
    
    // Mettre à jour la liste dans la modale
    renderFavorisList();
    
    return favoris;
  } catch (err) {
    console.error("Erreur loadFavoris:", err);
    showAlert("Erreur lors du chargement des favoris", "error");
    return [];
  }
}

// Fonction pour ajouter/retirer des favoris
async function toggleFavori(cvId) {
  event.stopPropagation(); // Empêcher la propagation au parent (carte CV)
  
  const token = localStorage.getItem("token");
  const isFavori = favoris.some(f => f.cvId === cvId);
  const cv = currentCVs.find(c => c.id === cvId);
  
  if (isFavori) {
    // Demander confirmation pour retirer des favoris
    if (!confirm(`Voulez-vous retirer le CV "${cv?.titre || 'ce CV'}" de vos favoris ?`)) {
      return;
    }
  }
  
  try {
    const res = await fetch(`/cvs/favoris${isFavori ? `/${cvId}` : ''}`, {
      method: isFavori ? 'DELETE' : 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: isFavori ? undefined : JSON.stringify({ cvId })
    });

    if (!res.ok) {
      if (res.status === 409) {
        showAlert("Ce CV est déjà dans vos favoris", "info");
        return;
      }
      throw new Error("Erreur lors de la modification des favoris");
    }

    // Recharger les favoris
    await loadFavoris();
    
    // Mettre à jour l'interface
    const btn = document.querySelector(`button[data-cv-id="${cvId}"]`);
    if (btn) {
      btn.classList.toggle('active', !isFavori);
    }
    
    showAlert(
      isFavori 
        ? `Le CV "${cv?.titre || 'ce CV'}" a été retiré de vos favoris` 
        : `Le CV "${cv?.titre || 'ce CV'}" a été ajouté à vos favoris`,
      'success'
    );
    
  } catch (err) {
    console.error("Erreur toggleFavori:", err);
    showAlert(err.message, "error");
  }
}

// Fonction pour afficher la liste des favoris dans la modale
function renderFavorisList() {
  const container = document.getElementById("favoris-list");
  
  if (!favoris || !favoris.length) {
    container.innerHTML = `
      <div class="no-results">
        <p>🌟 Vous n'avez pas encore de CV en favoris.</p>
        <p class="hint">Les CVs que vous ajoutez en favoris apparaîtront ici.</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = favoris.map(fav => {
    const initials = fav.utilisateur?.nom ? getInitials(fav.utilisateur.nom) : '??';
    
    return `
      <div class="cv-card">
        <div class="cv-header">
          <div class="header-left">
            <div class="profile-photo profile-initials">${initials}</div>
            <div class="header-info">
              <h2>${fav.titre || 'Sans titre'}</h2>
              <span class="candidate-name">${fav.utilisateur?.nom || 'Candidat'}</span>
              <span class="fav-date">Ajouté le ${new Date(fav.date).toLocaleDateString()}</span>
            </div>
          </div>
          <button onclick="toggleFavori(${fav.cvId})" class="btn-favori active" data-cv-id="${fav.cvId}">
            <span>⭐</span>
          </button>
        </div>
        <div class="cv-actions">
          <button class="btn-view-cv" onclick="window.location.href='cv-detail.html?id=${fav.cvId}'">
            <span>Voir le CV complet</span>
            <span class="icon">→</span>
          </button>
        </div>
      </div>
    `;
  }).join("");
}

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  // Charger les CVs
  try {
    const res = await fetch("/cvs", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Erreur chargement des CVs.");
    currentCVs = await res.json();
    renderFeed(currentCVs);
    
    // Charger les favoris
    await loadFavoris();

    // Charger les messages non lus
    const resMessages = await fetch("/messages/non-lus", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (resMessages.ok) {
      const messagesNonLus = await resMessages.json();
      const messagesCount = document.getElementById("messages-count");
      if (messagesCount) {
        messagesCount.textContent = messagesNonLus.length;
        messagesCount.style.display = messagesNonLus.length > 0 ? "inline-block" : "none";
      }
    }
  } catch (err) {
    showAlert(err.message, 'error');
    document.getElementById("cv-feed").innerHTML = `<p class="error-message">❌ ${err.message}</p>`;
  }

  // Gestion de la recherche
  const searchForm = document.getElementById("search-form");
  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = document.getElementById("search-input");
      const competence = input?.value.trim();
      if (competence) {
        window.location.href = `resultats.html?competence=${encodeURIComponent(competence)}`;
      }
    });
  }

  // Gestion du bouton messages
  const btnMessages = document.getElementById("show-messages-btn");
  if (btnMessages) {
    btnMessages.addEventListener("click", () => {
      window.location.href = "messages.html";
    });
  }

  // Gestion de la modale des favoris
  const modal = document.getElementById("favoris-modal");
  const btnShowFavoris = document.getElementById("show-favoris-btn");
  const btnCloseFavoris = document.getElementById("close-favoris-modal");

  btnShowFavoris.addEventListener("click", () => {
    modal.style.display = "flex";
  });

  btnCloseFavoris.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Fermer la modale en cliquant en dehors
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });
});

function renderFeed(cvs) {
  const container = document.getElementById("cv-feed");

  if (!Array.isArray(cvs) || cvs.length === 0) {
    container.innerHTML = "<p class='no-results'>Aucun CV trouvé.</p>";
    return;
  }

  container.innerHTML = cvs.map(cv => {
    const isFavori = favoris.some(f => f.cvId === cv.id);
    const tags = cv.competences
      .slice(0, 3)
      .map(c => `<span class="tag">${c}</span>`)
      .join("");

    const description = cv.description 
      ? cv.description.length > 150 
        ? cv.description.substring(0, 150) + '...'
        : cv.description
      : 'Aucune description fournie.';

    const latestExperience = cv.experiences && cv.experiences.length > 0
      ? `<p class="latest-experience">💼 ${cv.experiences[0]}</p>`
      : '';

    const latestFormation = cv.formations && cv.formations.length > 0
      ? `<p class="latest-formation">🎓 ${cv.formations[0]}</p>`
      : '';

    const photoHtml = cv.photo 
      ? `<div class="profile-photo" style="background-image: url('${cv.photo}')"></div>`
      : `<div class="profile-photo profile-initials">${getInitials(cv.utilisateur.nom)}</div>`;

    return `
      <div class="cv-card style-${cv.style || 'classique'}" onclick="window.location.href='cv-detail.html?id=${cv.id}'">
        <div class="cv-header">
          <div class="header-left">
            ${photoHtml}
            <div class="header-info">
              <h2>${cv.titre}</h2>
              <span class="candidate-name">${cv.utilisateur.nom}</span>
            </div>
          </div>
          <button onclick="toggleFavori(${cv.id})" class="btn-favori ${isFavori ? 'active' : ''}" data-cv-id="${cv.id}">
            <span>⭐</span>
          </button>
        </div>

        <div class="cv-preview-content">
          <p class="description">${description}</p>
          ${latestFormation}
          ${latestExperience}
          <div class="cv-tags">${tags}</div>
        </div>

        <div class="cv-actions">
          <button class="btn-view-cv" onclick="event.stopPropagation(); window.location.href='cv-detail.html?id=${cv.id}'">
            <span>Voir le CV complet</span>
            <span class="icon">→</span>
          </button>
        </div>
      </div>
    `;
  }).join("");
}

// Rendre la fonction toggleFavori globale pour l'utiliser dans le HTML
window.toggleFavori = toggleFavori;
