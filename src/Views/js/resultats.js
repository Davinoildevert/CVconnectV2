import { handle401 } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const params = new URLSearchParams(window.location.search);
  const competence = params.get("competence");

  if (!token || !competence) {
    window.location.href = "dashboard-recruteur.html";
    return;
  }

  // Affiche l'intitulé de la recherche
  document.getElementById("search-info").textContent = `Résultats pour : "${competence}"`;

  fetch(`/cvs?competence=${encodeURIComponent(competence)}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => {
      if (handle401(res)) return;
      if (!res.ok) throw new Error("Erreur lors du filtrage.");
      return res.json();
    })
    .then(data => renderFilteredFeed(data, competence))
    .catch(err => {
      document.getElementById("cv-results").innerHTML = `<p>❌ ${err.message}</p>`;
    });
});

function renderFilteredFeed(cvs, competence) {
  const container = document.getElementById("cv-results");

  if (!Array.isArray(cvs) || cvs.length === 0) {
    container.innerHTML = `<p>Aucun CV trouvé avec la compétence "${competence}".</p>`;
    return;
  }

  container.innerHTML = cvs.map(cv => {
    const preview = cv.competences.slice(0, 3).join(", ");
    return `
      <div class="cv-card">
        <h2>${cv.titre}</h2>
        <p><strong>Nom :</strong> ${cv.utilisateur.nom}</p>
        <p><strong>Compétences :</strong> ${preview}...</p>
        <a class="btn" href="cv-detail.html?id=${cv.id}">🔍 Voir plus</a>
      </div>
    `;
  }).join("");
}
