import { handle401 } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("cv-form");
  const token = localStorage.getItem("token");
  const photoInput = document.getElementById("photo");
  const descriptionInput = document.getElementById("description");
  const telephoneInput = document.getElementById("telephone");
  const adresseInput = document.getElementById("adresse");

  const photoFrame = document.getElementById("photo-frame");
  const tagContainer = document.getElementById("competences-tags");
  const inputCompetence = document.getElementById("competence-input");
  const selectCompetence = document.getElementById("competence-select");
  const warningDiv = document.getElementById("competence-warning");

  // Création du conteneur d'alertes
  const alertContainer = document.createElement("div");
  alertContainer.className = "alert-container";
  document.body.appendChild(alertContainer);

  function showAlert(message, type = "success") {
    const alert = document.createElement("div");
    alert.className = `alert ${type}`;
    alert.textContent = message;
    
    alertContainer.appendChild(alert);
    
    setTimeout(() => {
      alert.style.animation = "slideOut 0.3s ease forwards";
      setTimeout(() => alert.remove(), 300);
    }, 3000);
  }

  let competencesDisponibles = [];
  let competencesAjoutees = [];

  if (!token) {
    showAlert("Vous devez être connecté pour créer un CV.", "error");
    window.location.href = "login.html";
    return;
  }

  // Gestion des styles de CV
  const styleInputs = document.querySelectorAll('input[name="cv-style"]');
  styleInputs.forEach(input => {
    input.addEventListener('change', (e) => {
      form.classList.remove('style-classique', 'style-moderne', 'style-minimaliste', 'style-creatif');
      form.classList.add(`style-${e.target.value}`);
    });
  });
  form.classList.add('style-classique');

  // Charger compétences
  fetch("/competences", {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => {
      if (handle401(res)) return;
      return res.json();
    })
    .then((data) => {
      competencesDisponibles = data;
      
      // Remplir le select avec les compétences
      selectCompetence.innerHTML = '<option value="">Sélectionner une compétence</option>';
      data.forEach(comp => {
        const option = document.createElement('option');
        option.value = comp.id;
        option.textContent = comp.nom;
        selectCompetence.appendChild(option);
      });
    })
    .catch(() => showAlert("Impossible de charger les compétences.", "warning"));

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

  function addCompetenceTag(competence) {
    if (!competence || competencesAjoutees.includes(competence.nom.toLowerCase())) {
      return;
    }

    competencesAjoutees.push(competence.nom.toLowerCase());
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = competence.nom;
    tag.dataset.id = competence.id;

    const removeBtn = document.createElement("button");
    removeBtn.innerHTML = "&times;";
    removeBtn.onclick = () => {
      tag.remove();
      competencesAjoutees = competencesAjoutees.filter((c) => c !== competence.nom.toLowerCase());
    };

    tag.appendChild(removeBtn);
    tagContainer.appendChild(tag);
  }

  // Gestion du select de compétences
  selectCompetence.addEventListener('change', () => {
    if (!selectCompetence.value) return;
    
    const competence = competencesDisponibles.find(c => c.id === parseInt(selectCompetence.value));
    if (competence) {
      addCompetenceTag(competence);
      selectCompetence.value = ""; // Reset select
      warningDiv.style.display = "none";
    }
  });

  // Autocomplétion
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
        warningDiv.style.display = "none";
      };
      suggestionBox.appendChild(li);
    });
  });

  // Ajout par entrée
  inputCompetence.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const valeur = inputCompetence.value.trim();
      if (!valeur || competencesAjoutees.includes(valeur.toLowerCase())) return;

      const competence = competencesDisponibles.find(
        (c) => c.nom.toLowerCase() === valeur.toLowerCase()
      );

      if (!competence) {
        warningDiv.textContent = `Compétence non disponible : ${valeur}`;
        warningDiv.style.display = "block";
        return;
      }

      warningDiv.style.display = "none";
      addCompetenceTag(competence);
      inputCompetence.value = "";
      const suggestionBox = document.getElementById("competence-suggestions");
      if (suggestionBox) suggestionBox.innerHTML = "";
    }
  });

  // Mise à jour photo
  photoInput.addEventListener("input", updatePhotoPreview);
  form.titre.addEventListener("input", updatePhotoPreview);

  // Soumission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validation du téléphone
    const phone = telephoneInput.value.trim();
    if (phone && !/^\+\d{6,15}$/.test(phone)) {
      showAlert("Le numéro de téléphone doit commencer par + et ne contenir que des chiffres.", "error");
      return;
    }

    // Validation des champs obligatoires
    if (!form.titre.value.trim()) {
      showAlert("Le titre du CV est obligatoire.", "error");
      return;
    }

    const competencesIds = Array.from(tagContainer.children).map(tag => tag.dataset.id).filter(Boolean);
    if (competencesIds.length === 0) {
      showAlert("Ajoutez au moins une compétence.", "warning");
      return;
    }

    const data = {
      titre: form.titre.value,
      competences: competencesIds,
      formations: form.formations.value.split(",").map(f => f.trim()).filter(Boolean),
      experiences: form.experiences.value.split(",").map(e => e.trim()).filter(Boolean),
      softskills: form.softskills.value.split(",").map(s => s.trim()).filter(Boolean),
      langues: form.langues.value.split(",").map(l => l.trim()).filter(Boolean),
      photo: photoInput.value.trim(),
      description: descriptionInput.value.trim(),
      telephone: phone,
      adresse: adresseInput.value.trim(),
      style: document.querySelector('input[name="cv-style"]:checked').value
    };

    try {
      const res = await fetch("/cvs/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (handle401(res)) return;

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erreur lors de la création.");
      }

      showAlert("CV créé avec succès !", "success");
      setTimeout(() => window.location.href = "dashboard.html", 1500);
    } catch (err) {
      showAlert(err.message, "error");
    }
  });
});
