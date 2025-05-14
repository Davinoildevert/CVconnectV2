export class CVManager {
    constructor() {
        this.cvs = [];
        this.filteredCVs = [];
        this.competences = new Map(); // Pour stocker les compétences
        this.searchInput = document.getElementById('cvSearch');
        this.cvsGrid = document.getElementById('cvsGrid');
        this.modal = document.getElementById('cvModal');
        this.closeModalBtn = document.querySelector('.close-modal');
        
        // Récupérer le token d'authentification
        this.token = localStorage.getItem('token');
        if (!this.token) {
            window.location.href = 'login.html';
            return;
        }

        this.headers = {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
        
        this.init();
    }

    async init() {
        try {
            await this.loadCompetences();
            await this.loadCVs();
            this.initEventListeners();
            this.renderCVs();
        } catch (error) {
            console.error('Erreur d\'initialisation:', error);
            this.showNotification('Erreur lors de l\'initialisation', 'error');
        }
    }

    async loadCompetences() {
        try {
            const response = await fetch('/competences', {
                headers: this.headers
            });

            if (!response.ok) {
                throw new Error('Erreur lors du chargement des compétences');
            }

            const competences = await response.json();
            console.log('=== DEBUG COMPÉTENCES ===');
            console.log('Compétences reçues:', competences);
            
            competences.forEach(comp => {
                this.competences.set(comp.id, comp.nom);
            });
            console.log('Map des compétences après chargement:', Array.from(this.competences.entries()));
        } catch (error) {
            console.error('Erreur lors du chargement des compétences:', error);
            this.showNotification('Erreur lors du chargement des compétences', 'error');
        }
    }

    async loadCVs() {
        try {
            const response = await fetch('/admin/cvs', {
                headers: this.headers
            });

            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token');
                window.location.href = 'admin-login.html';
                return;
            }

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            this.cvs = await response.json();
            console.log('CVs chargés:', this.cvs);
            this.filteredCVs = [...this.cvs];
        } catch (error) {
            console.error('Erreur lors du chargement des CVs:', error);
            this.showNotification('Erreur lors du chargement des CVs', 'error');
        }
    }

    initEventListeners() {
        if (!this.searchInput) {
            console.error('Element de recherche non trouvé');
            return;
        }

        // Recherche
        this.searchInput.addEventListener('input', (e) => {
            this.filterCVs(e.target.value);
        });

        // Fermeture de la modale
        if (this.closeModalBtn) {
            this.closeModalBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }

        // Fermeture de la modale en cliquant en dehors
        if (this.modal) {
            window.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.closeModal();
                }
            });
        }
    }

    filterCVs(searchTerm) {
        if (!searchTerm) {
            this.filteredCVs = [...this.cvs];
        } else {
            const term = searchTerm.toLowerCase();
            this.filteredCVs = this.cvs.filter(cv => 
                (cv.titre && cv.titre.toLowerCase().includes(term)) ||
                (cv.utilisateur && cv.utilisateur.nom && cv.utilisateur.nom.toLowerCase().includes(term)) ||
                (cv.competences && cv.competences.some(comp => 
                    comp && comp.toLowerCase().includes(term)
                ))
            );
        }
        this.renderCVs();
    }

    renderCVs() {
        if (!this.cvsGrid) {
            console.error('Grille de CVs non trouvée');
            return;
        }

        this.cvsGrid.innerHTML = '';
        
        if (this.filteredCVs.length === 0) {
            this.cvsGrid.innerHTML = '<p class="no-results">Aucun CV trouvé</p>';
            return;
        }

        this.filteredCVs.forEach(cv => {
            const card = this.createCVCard(cv);
            this.cvsGrid.appendChild(card);
        });
    }

    getInitials(nom) {
        if (!nom) return '??';
        return nom
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }

    createCVCard(cv) {
        const card = document.createElement('div');
        card.className = 'cv-card';
        
        const initials = this.getInitials(cv.utilisateur?.nom);
        
        // Les compétences sont déjà des noms, pas besoin de conversion
        const competencesNoms = Array.isArray(cv.competences) ? cv.competences : [];
        
        card.innerHTML = `
            <div class="cv-header">
                <div class="cv-photo">
                    ${cv.photo ? 
                        `<img src="${cv.photo}" alt="Photo de profil">` :
                        `<div class="cv-initials">${initials}</div>`
                    }
                </div>
                <h3>${cv.titre || 'Sans titre'}</h3>
            </div>
            <div class="cv-body">
                <div class="cv-info">
                    <p><i class="fas fa-user"></i> ${cv.utilisateur?.nom || 'Inconnu'}</p>
                    <p><i class="fas fa-envelope"></i> ${cv.utilisateur?.email || 'Non renseigné'}</p>
                </div>
                <div class="cv-competences">
                    ${competencesNoms.slice(0, 3).map(compName => 
                        `<span class="cv-competence">${compName}</span>`
                    ).join('')}
                    ${competencesNoms.length > 3 ? 
                        `<span class="cv-competence">+${competencesNoms.length - 3}</span>` : 
                        ''}
                </div>
            </div>
            <div class="cv-actions">
                <button class="btn btn-secondary view-details" data-id="${cv.id}">
                    <i class="fas fa-eye"></i> Voir détails
                </button>
                <button class="btn btn-danger delete-cv" data-id="${cv.id}">
                    <i class="fas fa-trash"></i> Supprimer
                </button>
            </div>
        `;
        
        // Ajouter les écouteurs d'événements
        card.querySelector('.view-details').addEventListener('click', () => {
            this.showCVDetails(cv.id);
        });
        
        card.querySelector('.delete-cv').addEventListener('click', () => {
            this.confirmDeleteCV(cv.id);
        });
        
        return card;
    }

    async showCVDetails(cvId) {
        try {
            const response = await fetch(`/admin/cvs/${cvId}`, {
                headers: this.headers
            });

            if (!response.ok) {
                throw new Error('Erreur lors du chargement des détails du CV');
            }

            const cv = await response.json();
            console.log('Détails du CV:', cv); // Debug

            const modalContent = document.querySelector('.modal-body');
            if (!modalContent) {
                console.error('Contenu de la modale non trouvé');
                return;
            }

            const initials = this.getInitials(cv.utilisateur?.nom);
            
            // Les compétences sont déjà des noms, pas besoin de conversion
            const competencesNoms = Array.isArray(cv.competences) ? cv.competences : [];

            modalContent.innerHTML = `
                <div class="cv-detail-content">
                    <div class="cv-detail-header">
                        <div class="cv-photo">
                            ${cv.photo ? 
                                `<img src="${cv.photo}" alt="Photo de profil">` :
                                `<div class="cv-initials">${initials}</div>`
                            }
                        </div>
                        <div class="cv-detail-info">
                            <h2>${cv.titre || 'Sans titre'}</h2>
                            <p><strong>Nom:</strong> ${cv.utilisateur?.nom || 'Inconnu'}</p>
                            <p><strong>Email:</strong> ${cv.utilisateur?.email || 'Non renseigné'}</p>
                            <p><strong>Téléphone:</strong> ${cv.telephone || 'Non renseigné'}</p>
                            <p><strong>Adresse:</strong> ${cv.adresse || 'Non renseignée'}</p>
                        </div>
                    </div>

                    <div class="cv-detail-section">
                        <h3>Description</h3>
                        <p>${cv.description || 'Aucune description fournie'}</p>
                    </div>
                    
                    <div class="cv-detail-section">
                        <h3>Compétences</h3>
                        <div class="cv-competences">
                            ${competencesNoms.length > 0 ? 
                                competencesNoms.map(compName => 
                                    `<span class="cv-competence">${compName}</span>`
                                ).join('') : 
                                'Aucune compétence renseignée'}
                        </div>
                    </div>

                    <div class="cv-detail-section">
                        <h3>Expérience professionnelle</h3>
                        ${Array.isArray(cv.experiences) && cv.experiences.length > 0 ? 
                            cv.experiences.map(exp => `
                                <div class="experience-item">
                                    <p>${exp}</p>
                                </div>
                            `).join('') : '<p>Aucune expérience renseignée</p>'}
                    </div>

                    <div class="cv-detail-section">
                        <h3>Formation</h3>
                        ${Array.isArray(cv.formations) && cv.formations.length > 0 ? 
                            cv.formations.map(formation => `
                                <div class="formation-item">
                                    <p>${formation}</p>
                                </div>
                            `).join('') : '<p>Aucune formation renseignée</p>'}
                    </div>

                    <div class="cv-detail-section">
                        <h3>Soft Skills</h3>
                        ${Array.isArray(cv.softskills) && cv.softskills.length > 0 ? 
                            cv.softskills.map(skill => `
                                <span class="cv-competence">${skill}</span>
                            `).join('') : '<p>Aucun soft skill renseigné</p>'}
                    </div>

                    <div class="cv-detail-section">
                        <h3>Langues</h3>
                        ${Array.isArray(cv.langues) && cv.langues.length > 0 ? 
                            cv.langues.map(langue => `
                                <span class="cv-competence">${langue}</span>
                            `).join('') : '<p>Aucune langue renseignée</p>'}
                    </div>
                </div>
            `;

            this.modal.classList.add('active');
        } catch (error) {
            console.error('Erreur:', error);
            this.showNotification('Erreur lors du chargement des détails du CV', 'error');
        }
    }

    closeModal() {
        if (this.modal) {
            this.modal.classList.remove('active');
        }
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

    confirmDeleteCV(cvId) {
        const cv = this.cvs.find(c => c.id === cvId);
        if (!cv) return;

        const confirmModal = document.createElement('div');
        confirmModal.className = 'modal active';
        confirmModal.innerHTML = `
            <div class="modal-content delete-confirmation">
                <div class="modal-header">
                    <h2>⚠️ Confirmer la suppression</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Vous êtes sur le point de supprimer définitivement le CV de <strong>${cv.utilisateur?.nom || 'Inconnu'}</strong>.</p>
                    </div>
                    <p>Cette action est irréversible et supprimera toutes les données associées à ce CV.</p>
                    <div class="cv-details">
                        <p><strong>Titre :</strong> ${cv.titre || 'Non spécifié'}</p>
                        <p><strong>Compétences :</strong> ${cv.competences?.length || 0}</p>
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-secondary cancel-delete">
                            <i class="fas fa-times"></i> Annuler
                        </button>
                        <button class="btn btn-danger confirm-delete">
                            <i class="fas fa-trash"></i> Supprimer définitivement
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(confirmModal);

        // Gestion des événements
        const closeModal = () => {
            confirmModal.remove();
        };

        confirmModal.querySelector('.close-modal').addEventListener('click', closeModal);
        confirmModal.querySelector('.cancel-delete').addEventListener('click', closeModal);
        confirmModal.querySelector('.confirm-delete').addEventListener('click', () => {
            this.deleteCV(cvId);
            closeModal();
        });

        // Fermeture en cliquant en dehors
        confirmModal.addEventListener('click', (e) => {
            if (e.target === confirmModal) {
                closeModal();
            }
        });
    }

    async deleteCV(cvId) {
        try {
            const response = await fetch(`/admin/cvs/${cvId}`, {
                method: 'DELETE',
                headers: this.headers
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la suppression du CV');
            }

            // Mettre à jour la liste des CVs
            this.cvs = this.cvs.filter(cv => cv.id !== cvId);
            this.filteredCVs = this.filteredCVs.filter(cv => cv.id !== cvId);
            this.renderCVs();

            this.showNotification('CV supprimé avec succès', 'success');
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            this.showNotification('Erreur lors de la suppression du CV', 'error');
        }
    }
}

// Initialiser le gestionnaire de CVs
const cvManager = new CVManager(); 