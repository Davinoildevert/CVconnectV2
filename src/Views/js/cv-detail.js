import { handle401 } from "./auth.js";

let currentCV = null;
let favoris = [];

// Fonction pour vérifier si un CV est en favori
async function checkFavoriStatus(cvId) {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`/cvs/favoris/check/${cvId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) return false;
    const data = await res.json();
    return data.isFavori;
  } catch (err) {
    console.error("Erreur checkFavoriStatus:", err);
    return false;
  }
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
    
    // Mettre à jour la liste dans la modale
    renderFavorisList();
    
    return favoris;
  } catch (err) {
    console.error("Erreur loadFavoris:", err);
    showAlert("Erreur lors du chargement des favoris", "error");
    return [];
  }
}

// Fonction pour nettoyer les alertes existantes
function clearAlerts() {
  const container = document.getElementById("alert-container");
  container.innerHTML = "";
}

// Fonction pour afficher une alerte
function showAlert(message, type = "info") {
  clearAlerts();
  const container = document.getElementById("alert-container");
  const alert = document.createElement("div");
  alert.className = `alert alert-${type}`;
  alert.textContent = message;
  container.appendChild(alert);
  
  setTimeout(() => {
    alert.remove();
  }, 5000);
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
              <h3>${fav.titre || 'Sans titre'}</h3>
              <span class="candidate-name">${fav.utilisateur?.nom || 'Candidat'}</span>
              <span class="fav-date">Ajouté le ${new Date(fav.date).toLocaleDateString()}</span>
            </div>
          </div>
          <button onclick="toggleFavori(${fav.cvId})" class="btn-favori active" title="Retirer des favoris">
            ⭐
          </button>
        </div>
        <div class="cv-actions">
          <a href="cv-detail.html?id=${fav.cvId}" class="btn-view-cv">
            <span>Voir le CV complet</span>
            <span class="icon">→</span>
          </a>
        </div>
      </div>
    `;
  }).join("");
}

