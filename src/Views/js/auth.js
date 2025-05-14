export function handle401(response) {
    if (response.status === 401) {
      alert("⏰ Votre session a expiré. Veuillez vous reconnectez SVP.");
      localStorage.removeItem("token");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);
      return true; // indique qu'on a géré l'erreur
    }
    return false; // rien à faire
  }
  