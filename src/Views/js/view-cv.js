import { handle401 } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  let competencesDisponibles = [];

  if (!token) {
    alert("Token manquant. Veuillez vous reconnecter.");
    window.location.href = "login.html";
    return;
  }

  // Charger d'abord les compétences
  fetch("/competences", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then(res => {
      if (handle401(res)) return;
      return res.json();
    })
    .then(data => {
      competencesDisponibles = data;
      console.log("=== DEBUG COMPÉTENCES ===");
      console.log("Compétences disponibles:", competencesDisponibles);
      // Ensuite charge le CV...
      return fetch("/cvs", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    })
    .then(res => {
      if (handle401(res)) return;
      if (!res.ok) throw new Error("Impossible de charger le CV.");
      return res.json();
    })
    .then(data => {
      if (!Array.isArray(data) || data.length === 0) {
        document.getElementById("cv-container").innerHTML = "<h2>Aucun CV trouvé.</h2>";
        return;
      }
      const cv = data[0];
      console.log("=== DEBUG CV ===");
      console.log("CV complet reçu:", cv);
      console.log("Type des compétences:", typeof cv.competences);
      console.log("Est-ce un tableau ?", Array.isArray(cv.competences));
      console.log("Contenu des compétences:", cv.competences);
      if (Array.isArray(cv.competences)) {
        cv.competences.forEach((comp, index) => {
          console.log(`Compétence ${index}:`, comp);
          console.log("Type:", typeof comp);
          if (typeof comp === 'object') {
            console.log("Propriétés:", Object.keys(comp));
          }
        });
      }
      fillCV(cv, competencesDisponibles);
    })
    .catch(err => {
      console.error("Erreur lors du chargement:", err);
      document.getElementById("cv-container").innerHTML = `<p>Erreur : ${err.message}</p>`;
    });
});

function fillCV(cv, competencesDisponibles) {
  if (
    !document.getElementById("cv-left") ||
    !document.getElementById("cv-title") ||
    !document.getElementById("cv-adresse")
  ) {
    console.warn("Structure du DOM incomplète.");
    return;
  }

  // Appliquer le style choisi
  const container = document.getElementById("cv-container");
  container.className = `cv-preview style-${cv.style || 'classique'}`;

  document.getElementById("cv-title").textContent = cv.titre;
  document.getElementById("cv-nom").textContent = cv.utilisateur.nom;
  document.getElementById("cv-email").textContent = cv.utilisateur.email;
  document.getElementById("cv-phone").textContent = cv.telephone || "Non renseigné";
  document.getElementById("cv-adresse").textContent = cv.adresse || "Non renseignée";

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

  const descriptionP = document.querySelector(".profile-description p");
  if (descriptionP) {
    descriptionP.textContent = cv.description || "Aucune description fournie.";
  }

  const renderList = (title, items) => {
    if (!Array.isArray(items) || items.length === 0) return "";
    
    // Traitement spécial pour les compétences
    if (title === "Compétences") {
      console.log("=== DEBUG RENDU COMPÉTENCES ===");
      console.log("Items reçus:", items);
      const competencesNoms = items.map(comp => {
        console.log("Traitement de la compétence:", comp);
        // Si c'est un ID numérique
        const compId = parseInt(comp);
        if (!isNaN(compId)) {
          console.log("-> ID numérique trouvé:", compId);
          const competence = competencesDisponibles.find(c => c.id === compId);
          console.log("-> Compétence trouvée par ID:", competence);
          return competence ? competence.nom : "Compétence inconnue";
        }
        // Si c'est déjà un nom
        if (typeof comp === 'string') {
          console.log("-> Nom de compétence trouvé directement:", comp);
          return comp;
        }
        // Si c'est un objet
        if (typeof comp === 'object' && comp !== null) {
          console.log("-> Objet compétence trouvé:", comp);
          return comp.nom || "Compétence inconnue";
        }
        
        console.log("-> Format non reconnu:", comp);
        return "Compétence inconnue";
      });
      
      console.log("Noms des compétences après traitement:", competencesNoms);
      return `
        <h3>${title}</h3>
        <ul>${competencesNoms.map(nom => `<li>${nom}</li>`).join("")}</ul>
      `;
    }
    
    // Pour les autres listes
    return `
      <h3>${title}</h3>
      <ul>${items.map(i => `<li>${i}</li>`).join("")}</ul>
    `;
  };

  document.getElementById("cv-left").innerHTML =
    renderList("Formations", cv.formations) +
    renderList("Expériences", cv.experiences);

  document.getElementById("cv-right").innerHTML =
    renderList("Compétences", cv.competences) +
    renderList("Langues", cv.langues) +
    renderList("Soft Skills", cv.softskills);

  // ✅ Calcule l'âge
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

// Style switcher
document.querySelectorAll(".style-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const styleClass = btn.dataset.style;
    const container = document.getElementById("cv-container");
    container.className = `cv-preview ${styleClass}`;
  });
});
