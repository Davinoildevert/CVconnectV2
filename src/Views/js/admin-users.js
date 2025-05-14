// Gestion des utilisateurs
export class UserManager {
  constructor() {
    this.users = [];
    this.filteredUsers = [];
    this.currentFilter = 'all';
    this.searchTerm = '';
    this.init();
  }

  init() {
    // Initialisation des écouteurs d'événements
    this.initEventListeners();
    // Chargement initial des utilisateurs
    this.loadUsers();
  }

  initEventListeners() {
    // Recherche
    const searchInput = document.querySelector('#users .search-box input');
    searchInput.addEventListener('input', (e) => {
      this.searchTerm = e.target.value.toLowerCase();
      this.filterUsers();
    });

    // Filtre par rôle
    const roleFilter = document.querySelector('#users .filter-box select');
    roleFilter.addEventListener('change', (e) => {
      this.currentFilter = e.target.value;
      this.filterUsers();
    });
  }

  async loadUsers() {
    try {
      const response = await fetch('/admin/utilisateurs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des utilisateurs');
      }

      this.users = await response.json();
      this.filteredUsers = [...this.users];
      this.updateUserTable();
      this.updateStats();
    } catch (error) {
      this.showNotification(error.message, 'error');
    }
  }

  filterUsers() {
    this.filteredUsers = this.users.filter(user => {
      const matchesSearch = 
        user.nom.toLowerCase().includes(this.searchTerm) ||
        user.email.toLowerCase().includes(this.searchTerm);
      
      const matchesFilter = 
        this.currentFilter === 'all' || 
        user.role === this.currentFilter;

      return matchesSearch && matchesFilter;
    });

    this.updateUserTable();
  }

  updateUserTable() {
    const tbody = document.querySelector('#user-table tbody');
    tbody.innerHTML = '';

    this.filteredUsers.forEach(user => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${user.nom}</td>
        <td>${user.email}</td>
        <td>
          <span class="role-badge ${user.role}">
            ${user.role === 'candidat' ? 'Candidat' : 'Recruteur'}
          </span>
        </td>
        <td>${user.role === 'recruteur' ? user.entreprise || '-' : '-'}</td>
        <td>${user.role === 'recruteur' ? user.siret || '-' : '-'}</td>
        <td>
          <span class="status-badge ${user.actif ? 'active' : 'inactive'}">
            ${user.actif ? 'Actif' : 'Inactif'}
          </span>
        </td>
        <td>
          <div class="action-buttons">
            <button class="btn-secondary toggle-status" data-id="${user.id}" data-status="${user.actif}">
              <i class="fas fa-${user.actif ? 'ban' : 'check'}"></i>
              ${user.actif ? 'Désactiver' : 'Activer'}
            </button>
            <button class="btn-danger delete-user" data-id="${user.id}">
              <i class="fas fa-trash"></i>
              Supprimer
            </button>
          </div>
        </td>
      `;

      // Gestion du changement de statut
      tr.querySelector('.toggle-status').addEventListener('click', () => {
        this.toggleUserStatus(user.id, !user.actif);
      });

      // Gestion de la suppression
      tr.querySelector('.delete-user').addEventListener('click', () => {
        this.deleteUser(user.id);
      });

      tbody.appendChild(tr);
    });
  }

  async toggleUserStatus(userId, newStatus) {
    try {
      const response = await fetch(`/admin/utilisateurs/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ actif: newStatus })
      });

      if (!response.ok) {
        throw new Error('Erreur lors du changement de statut');
      }

      // Mise à jour locale
      const user = this.users.find(u => u.id === userId);
      if (user) {
        user.actif = newStatus;
        this.filterUsers();
      }

      this.showNotification(
        `Utilisateur ${newStatus ? 'activé' : 'désactivé'} avec succès`,
        'success'
      );
    } catch (error) {
      this.showNotification(error.message, 'error');
    }
  }

  async deleteUser(userId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      const response = await fetch(`/admin/utilisateurs/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      // Mise à jour locale
      this.users = this.users.filter(u => u.id !== userId);
      this.filterUsers();
      this.updateStats();

      this.showNotification('Utilisateur supprimé avec succès', 'success');
    } catch (error) {
      this.showNotification(error.message, 'error');
    }
  }

  updateStats() {
    const stats = {
      total: this.users.length,
      candidats: this.users.filter(u => u.role === 'candidat').length,
      recruteurs: this.users.filter(u => u.role === 'recruteur').length
    };

    document.getElementById('nb-users').textContent = stats.total;
    document.getElementById('nb-candidats').textContent = stats.candidats;
    document.getElementById('nb-recruteurs').textContent = stats.recruteurs;
  }

  showNotification(message, type = 'success') {
    const notification = document.getElementById('admin-notification');
    notification.textContent = message;
    notification.className = `admin-notification ${type}`;
    notification.style.display = 'block';

    setTimeout(() => {
      notification.style.display = 'none';
    }, 3000);
  }
} 