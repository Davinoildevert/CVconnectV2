import { handle401 } from "./auth.js";

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) return window.location.href = "login.html";

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

    // 2. Vérifier si le CV existe
    const resCV = await fetch(`/utilisateurs/${user.id}/cv`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const btnCreate = document.getElementById("btn-create-cv");
    if (resCV.status === 200) {
      btnCreate.classList.add("disabled");
      btnCreate.style.pointerEvents = "none";
      btnCreate.style.opacity = "0.6";
      btnCreate.title = "Vous avez déjà un CV.";
    }

    // 3. Favoris (intérêt des recruteurs)
    console.log("1. Début de la récupération des notifications");
    console.log("1.1 Token utilisé:", token);
    console.log("1.2 ID utilisateur:", user.id);
    
    const resNotif = await fetch("/cvs/notifications", {
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    console.log("2. Réponse de l'API notifications:", {
      status: resNotif.status,
      statusText: resNotif.statusText,
      headers: Object.fromEntries(resNotif.headers.entries())
    });

    const list = document.getElementById("notifications-list");
    const badgeFav = document.getElementById("badge-favoris");
    const listFav = document.getElementById("favoris-list");

    list.innerHTML = "";

    if (resNotif.ok) {
      const notifs = await resNotif.json();
      console.log("3. Notifications reçues:", notifs);
      
      // Filtrer les notifications qui concernent les favoris
      const favoris = notifs.filter(n => n.message.includes("favori"));
      console.log("4. Favoris filtrés:", favoris);

      // Ne compter que les notifications non lues
      const favorisNonLus = favoris.filter(n => !n.lu);
      console.log("5. Favoris non lus:", favorisNonLus);

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
    }
    else {
      console.error("5. Erreur lors de la récupération des notifications:", {
        status: resNotif.status,
        statusText: resNotif.statusText
      });
      try {
        const errorData = await resNotif.json();
        console.error("5.1 Détails de l'erreur:", errorData);
      } catch (e) {
        console.error("5.2 Impossible de lire le corps de l'erreur:", e);
      }
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
