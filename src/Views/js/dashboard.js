import { handle401 } from "./auth.js";

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  // Gestion des modales
  const profileModal = document.getElementById('profile-modal');
  const passwordModal = document.getElementById('password-modal');
  const guideModal = document.getElementById('guide-modal');
  const suggestionModal = document.getElementById('suggestion-modal');

  // Liens du menu profil
  const profileLink = document.getElementById('profile-link');
  const passwordLink = document.getElementById('password-link');
  const guideLink = document.getElementById('guide-link');
  const suggestionBtn = document.getElementById('open-suggestion-btn');

  // Boutons de fermeture
  const closeProfileModal = document.getElementById('close-profile-modal');
  const closePasswordModal = document.getElementById('close-password-modal');
  const closeGuideModal = document.getElementById('close-guide-modal');
  const closeSuggestionModal = document.getElementById('close-suggestion-modal');

  // Gestion du profil
  profileLink.addEventListener('click', (e) => {
    e.preventDefault();
    profileModal.classList.add('show');
  });

  closeProfileModal.addEventListener('click', () => {
    profileModal.classList.remove('show');
  });

  // Gestion du changement de mot de passe
  passwordLink.addEventListener('click', (e) => {
    e.preventDefault();
    passwordModal.classList.add('show');
  });

  closePasswordModal.addEventListener('click', () => {
    passwordModal.classList.remove('show');
  });

  // Gestion du guide
  guideLink.addEventListener('click', (e) => {
    e.preventDefault();
    guideModal.classList.add('show');
  });

  closeGuideModal.addEventListener('click', () => {
    guideModal.classList.remove('show');
  });

  // Gestion de la modale de suggestion
  suggestionBtn.addEventListener('click', () => {
    suggestionModal.classList.add('show');
  });

  closeSuggestionModal.addEventListener('click', () => {
    suggestionModal.classList.remove('show');
  });

  // Gestion des onglets du guide
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Retirer la classe active de tous les boutons et contenus
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      // Ajouter la classe active au bouton cliqué
      btn.classList.add('active');

      // Afficher le contenu correspondant
      const tabId = btn.getAttribute('data-tab');
      document.getElementById(`${tabId}-tab`).classList.add('active');
    });
  });

  // Gestion de la modale de suggestion
  const suggestionForm = document.getElementById('suggestion-form');
  suggestionForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const type = document.getElementById('suggestion-type').value;
    const contenu = document.getElementById('suggestion-content').value;

    try {
      const response = await fetch('/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type, contenu })
      });

      if (response.ok) {
        showAlert('Suggestion envoyée avec succès !', 'success');
        suggestionModal.classList.remove('show');
        suggestionForm.reset();
      } else {
        const data = await response.json();
        showAlert(data.message || 'Erreur lors de l\'envoi de la suggestion', 'error');
      }
    } catch (error) {
      console.error('Erreur:', error);
      showAlert('Erreur lors de l\'envoi de la suggestion', 'error');
    }
  });

  // Fermer les modales en cliquant en dehors
  window.addEventListener('click', (e) => {
    if (e.target === profileModal) {
      profileModal.classList.remove('show');
    }
    if (e.target === passwordModal) {
      passwordModal.classList.remove('show');
    }
    if (e.target === guideModal) {
      guideModal.classList.remove('show');
    }
    if (e.target === suggestionModal) {
      suggestionModal.classList.remove('show');
    }
  });

  // Gestion de la déconnexion
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      showAlert('Déconnexion réussie', 'success');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1000);
    });
  }

  try {
    // 1. Profil utilisateur
    const resUser = await fetch("/utilisateurs/me", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (handle401(resUser)) return;

    const user = await resUser.json();
    if (!user || user.role !== "candidat") {
      localStorage.removeItem("token");
      return window.location.href = "login.html";
    }

    document.getElementById("welcome-title").textContent = `Bienvenue ${user.nom} 👋`;
    document.getElementById("user-role").textContent = user.role;

    // Mettre à jour l'affichage dans la navbar
    const profileName = document.querySelector('.profile-name');
    if (profileName) {
      profileName.textContent = user.nom;
    }
    
    const profileInitials = document.querySelector('.profile-initials');
    if (profileInitials) {
      profileInitials.textContent = getInitials(user.nom);
    }

    // Pré-remplir le formulaire de profil
    console.log('Données utilisateur:', user);
    document.getElementById('nom').value = user.nom;
    document.getElementById('email').value = user.email;
    
    // Récupérer la date de naissance depuis les données utilisateur
    if (user.date_naissance) {
      console.log('Date de naissance trouvée:', user.date_naissance);
      const dateInput = document.getElementById('dateNaissance');
      dateInput.value = user.date_naissance;
      console.log('Valeur du champ date:', dateInput.value);
    } else {
      console.log('Pas de date de naissance trouvée');
    }

    // Récupérer le téléphone depuis le CV
    const resCV = await fetch(`/utilisateurs/${user.id}/cv`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (resCV.ok) {
      const cvData = await resCV.json();
      console.log('Données CV:', cvData);
      const phoneInput = document.getElementById('telephone');
      if (cvData && cvData.telephone) {
        console.log('Téléphone trouvé:', cvData.telephone);
        phoneInput.value = cvData.telephone;
        console.log('Valeur du champ téléphone:', phoneInput.value);
      } else {
        console.log('Pas de téléphone trouvé dans le CV');
        phoneInput.value = '';
      }
    } else {
      console.log('Erreur lors de la récupération du CV:', resCV.status);
    }

    // Désactiver le bouton de création de CV si un CV existe déjà
    const btnCreate = document.getElementById("btn-create-cv");
    if (resCV.status === 200) {
      btnCreate.classList.add("disabled");
      btnCreate.style.pointerEvents = "none";
      btnCreate.style.opacity = "0.6";
      btnCreate.title = "Vous avez déjà un CV.";
    }

    // 3. Favoris (intérêt des recruteurs)
    const resNotif = await fetch("/cvs/notifications", {
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    const list = document.getElementById("notifications-list");
    const badgeFav = document.getElementById("badge-favoris");
    const listFav = document.getElementById("favoris-list");

    list.innerHTML = "";

    if (resNotif.ok) {
      const notifs = await resNotif.json();
      
      // Filtrer les notifications qui concernent les favoris
      const favoris = notifs.filter(n => n.message.includes("favori"));

      // Ne compter que les notifications non lues
      const favorisNonLus = favoris.filter(n => !n.lu);

      if (favoris.length > 0) {
        // Afficher le badge uniquement s'il y a des notifications non lues
        if (favorisNonLus.length > 0) {
          badgeFav.textContent = favorisNonLus.length;
          badgeFav.style.display = "inline-block";
        } else {
          badgeFav.style.display = "none";
        }

        favoris.forEach(n => {
          const li = document.createElement("li");
          li.textContent = `⭐ ${n.message} • ${formatDate(n.date)}`;
          list.appendChild(li);
        });

        listFav.innerHTML = "";
        favoris.forEach(n => {
          const li = document.createElement("li");
          li.textContent = `⭐ ${n.message} • ${formatDate(n.date)}`;
          listFav.appendChild(li);
        });
      } else {
        list.innerHTML = `<li class="disabled">Aucun recruteur n'a encore ajouté votre profil en favori.</li>`;
        listFav.innerHTML = `<li class="disabled">Aucun favori pour le moment.</li>`;
      }
    } else {
      list.innerHTML = `<li class="disabled">Aucun recruteur intéréssé</li>`;
      listFav.innerHTML = `<li class="disabled">Aucun recruteur intéréssé</li>`;
    }

    // Modale favoris
    const modalFav = document.getElementById("modal-favoris");
    document.getElementById("open-favoris-btn").onclick = () => {
      modalFav.style.display = "flex";
      badgeFav.style.display = "none";
    };
    document.getElementById("close-favoris-btn").onclick = () => {
      modalFav.style.display = "none";
    };

  } catch (err) {
    console.error("Erreur globale:", err);
    alert("Erreur lors du chargement du dashboard.");
    localStorage.removeItem("token");
    window.location.href = "login.html";
  }
});

function getInitials(name) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
