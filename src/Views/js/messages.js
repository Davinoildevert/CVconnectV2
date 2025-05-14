import { handle401 } from "./auth.js";

let currentUser = null;
let conversations = [];
let currentConversation = null;
let isLoadingConversations = false;

// Fonction pour afficher une alerte
function showAlert(message, type = 'info') {
  const container = document.getElementById("alert-container");
  const alert = document.createElement("div");
  alert.className = `alert alert-${type}`;
  alert.textContent = message;
  container.appendChild(alert);
  
  setTimeout(() => {
    alert.remove();
  }, 3000);
}

// Fonction pour formater la date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Fonction pour obtenir les initiales
function getInitials(name) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Fonction pour charger les conversations
async function loadConversations() {
  if (isLoadingConversations) {
    console.log("Chargement des conversations déjà en cours, annulation");
    return;
  }

  console.log("1. Début du chargement des conversations");
  isLoadingConversations = true;
  const token = localStorage.getItem("token");
  
  if (!token) {
    console.error("Token manquant");
    isLoadingConversations = false;
    return;
  }

  try {
    // Récupérer la liste des utilisateurs
    const usersRes = await fetch("/utilisateurs", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!usersRes.ok) throw new Error("Erreur lors du chargement des utilisateurs");
    const users = await usersRes.json();
    console.log("2. Liste des utilisateurs récupérée:", users);

    // Filtrer les utilisateurs en fonction du rôle de l'utilisateur connecté
    const filteredUsers = users.filter(u => 
      currentUser.role === 'recruteur' ? u.role === 'candidat' : u.role === 'recruteur'
    );
    console.log("3. Utilisateurs filtrés:", filteredUsers);

    // Récupérer les messages pour chaque utilisateur filtré
    console.log("4. Début de la récupération des messages pour chaque utilisateur");
    const conversationsData = [];
    
    for (const user of filteredUsers) {
      const messagesRes = await fetch(`/utilisateurs/messages/conversation/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!messagesRes.ok) {
        console.error(`Erreur lors du chargement des messages pour le candidat ${user.id}`);
        continue;
      }
      
      const messages = await messagesRes.json();
      console.log(`Messages pour le candidat ${user.id}:`, messages);
      
      if (messages && messages.length > 0) {
        conversationsData.push({
          userId: parseInt(user.id),
          messages: messages,
          lastMessage: messages[messages.length - 1]
        });
      }
    }

    console.log("5. Données des conversations récupérées:", conversationsData);

    // Filtrer les conversations vides et normaliser les IDs
    const filteredConversations = conversationsData.filter(conv => 
      conv.messages && conv.messages.length > 0
    ).map(conv => ({
      ...conv,
      userId: parseInt(conv.userId)
    }));

    console.log("6. Conversations filtrées (non vides):", filteredConversations);

    // Trier les conversations par date du dernier message
    const sortedConversations = filteredConversations.sort((a, b) => {
      if (!a.lastMessage || !b.lastMessage) return 0;
      return new Date(b.lastMessage.date).getTime() - new Date(a.lastMessage.date).getTime();
    });

    console.log("7. Conversations triées:", sortedConversations);

    // Mettre à jour l'état
    conversations = sortedConversations;
    
    // Rendre les conversations
    console.log("8. Début du rendu des conversations");
    await renderConversations();
    
  } catch (err) {
    console.error("Erreur loadConversations:", err);
    showAlert("Erreur lors du chargement des conversations", "error");
  } finally {
    isLoadingConversations = false;
  }
}

// Fonction pour rendre la liste des conversations
async function renderConversations() {
  const container = document.getElementById("conversations");
  if (!container) {
    console.error("Container des conversations non trouvé");
    return;
  }

  if (!conversations.length) {
    console.log("Aucune conversation à afficher");
    container.innerHTML = `
      <div class="no-conversations">
        <p>Aucune conversation</p>
      </div>
    `;
    return;
  }

  // Récupérer les informations des utilisateurs pour chaque conversation
  const token = localStorage.getItem("token");
  console.log("9. Début de la récupération des infos utilisateurs");

  // Récupérer d'abord tous les utilisateurs
  const usersRes = await fetch("/utilisateurs", {
    headers: { Authorization: `Bearer ${token}` }
  });
  const allUsers = usersRes.ok ? await usersRes.json() : [];

  const conversationsHtml = await Promise.all(conversations.map(async conv => {
    const lastMessage = conv.lastMessage;
    const isFromMe = lastMessage ? lastMessage.from === currentUser.id : false;
    const otherUserId = lastMessage ? (isFromMe ? lastMessage.to : lastMessage.from) : conv.userId;

    console.log(`Traitement de la conversation avec l'utilisateur ${otherUserId}`);

    // Trouver l'utilisateur dans la liste complète
    const userData = allUsers.find(u => u.id === parseInt(otherUserId));
    
    if (userData) {
      const role = userData.role === 'recruteur' ? ` - ${userData.entreprise}` : '';
      return `
        <div class="conversation-item" data-user-id="${otherUserId}">
          <div class="profile-photo profile-initials">${getInitials(userData.nom)}</div>
          <div class="conversation-info">
            <h4>${userData.nom}${role}</h4>
            <p>${lastMessage ? lastMessage.contenu : 'Nouvelle conversation'}</p>
          </div>
        </div>
      `;
    }

    return `
      <div class="conversation-item" data-user-id="${otherUserId}">
        <div class="profile-photo profile-initials">??</div>
        <div class="conversation-info">
          <h4>${otherUserId}</h4>
          <p>${lastMessage ? lastMessage.contenu : 'Nouvelle conversation'}</p>
        </div>
      </div>
    `;
  }));

  console.log("10. HTML des conversations généré");
  container.innerHTML = conversationsHtml.join("");

  // Ajouter les écouteurs d'événements
  document.querySelectorAll('.conversation-item').forEach(item => {
    item.addEventListener('click', () => {
      const userId = item.dataset.userId;
      selectConversation(userId);
    });
  });
}

