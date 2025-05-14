import { handle401 } from "./auth.js";
import { renderUserRolesChart, renderTopSkillsChart } from "./charts.js";
import { UserManager } from "./admin-users.js";
import { CVManager } from "./admin-cvs.js";

document.addEventListener("DOMContentLoaded", async () => {
 const token = localStorage.getItem("token");
 if (!token) {
   window.location.href = "login.html";
   return;
 }

 const headers = {
   Authorization: `Bearer ${token}`,
   "Content-Type": "application/json",
 };

 // Initialisation des gestionnaires
 const userManager = new UserManager();
 const cvManager = new CVManager();

 // Fonction pour charger les statistiques du dashboard
 async function loadDashboardStats() {
   try {
     // Charger les statistiques depuis l'API
     const statsResponse = await fetch("/admin/stats", { headers });
     
     if (!statsResponse.ok) {
       if (statsResponse.status === 401 || statsResponse.status === 403) {
         localStorage.removeItem("token");
         window.location.href = "login.html";
         return;
       }
       throw new Error('Erreur lors du chargement des statistiques');
     }

     const stats = await statsResponse.json();
     console.log('Statistiques reçues:', stats); // Debug

     // Mettre à jour les compteurs
     const nbUsers = document.getElementById('nb-users');
     const nbCandidats = document.getElementById('nb-candidats');
     const nbRecruteurs = document.getElementById('nb-recruteurs');
     const nbCvs = document.getElementById('nb-cvs');

     if (nbUsers) nbUsers.textContent = stats.totalUtilisateurs;
     if (nbCandidats) nbCandidats.textContent = stats.totalCandidats;
     if (nbRecruteurs) nbRecruteurs.textContent = stats.totalRecruteurs;
     if (nbCvs) nbCvs.textContent = stats.totalCVs;

     // Afficher le graphique de répartition des utilisateurs
     renderUserRolesChart({
       total: stats.totalUtilisateurs,
       candidats: stats.totalCandidats,
       recruteurs: stats.totalRecruteurs
     });

     // Charger les CVs pour le graphique des compétences
     const cvsResponse = await fetch("/admin/cvs", { headers });
     if (!cvsResponse.ok) throw new Error('Erreur lors du chargement des CVs');
     const cvs = await cvsResponse.json();

     // Compter les occurrences de chaque compétence dans les CVs
     const skillsCount = {};
     cvs.forEach(cv => {
       if (cv.competences && Array.isArray(cv.competences)) {
         cv.competences.forEach(skill => {
           if (skill && typeof skill === 'string') {
             skillsCount[skill] = (skillsCount[skill] || 0) + 1;
           }
         });
       }
     });

     // Trier les compétences par nombre d'occurrences
     const sortedSkills = Object.entries(skillsCount)
       .sort(([,a], [,b]) => b - a)
       .slice(0, 5); // Garder les 5 plus fréquentes

     // Formater les données pour le graphique
     const skillsData = {
       labels: sortedSkills.map(([skill]) => skill),
       counts: sortedSkills.map(([,count]) => count)
     };

     console.log('Données des compétences:', skillsData); // Debug

     // Afficher le graphique des compétences
     renderTopSkillsChart(skillsData);

   } catch (error) {
     console.error('Erreur chargement dashboard:', error);
     showAdminMessage('Erreur lors du chargement des statistiques', 'error');
   }
 }

 // Charger les statistiques au chargement de la page
 await loadDashboardStats();

 // Gestion de la déconnexion
 const logoutBtn = document.getElementById('logout-btn');
 if (logoutBtn) {
   logoutBtn.addEventListener('click', () => {
     localStorage.removeItem('token');
     showAdminMessage('Déconnexion réussie', 'success');
     setTimeout(() => {
       window.location.href = 'login.html';
     }, 1000);
   });
 }

 // Navigation entre onglets
 document.querySelectorAll(".admin-sidebar nav a").forEach(link => {
   link.addEventListener("click", () => {
     document.querySelectorAll(".admin-sidebar nav a").forEach(l => l.classList.remove("active"));
     link.classList.add("active");
     document.querySelectorAll(".admin-section").forEach(sec => sec.classList.remove("active"));
     document.getElementById(link.dataset.section).classList.add("active");
   });
 });
});

// ✅ Message admin réutilisable
function showAdminMessage(message, type = "success") {
 const msg = document.createElement("div");
 msg.className = `admin-message ${type}`;
 msg.textContent = message;
 document.querySelector(".admin-main").prepend(msg);
 setTimeout(() => msg.remove(), 3000);
}

function getInitials(name) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function showAlert(message, type = 'info') {
  const alertContainer = document.getElementById('alert-container');
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = message;
  
  alertContainer.appendChild(alert);
  
  setTimeout(() => {
    alert.remove();
  }, 3000);
}