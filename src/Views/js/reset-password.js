const requestForm = document.getElementById("reset-request-form");
const passwordForm = document.getElementById("reset-password-form");
const modal = document.getElementById("reset-modal");
const closeModalBtn = document.getElementById("modal-close-btn");

requestForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = e.target.email.value;

  try {
    const res = await fetch("/utilisateurs/reset-password-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Erreur lors de la demande.");

    // ✅ Extraire le token et afficher la modale
    const token = new URL(data.resetLink).pathname.split("/").pop();
    passwordForm.token.value = token;
    modal.style.display = "flex";
  } catch (err) {
    showAlert(err.message, "error");
  }
});

// ✅ Gérer la soumission du nouveau mot de passe
passwordForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const token = e.target.token.value;
  const newPassword = e.target.newPassword.value;
  const confirmPassword = e.target.confirmPassword.value;

  if (newPassword !== confirmPassword) {
    showAlert("Les mots de passe ne correspondent pas.", "error");
    return;
  }

  try {
    const res = await fetch(`/utilisateurs/reset-password/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Échec de la réinitialisation.");

    showAlert("Mot de passe réinitialisé avec succès !", "success");
    passwordForm.reset();
    modal.style.display = "none";
  } catch (err) {
    showAlert(err.message, "error");
  }
});

// ❌ Fermer la modale
closeModalBtn.addEventListener("click", () => {
  modal.style.display = "none";
  passwordForm.reset();
});

function showAlert(message, type = "success") {
  const container = document.querySelector(".alert-container");
  const alert = document.createElement("div");
  alert.className = `enhanced-alert ${type}`;
  alert.innerHTML = `<span class="icon">${type === "success" ? "✅" : "⚠️"}</span> ${message}`;
  container.appendChild(alert);
  setTimeout(() => alert.remove(), 4000);
}