// Fonction pour obtenir les initiales
function getInitials(name) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Fonction pour gérer les favoris
async function toggleFavori(cvId) {
  const token = localStorage.getItem("token");
  const isFavori = await checkFavoriStatus(cvId);
  
  if (isFavori) {
    if (!confirm("Voulez-vous retirer ce CV de vos favoris ?")) {
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

    const data = await res.json();

    if (!res.ok) {
      if (res.status === 409) {
        showAlert("Ce CV est déjà dans vos favoris", "info");
        return;
      }
      throw new Error(data.message || "Une erreur est survenue");
    }
    
    // Mettre à jour l'état du bouton
    const favBtn = document.getElementById("fav-btn");
    if (isFavori) {
      favBtn.classList.remove('active');
      favBtn.textContent = "⭐ Ajouter aux favoris";
      showAlert("CV retiré des favoris", "info");
    } else {
      favBtn.classList.add('active');
      favBtn.textContent = "⭐ Retirer des favoris";
      showAlert("CV ajouté aux favoris", "success");
    }
    
    // Si la modale est ouverte, recharger la liste
    const modal = document.getElementById("favoris-modal");
    if (modal.style.display === "flex") {
      await loadFavoris();
    }
    
  } catch (err) {
    console.error("Erreur toggleFavori:", err);
    showAlert(err.message || "Une erreur est survenue lors de la modification des favoris", "error");
  }
}

// Rendre la fonction toggleFavori accessible depuis le HTML
window.toggleFavori = toggleFavori;

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const params = new URLSearchParams(window.location.search);
  const cvId = params.get("id");

  if (!token || !cvId) {
    document.querySelector(".cv-preview").innerHTML = "<p>❌ Accès invalide.</p>";
    return;
  }

  try {
    // Charger le CV
    const res = await fetch(`/cvs/${cvId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      if (res.status === 401) {
        showAlert("Session expirée, veuillez vous reconnecter", "error");
        setTimeout(() => window.location.href = "login.html", 2000);
        return;
      }
      throw new Error("Impossible de charger ce CV.");
    }

    currentCV = await res.json();
    
    // Mettre à jour l'interface avec les données du CV
    renderCV(currentCV);
    
    // Vérifier si le CV est en favori
    const isFavori = await checkFavoriStatus(currentCV.id);
    const favBtn = document.getElementById("fav-btn");
    if (isFavori) {
      favBtn.classList.add('active');
      favBtn.textContent = "⭐ Retirer des favoris";
    } else {
      favBtn.classList.remove('active');
      favBtn.textContent = "⭐ Ajouter aux favoris";
    }

    // Gestion du bouton favori
    favBtn.addEventListener("click", async () => {
      await toggleFavori(currentCV.id);
    });

    // Gestion de la modale des favoris
    const modal = document.getElementById("favoris-modal");
    const btnShowFavoris = document.getElementById("show-favoris-btn");
    const btnCloseFavoris = document.getElementById("close-favoris-modal");

    btnShowFavoris.addEventListener("click", async (e) => {
      e.preventDefault();
      modal.style.display = "flex";
      // Charger les favoris uniquement quand on ouvre la modale
      await loadFavoris();
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

    // Boutons d'action
    document.getElementById("contact-btn").addEventListener("click", () => {
      window.location.href = `messages.html?userId=${currentCV.utilisateur.id}`;
    });

    document.getElementById("download-btn").addEventListener("click", () => {
      showAlert("La fonction de téléchargement sera bientôt disponible !", 'info');
    });

  } catch (err) {
    console.error("Erreur:", err);
    document.querySelector(".cv-preview").innerHTML = `<p>❌ ${err.message}</p>`;
    showAlert(err.message, 'error');
  }
});

function renderList(title, items) {
  if (!Array.isArray(items) || items.length === 0) return "";
  return `<h3>${title}</h3><ul>${items.map(i => `<li>${i}</li>`).join("")}</ul>`;
}

function renderCV(cv) {
  // Appliquer le style choisi
  const container = document.getElementById("cv-container");
  container.className = `cv-preview style-${cv.style || 'classique'}`;

  // Informations de base
  document.getElementById("cv-title").textContent = cv.titre;
  document.getElementById("cv-nom").textContent = cv.utilisateur.nom;
  document.getElementById("cv-email").textContent = cv.utilisateur.email;
  document.getElementById("cv-phone").textContent = cv.telephone || "Non renseigné";
  document.getElementById("cv-adresse").textContent = cv.adresse || "Non renseignée";

  // Photo ou initiales
  const photoDiv = document.querySelector(".profile-photo");
  if (cv.photo) {
    photoDiv.style.backgroundImage = `url('${cv.photo}')`;
    photoDiv.style.backgroundSize = "cover";
    photoDiv.style.backgroundPosition = "center";
  } else {
    const initials = cv.utilisateur.nom
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    photoDiv.textContent = initials;
    photoDiv.style.display = "flex";
    photoDiv.style.alignItems = "center";
    photoDiv.style.justifyContent = "center";
    photoDiv.style.fontWeight = "bold";
    photoDiv.style.color = "#4b5563";
    photoDiv.style.backgroundColor = "#e5e7eb";
  }

  // Description
  const descriptionP = document.querySelector(".profile-description p");
  if (descriptionP) {
    descriptionP.textContent = cv.description || "Aucune description fournie.";
  }

  // Colonnes de contenu
  document.getElementById("cv-left").innerHTML =
    renderList("Formations", cv.formations) +
    renderList("Expériences", cv.experiences);

  document.getElementById("cv-right").innerHTML =
    renderList("Compétences", cv.competences) +
    renderList("Langues", cv.langues) +
    renderList("Soft Skills", cv.softskills);

  // Calcul de l'âge
  if (cv.utilisateur.dateNaissance) {
    const birth = new Date(cv.utilisateur.dateNaissance);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;

    document.getElementById("cv-age").textContent = `${age} ans`;
  } else {
    document.getElementById("cv-age").textContent = "Non renseigné";
  }
}
