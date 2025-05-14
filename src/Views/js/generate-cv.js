import { handle401 } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showAlert("Vous devez être connecté pour accéder à cette page.", "error");
    window.location.href = "login.html";
    return;
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };

  let currentCV = null;
  let currentStyle = 'classique'; // Style par défaut

  function showAlert(message, type = "success") {
    const alertContainer = document.getElementById("alert-container");
    const alert = document.createElement("div");
    alert.className = `alert ${type}`;
    alert.textContent = message;
    
    alertContainer.appendChild(alert);
    
    setTimeout(() => {
      alert.style.animation = "slideOut 0.3s ease forwards";
      setTimeout(() => alert.remove(), 300);
    }, 3000);
  }

  // Charger le CV
  fetch("/cvs", { headers })
    .then(res => {
      if (handle401(res)) return;
      return res.json();
    })
    .then(data => {
      if (!Array.isArray(data) || data.length === 0) {
        document.getElementById("cv-preview").innerHTML = "<p class='text-center text-gray-500'>Aucun CV trouvé.</p>";
        return;
      }

      currentCV = data[0];
      renderCV(currentCV);
      
      // Appliquer le style sauvegardé si disponible
      if (currentCV.style) {
        currentStyle = currentCV.style;
        const styleInput = document.querySelector(`input[name="cv-style"][value="${currentStyle}"]`);
        if (styleInput) {
          styleInput.checked = true;
          document.getElementById("cv-preview").className = `cv-preview style-${currentStyle}`;
        }
      }
    })
    .catch(err => {
      console.error("Erreur lors du chargement du CV:", err);
      showAlert("Une erreur est survenue lors du chargement du CV.", "error");
    });

  // Gestion des styles
  document.querySelectorAll('input[name="cv-style"]').forEach(input => {
    input.addEventListener('change', (e) => {
      currentStyle = e.target.value;
      document.getElementById("cv-preview").className = `cv-preview style-${currentStyle}`;
      
      // Sauvegarder le style dans le CV
      if (currentCV && currentCV.utilisateurId) {
        fetch(`/utilisateurs/${currentCV.utilisateurId}/cv`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ 
            ...currentCV,
            style: currentStyle 
          })
        })
        .then(response => {
          if (!response.ok) throw new Error('Erreur lors de la sauvegarde du style');
          showAlert("Style du CV mis à jour avec succès");
        })
        .catch(err => {
          console.error('Erreur lors de la sauvegarde du style:', err);
          showAlert("Impossible de sauvegarder le style du CV", "error");
        });
      }
    });
  });

  // Gestion du téléchargement PDF
  document.getElementById("download-pdf").addEventListener("click", async () => {
    try {
      if (!currentCV || !currentCV.id) {
        throw new Error('CV non trouvé');
      }

      const button = document.getElementById("download-pdf");
      button.disabled = true;
      button.textContent = "Génération en cours...";

      // Inclure le style actuel dans l'URL
      const response = await fetch(`/cvs/${currentCV.id}/pdf?style=${currentStyle}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la génération du PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CV-${currentCV.titre || 'sans-titre'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showAlert("Le PDF a été généré avec succès");
    } catch (err) {
      console.error('Erreur lors du téléchargement du PDF:', err);
      showAlert("Une erreur est survenue lors de la génération du PDF", "error");
    } finally {
      const button = document.getElementById("download-pdf");
      button.disabled = false;
      button.innerHTML = "📥 Télécharger en PDF";
    }
  });
});

function renderCV(cv) {
  const container = document.getElementById("cv-preview");
  
  // Structure identique à view-cv.html
  container.innerHTML = `
    <div class="profile-header">
      <div class="profile-photo"></div>
      <div class="profile-info">
        <h1 id="cv-title">${cv.titre || 'Sans titre'}</h1>
        <p><strong>Nom :</strong> <span id="cv-nom">${cv.utilisateur.nom}</span></p>
        <p><strong>Email :</strong> <span id="cv-email">${cv.utilisateur.email}</span></p>
        <p><strong>Téléphone :</strong> <span id="cv-phone">${cv.telephone || 'Non renseigné'}</span></p>
        <p><strong>Adresse :</strong> <span id="cv-adresse">${cv.adresse || 'Non renseignée'}</span></p>
        <p><strong>Âge :</strong> <span id="cv-age">${cv.age || 'Non renseigné'}</span></p>
      </div>
    </div>

    <div class="profile-description">
      <h3>Profil</h3>
      <p>${cv.description || 'Aucune description fournie.'}</p>
    </div>

    <div class="cv-columns">
      <div class="cv-left" id="cv-left">
        ${cv.formations?.length ? `
          <h3>Formations</h3>
          <ul>${cv.formations.map(f => `<li>${f}</li>`).join("")}</ul>
        ` : ''}
        
        ${cv.experiences?.length ? `
          <h3>Expériences</h3>
          <ul>${cv.experiences.map(e => `<li>${e}</li>`).join("")}</ul>
        ` : ''}
      </div>

      <div class="cv-right" id="cv-right">
        ${cv.competences?.length ? `
          <h3>Compétences</h3>
          <ul>${cv.competences.map(c => `<li>${typeof c === 'object' ? c.nom : c}</li>`).join("")}</ul>
        ` : ''}
        
        ${cv.langues?.length ? `
          <h3>Langues</h3>
          <ul>${cv.langues.map(l => `<li>${l}</li>`).join("")}</ul>
        ` : ''}
        
        ${cv.softskills?.length ? `
          <h3>Soft Skills</h3>
          <ul>${cv.softskills.map(s => `<li>${s}</li>`).join("")}</ul>
        ` : ''}
      </div>
    </div>
  `;

  // Gestion de la photo
  const photoDiv = container.querySelector(".profile-photo");
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
}
