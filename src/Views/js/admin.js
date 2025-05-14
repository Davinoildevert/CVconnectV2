import { handle401 } from "./auth.js";
import { renderUserRolesChart, renderTopSkillsChart } from "./charts.js";
import { UserManager } from "./admin-users.js";

document.addEventListener("DOMContentLoaded", () => {
 const token = localStorage.getItem("token");
 if (!token) {
   window.location.href = "admin-login.html";
   return;
 }

 const headers = {
   Authorization: `Bearer ${token}`,
   "Content-Type": "application/json",
 };

 // Vérifier que c'est bien un token admin et charger les données
 fetch("/admin/utilisateurs", { headers })
   .then(res => {
     if (res.status === 401 || res.status === 403) {
       localStorage.removeItem("token");
       window.location.href = "admin-login.html";
       return;
     }
     return res.json();
   })
   .then(users => {
     if (!users) return;
     
     // Calculer la répartition des utilisateurs
     const stats = {
       candidats: users.filter(u => u.role === 'candidat').length,
       recruteurs: users.filter(u => u.role === 'recruteur').length
     };

     // Afficher le graphique de répartition
     renderUserRolesChart(stats);

     // Initialiser la gestion des utilisateurs
     const userManager = new UserManager();
   });

 // Déconnexion
 document.getElementById("logout-btn").addEventListener("click", () => {
   localStorage.removeItem("token");
   window.location.href = "admin-login.html";
 });

 // Navigation entre onglets
 document.querySelectorAll(".admin-sidebar nav a").forEach(link => {
   link.addEventListener("click", () => {
     document.querySelectorAll(".admin-sidebar nav a").forEach(l => l.classList.remove("active"));
     link.classList.add("active");
     document.querySelectorAll(".admin-section").forEach(sec => sec.classList.remove("active"));
     document.getElementById(link.dataset.section).classList.add("active");
   });
 });

 // --- CVS et Compétences ---
 fetch("/admin/cvs", { headers })
   .then(res => res.json())
   .then(cvs => {
     // Mettre à jour le compteur de CVs
     document.getElementById('nb-cvs').textContent = cvs.length;

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

     console.log('Données des compétences:', skillsData); // Pour debug
     renderTopSkillsChart(skillsData);
   });

 // --- COMPÉTENCES ---
 fetch("/competences", { headers })
   .then(res => res.json())
   .then(competences => {
     // Afficher les compétences
     const competenceList = document.getElementById('competence-list');
     competenceList.innerHTML = competences.map(comp => `
       <li>
         <span>${comp.nom}</span>
         <button class="delete" onclick="deleteCompetence(${comp.id})">
           <i class="fas fa-times"></i>
         </button>
       </li>
     `).join('');

     // Trier les compétences par nombre d'utilisations
     const sortedSkills = competences
       .sort((a, b) => b.nombre_utilisations - a.nombre_utilisations)
       .slice(0, 5); // Garder les 5 plus utilisées

     // Formater les données pour le graphique
     const skillsData = {
       labels: sortedSkills.map(comp => comp.nom),
       counts: sortedSkills.map(comp => comp.nombre_utilisations)
     };

     // Ne pas recréer le graphique ici car il est déjà créé dans la section CVs
     // renderTopSkillsChart(skillsData);
   });

 // --- AJOUT COMPÉTENCE ---
 document.getElementById("add-competence-form").addEventListener("submit", (e) => {
   e.preventDefault();
   const input = document.getElementById("competence-input");
   const nom = input.value.trim();
   if (!nom) return;

   fetch("/competences", {
     method: "POST",
     headers,
     body: JSON.stringify({ nom })
   })
     .then(res => {
       if (!res.ok) throw new Error('Erreur lors de l\'ajout de la compétence');
       return res.json();
     })
     .then(() => {
       input.value = "";
       showAdminMessage("Compétence ajoutée avec succès", "success");
       // Recharger la liste des compétences
       fetch("/competences", { headers })
         .then(res => res.json())
         .then(competences => {
           const competenceList = document.getElementById('competence-list');
           competenceList.innerHTML = competences.map(comp => `
             <li>
               <span>${comp.nom}</span>
               <button class="delete" onclick="deleteCompetence(${comp.id})">
                 <i class="fas fa-times"></i>
               </button>
             </li>
           `).join('');
         });
     })
     .catch(error => {
       showAdminMessage(error.message, "error");
     });
 });

 // Fonction pour supprimer une compétence
 window.deleteCompetence = function(id) {
   if (!confirm('Êtes-vous sûr de vouloir supprimer cette compétence ?')) return;

   fetch(`/competences/${id}`, {
     method: "DELETE",
     headers
   })
     .then(res => {
       if (!res.ok) throw new Error('Erreur lors de la suppression de la compétence');
       return res.json();
     })
     .then(() => {
       showAdminMessage("Compétence supprimée avec succès", "success");
       // Recharger la liste des compétences
       fetch("/competences", { headers })
         .then(res => res.json())
         .then(competences => {
           const competenceList = document.getElementById('competence-list');
           competenceList.innerHTML = competences.map(comp => `
             <li>
               <span>${comp.nom}</span>
               <button class="delete" onclick="deleteCompetence(${comp.id})">
                 <i class="fas fa-times"></i>
               </button>
             </li>
           `).join('');
         });
     })
     .catch(error => {
       showAdminMessage(error.message, "error");
     });
 };
});

// ✅ Message admin réutilisable
function showAdminMessage(message, type = "success") {
 const msg = document.createElement("div");
 msg.className = `admin-message ${type}`;
 msg.textContent = message;
 document.querySelector(".admin-main").prepend(msg);
 setTimeout(() => msg.remove(), 3000);
}