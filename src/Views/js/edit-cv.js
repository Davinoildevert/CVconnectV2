import { handle401 } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showAlert("Non connecté.", "error");
    window.location.href = "login.html";
    return;
  }

  const form = document.getElementById("edit-cv-form");
  const photoInput = document.getElementById("photo");
  const photoFrame = document.getElementById("photo-frame");
  const tagContainer = document.getElementById("competences-tags");
  const inputCompetence = document.getElementById("competence-input");
  const warningDiv = document.getElementById("competence-warning");

  let competencesDisponibles = [];
  let competencesAjoutees = [];

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };

  // Fonction pour afficher les alertes stylisées
  function showAlert(message, type = "success") {
    const alertContainer = document.getElementById("alert-container");
    const alert = document.createElement("div");
    alert.className = `alert ${type}`;
    alert.textContent = message;
    
    alertContainer.appendChild(alert);
    
    // Auto-suppression après 3 secondes
    setTimeout(() => {
      alert.style.animation = "slideOut 0.3s ease forwards";
      setTimeout(() => alert.remove(), 300);
    }, 3000);
  }

  // Mise à jour de la photo
  function updatePhotoPreview() {
    const url = photoInput.value.trim();
    const nom = form.titre.value.trim();
    if (url) {
      photoFrame.innerHTML = `<img src="${url}" alt="Photo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`;
    } else {
      const initials = nom
        ? nom.trim().split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
        : "👤";
      photoFrame.innerHTML = initials;
      photoFrame.style.display = "flex";
      photoFrame.style.alignItems = "center";
      photoFrame.style.justifyContent = "center";
      photoFrame.style.fontWeight = "bold";
      photoFrame.style.color = "#4b5563";
      photoFrame.style.backgroundColor = "#e5e7eb";
    }
  }

  // Gestion des compétences
  function addCompetenceTag(competence) {
    if (!competence || competencesAjoutees.includes(competence.nom.toLowerCase())) return;
    
    competencesAjoutees.push(competence.nom.toLowerCase());
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = competence.nom;
    tag.dataset.id = competence.id; // Stocker l'ID pour la soumission

    const removeBtn = document.createElement("button");
    removeBtn.innerHTML = "&times;";
    removeBtn.onclick = () => {
      tag.remove();
      competencesAjoutees = competencesAjoutees.filter((c) => c !== competence.nom.toLowerCase());
    };

    tag.appendChild(removeBtn);
    tagContainer.appendChild(tag);
  }

  // Charger les compétences disponibles
  fetch("/competences", { headers })
    .then((res) => {
      if (handle401(res)) return;
      return res.json();
    })
    .then((data) => {
      competencesDisponibles = data;
      console.log("=== DEBUG: Compétences disponibles ===");
      console.log(competencesDisponibles);
      
      // Remplir le select avec les compétences
      const select = document.getElementById("competence-select");
      select.innerHTML = '<option value="">Sélectionner une compétence</option>';
      data.forEach(comp => {
        const option = document.createElement('option');
        option.value = comp.id;
        option.textContent = comp.nom;
        select.appendChild(option);
      });

      // Une fois les compétences disponibles chargées, on charge le CV
      return fetch("/cvs", { headers });
    })
    .then(res => {
      if (handle401(res)) return;
      return res.json();
    })
    .then(data => {
      if (!data || !data[0]) {
        showAlert("Aucun CV trouvé.", "warning");
        return;
      }

      const cv = data[0];
      console.log("=== DEBUG: CV chargé ===");
      console.log("Compétences du CV:", cv.competences);
      
      form.titre.value = cv.titre || "";
      form.photo.value = cv.photo || "";
      form.telephone.value = cv.telephone || "";
      form.adresse.value = cv.adresse || "";
      form.description.value = cv.description || "";
      form.formations.value = (cv.formations || []).join("\n");
      form.experiences.value = (cv.experiences || []).join("\n");
      form.softskills.value = (cv.softskills || []).join(", ");
      form.langues.value = (cv.langues || []).join(", ");
      
      // Appliquer le style initial
      const styleValue = cv.style || 'classique';
      const styleInput = document.querySelector(`input[name="cv-style"][value="${styleValue}"]`);
      if (styleInput) {
        styleInput.checked = true;
        form.classList.add(`style-${styleValue}`);
      }
      
      // Charger les compétences existantes
      if (cv.competences && Array.isArray(cv.competences)) {
        console.log("=== DEBUG: Traitement des compétences ===");
        cv.competences.forEach(comp => {
          console.log("Traitement de la compétence:", comp);
          // Chercher la compétence soit par ID soit par nom
          const competence = competencesDisponibles.find(c => 
            c.id === parseInt(comp) || c.nom === comp
          );
          console.log("Compétence trouvée:", competence);
          if (competence) {
            addCompetenceTag(competence);
          }
        });
      }

      form.dataset.cvId = cv.utilisateur.id;
      updatePhotoPreview();
    })
    .catch((error) => {
      console.error("Erreur lors du chargement:", error);
      showAlert("Impossible de charger le CV.", "error");
    });

  // Gestion du style
  const styleInputs = document.querySelectorAll('input[name="cv-style"]');
  styleInputs.forEach(input => {
    input.addEventListener('change', (e) => {
      // Retirer toutes les classes de style
      form.classList.remove('style-classique', 'style-moderne', 'style-minimaliste', 'style-creatif');
      // Ajouter la nouvelle classe de style
      const newStyle = `style-${e.target.value}`;
      form.classList.add(newStyle);
    });
  });

  // Autocomplétion des compétences
  inputCompetence.addEventListener("input", () => {
    const value = inputCompetence.value.toLowerCase();
    const suggestions = competencesDisponibles
      .filter(c => c.nom.toLowerCase().startsWith(value) && !competencesAjoutees.includes(c.nom.toLowerCase()))
      .slice(0, 5);

    let suggestionBox = document.getElementById("competence-suggestions");
    if (!suggestionBox) {
      suggestionBox = document.createElement("ul");
      suggestionBox.id = "competence-suggestions";
      suggestionBox.className = "suggestions-list";
      inputCompetence.parentNode.appendChild(suggestionBox);
    }
    suggestionBox.innerHTML = "";

    suggestions.forEach(comp => {
      const li = document.createElement("li");
      li.textContent = comp.nom;
      li.onclick = () => {
        addCompetenceTag(comp);
        inputCompetence.value = "";
        suggestionBox.innerHTML = "";
      };
      suggestionBox.appendChild(li);
    });
  });

  // Ajout de compétence par entrée
  inputCompetence.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const valeur = inputCompetence.value.trim().toLowerCase();
      if (!valeur || competencesAjoutees.includes(valeur)) return;

      const competence = competencesDisponibles.find(
        (c) => c.nom.toLowerCase() === valeur
      );

      if (!competence) {
        warningDiv.textContent = `Compétence non disponible : ${valeur}`;
        return;
      }

      warningDiv.textContent = "";
      addCompetenceTag(competence);
      inputCompetence.value = "";
      const suggestionBox = document.getElementById("competence-suggestions");
      if (suggestionBox) suggestionBox.innerHTML = "";
    }
  });

  // Mise à jour de la photo en direct
  photoInput.addEventListener("input", updatePhotoPreview);
  form.titre.addEventListener("input", updatePhotoPreview);

  // Suppression du CV
  const deleteBtn = document.getElementById("delete-cv");
  deleteBtn.addEventListener("click", () => {
    const overlay = document.createElement("div");
    overlay.className = "overlay";
    
    const confirmation = document.createElement("div");
    confirmation.className = "delete-confirmation";
    confirmation.innerHTML = `
      <h3>⚠️ Supprimer le CV ?</h3>
      <p>Cette action est irréversible.</p>
      <div class="buttons">
        <button class="btn btn-cancel">Annuler</button>
        <button class="btn btn-secondary">Confirmer</button>
      </div>
    `;
    
    overlay.appendChild(confirmation);
    document.body.appendChild(overlay);
    
    confirmation.querySelector(".btn-cancel").onclick = () => {
      overlay.remove();
    };
    
    confirmation.querySelector(".btn-secondary").onclick = async () => {
      const utilisateurId = form.dataset.cvId;
      try {
        const res = await fetch(`/cvs/utilisateurs/${utilisateurId}/cv`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });

        if (handle401(res)) return;
        if (!res.ok) throw new Error("Erreur lors de la suppression.");

        showAlert("CV supprimé avec succès !", "success");
        setTimeout(() => window.location.href = "dashboard.html", 1500);
      } catch (err) {
        showAlert(err.message, "error");
      } finally {
        overlay.remove();
      }
    };
  });

  // Soumission du formulaire
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const utilisateurId = form.dataset.cvId;

    // Validation du numéro de téléphone
    const phone = form.telephone.value.trim();
    if (phone && !/^\+\d{6,15}$/.test(phone)) {
      showAlert("Veuillez entrer un numéro de téléphone valide commençant par + et contenant uniquement des chiffres.", "error");
      return;
    }

    const body = {
      titre: form.titre.value,
      photo: form.photo.value.trim(),
      telephone: phone,
      adresse: form.adresse.value.trim(),
      description: form.description.value.trim(),
      style: document.querySelector('input[name="cv-style"]:checked').value,
      competences: Array.from(tagContainer.children).map(tag => tag.dataset.id).filter(Boolean),
      formations: form.formations.value.split("\n").map(s => s.trim()).filter(Boolean),
      experiences: form.experiences.value.split("\n").map(s => s.trim()).filter(Boolean),
      softskills: form.softskills.value.split(",").map(s => s.trim()).filter(Boolean),
      langues: form.langues.value.split(",").map(s => s.trim()).filter(Boolean)
    };

    try {
      const res = await fetch(`/cvs/utilisateurs/${utilisateurId}/cv`, {
        method: "PUT",
        headers,
        body: JSON.stringify(body)
      });

      if (handle401(res)) return;
      if (!res.ok) throw new Error("Erreur lors de la mise à jour.");
      
      showAlert("CV mis à jour avec succès !", "success");
      setTimeout(() => window.location.href = "dashboard.html", 1500);
    } catch (err) {
      showAlert(err.message, "error");
    }
  });

  // Gestion du select de compétences
  document.getElementById("competence-select").addEventListener('change', (e) => {
    if (!e.target.value) return;
    
    const competence = competencesDisponibles.find(c => c.id === parseInt(e.target.value));
    if (competence) {
      addCompetenceTag(competence);
      e.target.value = ""; // Reset select
      warningDiv.style.display = "none";
    }
  });
});
