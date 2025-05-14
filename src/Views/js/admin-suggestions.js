export class SuggestionManager {
    constructor() {
        this.suggestions = [];
        this.filteredSuggestions = [];
        this.currentFilter = 'all';
        this.init();
    }

    async init() {
        await this.loadSuggestions();
        this.initEventListeners();
    }

    async loadSuggestions() {
        try {
            const response = await fetch('/admin/suggestions', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Erreur lors du chargement des suggestions');
            }

            this.suggestions = await response.json();
            this.filteredSuggestions = [...this.suggestions];
            this.renderSuggestions();
        } catch (error) {
            console.error('Erreur:', error);
            this.showNotification('Erreur lors du chargement des suggestions', 'error');
        }
    }

    initEventListeners() {
        // Filtre par type de suggestion
        const filterSelect = document.getElementById('suggestion-filter');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.currentFilter = e.target.value;
                this.filterSuggestions();
            });
        }

        // Bouton de rafraîchissement
        const refreshBtn = document.getElementById('refresh-suggestions-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadSuggestions();
            });
        }
    }

    filterSuggestions() {
        if (this.currentFilter === 'all') {
            this.filteredSuggestions = [...this.suggestions];
        } else {
            this.filteredSuggestions = this.suggestions.filter(
                suggestion => suggestion.type === this.currentFilter
            );
        }
        this.renderSuggestions();
    }

    renderSuggestions() {
        const tbody = document.querySelector('#suggestions-table tbody');
        if (!tbody) return;

        if (this.filteredSuggestions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="no-suggestions">
                        Aucune suggestion trouvée
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.filteredSuggestions.map(suggestion => `
            <tr>
                <td>
                    <span class="suggestion-type ${suggestion.type}">
                        ${this.getTypeLabel(suggestion.type)}
                    </span>
                </td>
                <td class="suggestion-content">
                    <div class="suggestion-header">
                        <strong>${suggestion.titre}</strong>
                        <span class="suggestion-date">
                            ${new Date(suggestion.date).toLocaleDateString('fr-FR')}
                        </span>
                    </div>
                    <p>${suggestion.contenu}</p>
                </td>
                <td>
                    <div class="user-info">
                        <span class="user-role ${suggestion.utilisateur.role}">
                            ${suggestion.utilisateur.role === 'candidat' ? 'Candidat' : 'Recruteur'}
                        </span>
                        <span class="user-name">${suggestion.utilisateur.nom}</span>
                    </div>
                </td>
                <td>${new Date(suggestion.date).toLocaleDateString('fr-FR')}</td>
                <td>
                    <span class="status-badge ${suggestion.statut}">
                        ${this.getStatusLabel(suggestion.statut)}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    getTypeLabel(type) {
        const types = {
            'competence': 'Compétence',
            'fonctionnalite': 'Fonctionnalité',
            'autre': 'Autre'
        };
        return types[type] || type;
    }

    getStatusLabel(status) {
        const statuses = {
            'en_attente': 'En attente',
            'en_cours': 'En cours',
            'terminee': 'Terminée',
            'rejetee': 'Rejetée'
        };
        return statuses[status] || status;
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `admin-notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialiser le gestionnaire de suggestions
const suggestionManager = new SuggestionManager(); 