// Fonction pour sélectionner une conversation
async function selectConversation(userId) {
  const token = localStorage.getItem("token");
  try {
    // Récupérer les messages de la conversation
    const res = await fetch(`/utilisateurs/messages/conversation/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!res.ok) throw new Error("Erreur lors du chargement des messages");
    
    const messages = await res.json();
    
    currentConversation = {
      userId: userId,
      messages: messages,
      lastMessage: messages.length > 0 ? messages[messages.length - 1] : null
    };
    
    // Mettre à jour l'interface
    document.querySelectorAll('.conversation-item').forEach(item => {
      item.classList.toggle('active', item.dataset.userId === userId);
    });
    
    document.getElementById('no-conversation-selected').style.display = 'none';
    document.getElementById('conversation-content').style.display = 'flex';
    
    // Récupérer la liste complète des utilisateurs
    const usersRes = await fetch("/utilisateurs", {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (usersRes.ok) {
      const allUsers = await usersRes.json();
      const userData = allUsers.find(u => u.id === parseInt(userId));
      
      if (userData) {
        const role = userData.role === 'recruteur' ? ` - ${userData.entreprise}` : '';
        document.getElementById('contact-name').textContent = `${userData.nom}${role}`;
        document.getElementById('contact-role').textContent = userData.role;
        document.querySelector('.profile-initials').textContent = getInitials(userData.nom);
      } else {
        document.getElementById('contact-name').textContent = `${userId}`;
        document.getElementById('contact-role').textContent = 'Recruteur';
        document.querySelector('.profile-initials').textContent = '??';
      }
    } else {
      document.getElementById('contact-name').textContent = `${userId}`;
      document.getElementById('contact-role').textContent = 'Recruteur';
      document.querySelector('.profile-initials').textContent = '??';
    }
    
    // Afficher les messages
    renderMessages();
  } catch (err) {
    console.error("Erreur selectConversation:", err);
    showAlert(err.message, "error");
  }
}

// Fonction pour rendre les messages
function renderMessages() {
  const container = document.getElementById('messages-list');
  
  if (!currentConversation.messages.length) {
    container.innerHTML = `
      <div class="no-messages">
        <p>Aucun message dans cette conversation</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = currentConversation.messages.map(message => {
    const isFromMe = message.from === currentUser.id;
    
    return `
      <div class="message ${isFromMe ? 'sent' : 'received'}">
        <div class="message-content">${message.contenu}</div>
        <div class="message-time">${formatDate(message.date)}</div>
      </div>
    `;
  }).join("");
  
  // Scroll vers le bas
  container.scrollTop = container.scrollHeight;
}

// Fonction pour envoyer un message
async function sendMessage() {
  const textarea = document.getElementById('message-text');
  const content = textarea.value.trim();
  
  if (!content || !currentConversation) return;
  
  const token = localStorage.getItem("token");
  try {
    const res = await fetch("/utilisateurs/messages", {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: currentConversation.userId,
        contenu: content
      })
    });
    
    if (!res.ok) throw new Error("Erreur lors de l'envoi du message");
    
    // Vider le textarea
    textarea.value = '';
    
    // Recharger les messages de la conversation actuelle
    const messagesRes = await fetch(`/utilisateurs/messages/conversation/${currentConversation.userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!messagesRes.ok) throw new Error("Erreur lors du rechargement des messages");
    
    const messages = await messagesRes.json();
    
    // Mettre à jour la conversation actuelle
    currentConversation.messages = messages;
    currentConversation.lastMessage = messages[messages.length - 1];
    
    // Mettre à jour l'affichage des messages
    renderMessages();
    
    // Recharger la liste des conversations
    await loadConversations();
    
    // Resélectionner la conversation actuelle pour mettre à jour l'interface
    const conversationItem = document.querySelector(`.conversation-item[data-user-id="${currentConversation.userId}"]`);
    if (conversationItem) {
      conversationItem.classList.add('active');
    }
    
  } catch (err) {
    console.error("Erreur sendMessage:", err);
    showAlert(err.message, "error");
  }
}

// Initialisation
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }
  
  try {
    console.log("Initialisation de la page messages");
    // Récupérer les informations de l'utilisateur
    const res = await fetch("/utilisateurs/me", {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!res.ok) throw new Error("Erreur lors de la récupération du profil");
    
    currentUser = await res.json();
    console.log("Utilisateur courant:", currentUser);
    
    // Gestion de l'envoi de message
    document.getElementById('send-message').addEventListener('click', sendMessage);
    
    // Gestion de la recherche
    document.getElementById('search-conversations').addEventListener('input', (e) => {
      const search = e.target.value.toLowerCase();
      document.querySelectorAll('.conversation-item').forEach(item => {
        const name = item.querySelector('h4').textContent.toLowerCase();
        const content = item.querySelector('p').textContent.toLowerCase();
        item.style.display = name.includes(search) || content.includes(search) ? 'flex' : 'none';
      });
    });

    // Vérifier si un userId est présent dans l'URL
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('userId');
    
    // Charger les conversations
    await loadConversations();
    
    if (userId) {
      // Si une conversation existe déjà avec cet utilisateur, la sélectionner
      const existingConversation = conversations.find(c => c.userId === parseInt(userId));
      if (existingConversation) {
        selectConversation(userId);
      } else {
        // Sinon, créer une nouvelle conversation
        currentConversation = {
          userId: parseInt(userId),
          messages: [],
          lastMessage: null
        };
        conversations.unshift(currentConversation);
        selectConversation(userId);
      }
    }
    
  } catch (err) {
    console.error("Erreur initialisation:", err);
    showAlert(err.message, "error");
  }
}); 