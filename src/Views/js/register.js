const form = document.getElementById("register-form");
const roleButtons = document.querySelectorAll(".role-btn");
const hiddenRole = form.role;

// Champs dynamiques
const candidatFields = document.getElementById("candidat-fields");
const recruteurFields = document.getElementById("recruteur-fields");

const dobDay = document.getElementById("dob-day");
const dobMonth = document.getElementById("dob-month");
const dobYear = document.getElementById("dob-year");

// ▶️ Remplissage années/mois/jours
const currentYear = new Date().getFullYear();
for (let y = currentYear; y >= 1900; y--) {
  const opt = document.createElement("option");
  opt.value = y;
  opt.textContent = y;
  dobYear.appendChild(opt);
}
for (let m = 1; m <= 12; m++) {
  const opt = document.createElement("option");
  opt.value = m.toString().padStart(2, "0");
  opt.textContent = m;
  dobMonth.appendChild(opt);
}
for (let d = 1; d <= 31; d++) {
  const opt = document.createElement("option");
  opt.value = d.toString().padStart(2, "0");
  opt.textContent = d;
  dobDay.appendChild(opt);
}

// 🎯 Gestion des boutons de rôle
roleButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    roleButtons.forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    hiddenRole.value = btn.dataset.role;

    if (btn.dataset.role === "candidat") {
      candidatFields.style.display = "block";
      recruteurFields.style.display = "none";

      // Supprimer les attributs "required" des champs recruteur
      form.entreprise?.removeAttribute("required");
      form.siret?.removeAttribute("required");
    } else {
      candidatFields.style.display = "none";
      recruteurFields.style.display = "block";

      // Remettre les "required" si recruteur
      form.entreprise?.setAttribute("required", "required");
      form.siret?.setAttribute("required", "required");
    }
  });
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nom = form.nom.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value;
  const role = hiddenRole.value;

  if (!role) return showAlert("Veuillez choisir un rôle.", "error");

  // ✅ Vérification du mot de passe
  const estLongAssez = password.length >= 6;
  const contientLettre = /[a-zA-Z]/.test(password);
  const contientChiffre = /\d/.test(password);

  if (!estLongAssez || !contientLettre || !contientChiffre) {
    return showAlert("Le mot de passe doit contenir au moins 6 caractères, avec une lettre et un chiffre.", "error");
  }

  const payload = { nom, email, password, role };

  if (role === "candidat") {
    const day = dobDay.value;
    const month = dobMonth.value;
    const year = dobYear.value;
    if (!day || !month || !year) {
      return showAlert("Veuillez compléter votre date de naissance.", "error");
    }

    const dateNaissance = `${year}-${month}-${day}`;

    // ✅ Vérifie âge minimum = 16 ans
    const birth = new Date(dateNaissance);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;

    if (age < 16) {
      return showAlert("Vous devez avoir au moins 16 ans pour vous inscrire.", "error");
    }

    payload.dateNaissance = dateNaissance;
  }

  if (role === "recruteur") {
    const entreprise = form.entreprise.value.trim();
    const siret = form.siret.value.trim();
    if (!/^\d+$/.test(siret)) {
      return showAlert("Le numéro SIRET doit contenir uniquement des chiffres.", "error");
    }

    if (!entreprise || !siret) {
      return showAlert("Les champs entreprise et SIRET sont requis pour les recruteurs.", "error");
    }
    payload.entreprise = entreprise;
    payload.siret = siret;
  }

  try {
    const res = await fetch("/utilisateurs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      if (res.status === 409) throw new Error("Cette adresse email est déjà utilisée.");
      if (res.status === 400 && data.message) throw new Error(data.message);
      throw new Error("Erreur lors de l'inscription.");
    }

    showAlert("✅ Compte créé avec succès !");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1000);
  } catch (err) {
    showAlert(err.message, "error");
  }
});

function showAlert(message, type = "success") {
  const container = document.querySelector(".alert-container");
  const alert = document.createElement("div");
  alert.className = `enhanced-alert ${type}`;
  alert.innerHTML = `<span class="icon">${type === "success" ? "✅" : "⚠️"}</span> ${message}`;
  container.appendChild(alert);
  setTimeout(() => alert.remove(), 4000);
}
