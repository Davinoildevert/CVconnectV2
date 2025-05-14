export class CompetenceManager {
    constructor() {
        this.competences = [];
        this.init();
    }

    async init() {
        await this.loadCompetences();
        this.initEventListeners();
    }

    async loadCompetences() {
        try {
            const response = await fetch('/admin/competences', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Erreur lors du chargement des compétences');
            }

            this.competences = await response.json();
            this.renderCompetences();
        } catch (error) {
            console.error('Erreur:', error);
            this.showNotification('Erreur lors du chargement des compétences', 'error');
        }
    }

    initEventListeners() {
        const form = document.getElementById('add-competence-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const input = document.getElementById('competence-input');
                if (input && input.value.trim()) {
                    this.addCompetence(input.value.trim());
                    input.value = '';
                }
            });
        }
    }

    async addCompetence(nom) {
        try {
            const response = await fetch('/admin/competences', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nom })
            });

            if (!response.ok) {
                throw new Error('Erreur lors de l\'ajout de la compétence');
            }

            const nouvelleCompetence = await response.json();
            this.competences.push(nouvelleCompetence);
            this.renderCompetences();
            this.showNotification('Compétence ajoutée avec succès', 'success');
        } catch (error) {
            console.error('Erreur:', error);
            this.showNotification('Erreur lors de l\'ajout de la compétence', 'error');
        }
    }

    async deleteCompetence(id) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette compétence ?')) {
            return;
        }

        try {
            const response = await fetch(`/admin/competences/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la suppression de la compétence');
            }

            this.competences = this.competences.filter(c => c.id !== id);
            this.renderCompetences();
            this.showNotification('Compétence supprimée avec succès', 'success');
        } catch (error) {
            console.error('Erreur:', error);
            this.showNotification('Erreur lors de la suppression de la compétence', 'error');
        }
    }

    renderCompetences() {
        const list = document.getElementById('competence-list');
        if (!list) return;

        // Trier les compétences par ordre alphabétique
        const sortedCompetences = [...this.competences].sort((a, b) => 
            a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' })
        );

        // Grouper les compétences par première lettre
        const groupedCompetences = sortedCompetences.reduce((groups, comp) => {
            const firstLetter = comp.nom.charAt(0).toUpperCase();
            if (!groups[firstLetter]) {
                groups[firstLetter] = [];
            }
            groups[firstLetter].push(comp);
            return groups;
        }, {});

        // Créer le HTML avec les groupes
        list.innerHTML = Object.entries(groupedCompetences)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([letter, competences]) => `
                <div class="competence-group">
                    <h3 class="group-letter">${letter}</h3>
                    <div class="competence-tags">
                        ${competences.map(comp => `
                            <div class="competence-tag" data-id="${comp.id}">
                                <span class="tag-name">${comp.nom}</span>
                                <button class="delete-tag" onclick="event.stopPropagation(); competenceManager.deleteCompetence(${comp.id})">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('');
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

// Initialiser le gestionnaire de compétences
const competenceManager = new CompetenceManager(); 