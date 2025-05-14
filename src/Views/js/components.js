// js/components.js

// Fonction pour afficher les alertes stylisées
function showAlert(message, type = "success") {
  const container = document.querySelector(".alert-container");
  const alert = document.createElement("div");
  alert.className = `enhanced-alert ${type}`;
  alert.innerHTML = `<span class="icon">${type === "success" ? "✅" : "⚠️"}</span> ${message}`;
  container.appendChild(alert);
  setTimeout(() => alert.remove(), 4000);
}

// Charger les utilitaires de manière asynchrone
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Charger utils.js
loadScript('js/utils.js').catch(err => console.error('Erreur lors du chargement de utils.js:', err));

// Gestion du header
function initializeHeader() {
    console.log('=== DÉBUT CHARGEMENT HEADER ===');
    fetch("partials/header.html")
        .then(res => res.text())
        .then(html => {
            const placeholder = document.getElementById("header-placeholder");
            if (placeholder) {
                placeholder.innerHTML = html;
                console.log('Header chargé avec succès');
                
                // Initialiser les composants après le chargement du header
                setTimeout(() => {
                    console.log('Initialisation des composants...');
                    initializeModals();
                    initializeTheme();
                    initializeForms();
                    initializeProfileForm();
                    initializePasswordForm();
                }, 100);

                // Gestion du bouton de déconnexion
                const logoutBtn = document.getElementById("logout-btn");
                if (logoutBtn) {
                    logoutBtn.addEventListener("click", () => {
                        localStorage.removeItem("token");
                        showAlert('Déconnexion réussie', 'success');
                        setTimeout(() => {
                            window.location.href = "login.html";
                        }, 1000);
                    });
                }

                const isCandidat = document.body.classList.contains("is-candidat");
                const isRecruteur = document.body.classList.contains("is-recruteur");

                // Masquer liens invités
                document.querySelectorAll(".guest-only").forEach(el => {
                    if (isCandidat || isRecruteur) el.style.display = "none";
                });

                // Masquer liens utilisateurs si pas connectés
                document.querySelectorAll(".user-only").forEach(el => {
                    if (!(isCandidat || isRecruteur)) el.style.display = "none";
                });

                const isCreateCV = window.location.pathname.includes("create-cv.html");
                const isEditCV = window.location.pathname.includes("edit-cv.html");
                const isViewCv = window.location.pathname.includes("view-cv.html");
                const isGenerate = window.location.pathname.includes("generate.html");
                const isRecruteurDashboard = window.location.pathname.includes("recruteur.html");

                // Navbar uniforme pour edit-cv, view-cv et generate
                if (isEditCV || isViewCv || isGenerate) {
                    const nav = placeholder.querySelector("nav");
                    if (nav) {
                        nav.innerHTML = `
                            <div class="nav-context">
                                <span class="role-label">👤 Candidat</span>
                                <a href="dashboard.html" class="back-btn">← Retour</a>
                                <button id="logout-btn" class="btn btn-danger">Déconnexion</button>
                            </div>
                        `;

                        // Ajouter l'écouteur d'événement pour le nouveau bouton de déconnexion
                        const logoutBtn = document.getElementById("logout-btn");
                        if (logoutBtn) {
                            logoutBtn.addEventListener("click", () => {
                                localStorage.removeItem("token");
                                showAlert('Déconnexion réussie', 'success');
                                setTimeout(() => {
                                    window.location.href = "login.html";
                                }, 1000);
                            });
                        }
                    }
                }

                // Recruteur : remplacer la navbar avec bouton rouge
                if (isRecruteurDashboard) {
                    const nav = placeholder.querySelector("nav");
                    if (nav) {
                        nav.innerHTML = `
                            <div class="nav-context">
                                <span class="role-label">🧑‍💼 Recruteur</span>
                                <button id="logout-btn" class="btn btn-danger">Déconnexion</button>
                            </div>
                        `;

                        const logoutBtn = document.getElementById("logout-btn");
                        if (logoutBtn) {
                            logoutBtn.addEventListener("click", () => {
                                localStorage.removeItem("token");
                                showAlert('Déconnexion réussie', 'success');
                                setTimeout(() => {
                                    window.location.href = "login.html";
                                }, 1000);
                            });
                        }
                    }
                }
            }
        })
        .catch(error => {
            console.error('Erreur lors du chargement du header:', error);
        });
}

// Initialisation du thème
function initializeTheme() {
    console.log('=== DÉBUT INITIALISATION THÈME ===');
    const themeToggle = document.getElementById('theme-toggle');
    console.log('Bouton thème trouvé:', !!themeToggle);
    
    if (!themeToggle) {
        console.warn('Bouton de thème non trouvé');
        return;
    }
    
    const savedTheme = localStorage.getItem('theme');
    console.log('Thème sauvegardé:', savedTheme);
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.textContent = '☀️';
    }
    
    themeToggle.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-theme');
        themeToggle.textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
    console.log('=== FIN INITIALISATION THÈME ===');
}

// Initialisation des formulaires
function initializeForms() {
    console.log('=== DÉBUT INITIALISATION FORMULAIRES ===');
    const forms = document.querySelectorAll('form');
    console.log('Nombre de formulaires trouvés:', forms.length);
    
    forms.forEach((form, index) => {
        console.log(`Traitement du formulaire ${index}:`, {
            id: form.id,
            exists: !!form
        });
        
        if (!form) {
            console.warn(`Formulaire ${index} est null ou undefined`);
            return;
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Valider le formulaire
            const errors = validateForm(form);
            
            if (errors.length > 0) {
                // Afficher les erreurs
                errors.forEach(error => showAlert(error, 'error'));
                return;
            }
            
            // Si pas d'erreur, soumettre le formulaire
            form.submit();
        });
    });
    console.log('=== FIN INITIALISATION FORMULAIRES ===');
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== DÉBUT INITIALISATION PAGE ===');
    initializeHeader();
    console.log('=== FIN INITIALISATION PAGE ===');
});

// Injecte le footer si présent
fetch("partials/footer.html")
  .then(res => res.text())
  .then(html => {
    const footerPlaceholder = document.getElementById("footer-placeholder");
    if (footerPlaceholder) footerPlaceholder.innerHTML = html;
  });

// Fonction d'initialisation du formulaire de profil
function initializeProfileForm() {
    console.log('Initialisation du formulaire de profil...');
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        console.log('Formulaire de profil trouvé');
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Soumission du formulaire de profil');
            
            const token = localStorage.getItem('token');
            if (!token) {
                showAlert('Session expirée, veuillez vous reconnecter', 'error');
                return;
            }
            
            const formData = {
                nom: document.getElementById('nom').value,
                date_naissance: document.getElementById('date_naissance').value,
                email: document.getElementById('email').value,
                telephone: document.getElementById('telephone').value
            };

            console.log('Données du formulaire:', formData);

            try {
                // Mettre à jour le profil utilisateur
                const response = await fetch('/utilisateurs/me', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        nom: formData.nom,
                        email: formData.email,
                        date_naissance: formData.date_naissance
                    })
                });

                console.log('Réponse du serveur:', response.status);
                const data = await response.json();
                console.log('Données reçues:', data);

                if (!response.ok) {
                    throw new Error(data.message || 'Erreur lors de la mise à jour du profil');
                }

                // Si le téléphone a été modifié, mettre à jour le CV
                if (formData.telephone) {
                    const cvResponse = await fetch(`/utilisateurs/${data.utilisateur.id}/cv`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            telephone: formData.telephone
                        })
                    });

                    if (!cvResponse.ok) {
                        throw new Error('Erreur lors de la mise à jour du téléphone');
                    }
                }

                showAlert('Profil mis à jour avec succès', 'success');
                // Fermer la modale
                const modal = document.getElementById('profile-modal');
                if (modal) {
                    modal.classList.remove('show');
                    setTimeout(() => {
                        modal.style.display = 'none';
                    }, 300);
                }
            } catch (error) {
                console.error('Erreur lors de la mise à jour du profil:', error);
                showAlert(error.message || 'Erreur lors de la mise à jour du profil', 'error');
            }
        });
    } else {
        console.warn('Formulaire de profil non trouvé');
    }
}

// Fonction pour valider le mot de passe
function validatePassword(password) {
    const estLongAssez = password.length >= 6;
    const contientLettre = /[a-zA-Z]/.test(password);
    const contientChiffre = /\d/.test(password);

    if (!estLongAssez) {
        return { valid: false, message: 'Le mot de passe doit contenir au moins 6 caractères.' };
    }
    if (!contientLettre) {
        return { valid: false, message: 'Le mot de passe doit contenir au moins une lettre.' };
    }
    if (!contientChiffre) {
        return { valid: false, message: 'Le mot de passe doit contenir au moins un chiffre.' };
    }

    return { valid: true };
}

// Fonction d'initialisation du formulaire de mot de passe
function initializePasswordForm() {
    console.log('Initialisation du formulaire de mot de passe...');
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        console.log('Formulaire de mot de passe trouvé');
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Soumission du formulaire de mot de passe');
            
            const token = localStorage.getItem('token');
            if (!token) {
                showAlert('Session expirée, veuillez vous reconnecter', 'error');
                return;
            }

            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            // Validation du nouveau mot de passe
            const passwordValidation = validatePassword(newPassword);
            if (!passwordValidation.valid) {
                showAlert(passwordValidation.message, 'error');
                return;
            }

            // Vérification que les mots de passe correspondent
            if (newPassword !== confirmPassword) {
                showAlert('Les mots de passe ne correspondent pas', 'error');
                return;
            }

            try {
                // Vérifier d'abord le mot de passe actuel
                const verifyResponse = await fetch('/utilisateurs/verify-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        currentPassword
                    })
                });

                if (!verifyResponse.ok) {
                    throw new Error('Mot de passe actuel incorrect');
                }

                // Si le mot de passe actuel est correct, changer le mot de passe
                const changeResponse = await fetch('/utilisateurs/change-password', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        newPassword
                    })
                });

                if (!changeResponse.ok) {
                    const data = await changeResponse.json();
                    throw new Error(data.message || 'Erreur lors du changement de mot de passe');
                }

                showAlert('Mot de passe modifié avec succès', 'success');
                
                // Fermer la modale
                const modal = document.getElementById('password-modal');
                if (modal) {
                    modal.classList.remove('show');
                    setTimeout(() => {
                        modal.style.display = 'none';
                    }, 300);
                }

                // Vider les champs
                document.getElementById('current-password').value = '';
                document.getElementById('new-password').value = '';
                document.getElementById('confirm-password').value = '';

            } catch (error) {
                console.error('Erreur lors du changement de mot de passe:', error);
                showAlert(error.message, 'error');
            }
        });
    } else {
        console.warn('Formulaire de mot de passe non trouvé');
    }
}

// Gestion des modales
function initializeModals() {
    console.log('=== DÉBUT INITIALISATION MODALES ===');
    console.log('État du DOM:', document.readyState);
    
    try {
        // Ouvrir les modales
        const modalLinks = document.querySelectorAll('[data-modal]');
        console.log('Nombre de liens modales trouvés:', modalLinks.length);
        console.log('Liens trouvés:', Array.from(modalLinks).map(link => ({
            id: link.id,
            dataModal: link.getAttribute('data-modal'),
            text: link.textContent
        })));
        
        if (modalLinks.length === 0) {
            console.warn('Aucun lien modal trouvé dans le DOM');
            return;
        }

        modalLinks.forEach((link, index) => {
            console.log(`Traitement du lien ${index}:`, {
                element: link,
                dataModal: link?.getAttribute('data-modal'),
                exists: !!link
            });
            
            if (!link) {
                console.warn(`Lien ${index} est null ou undefined`);
                return;
            }

            link.addEventListener('click', (e) => {
                e.preventDefault();
                const modalId = link.getAttribute('data-modal');
                console.log('Tentative d\'ouverture de la modale:', modalId);
                const modal = document.getElementById(modalId);
                if (modal) {
                    // Si c'est la modale de profil, charger les données
                    if (modalId === 'profile-modal') {
                        console.log('Chargement des données du profil...');
                        loadProfileData();
                    }
                    modal.style.display = 'flex';
                    setTimeout(() => {
                        modal.classList.add('show');
                    }, 10);
                    document.body.style.overflow = 'hidden';
                } else {
                    console.error('Modale non trouvée:', modalId);
                }
            });
        });

        // Fermer les modales
        console.log('Initialisation des boutons de fermeture...');
        const closeButtons = document.querySelectorAll('.close-modal');
        console.log('Nombre de boutons de fermeture trouvés:', closeButtons.length);

        closeButtons.forEach((button, index) => {
            console.log(`Traitement du bouton de fermeture ${index}:`, {
                element: button,
                exists: !!button
            });

            if (!button) {
                console.warn(`Bouton de fermeture ${index} est null ou undefined`);
                return;
            }

            button.addEventListener('click', () => {
                const modal = button.closest('.modal');
                if (modal) {
                    console.log('Fermeture de la modale:', modal.id);
                    modal.classList.remove('show');
                    setTimeout(() => {
                        modal.style.display = 'none';
                    }, 300);
                    document.body.style.overflow = '';
                }
            });
        });

        // Fermer la modale en cliquant en dehors
        console.log('Initialisation des modales pour le clic extérieur...');
        const modals = document.querySelectorAll('.modal');
        console.log('Nombre de modales trouvées:', modals.length);

        modals.forEach((modal, index) => {
            console.log(`Traitement de la modale ${index}:`, {
                element: modal,
                id: modal.id,
                exists: !!modal
            });

            if (!modal) {
                console.warn(`Modale ${index} est null ou undefined`);
                return;
            }

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    console.log('Fermeture de la modale par clic extérieur:', modal.id);
                    modal.classList.remove('show');
                    setTimeout(() => {
                        modal.style.display = 'none';
                    }, 300);
                    document.body.style.overflow = '';
                }
            });
        });

        // Gestion des onglets du guide
        console.log('Initialisation des onglets du guide...');
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        console.log('Nombre d\'onglets trouvés:', tabButtons.length);
        console.log('Nombre de contenus d\'onglets trouvés:', tabContents.length);

        tabButtons.forEach((button, index) => {
            console.log(`Traitement du bouton d'onglet ${index}:`, {
                element: button,
                dataTab: button?.getAttribute('data-tab'),
                exists: !!button
            });

            if (!button) {
                console.warn(`Bouton d'onglet ${index} est null ou undefined`);
                return;
            }

            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                console.log('Clic sur l\'onglet:', tabId);

                // Retirer la classe active de tous les boutons et contenus
                tabButtons.forEach(btn => {
                    if (btn) {
                        console.log('Désactivation du bouton:', btn.getAttribute('data-tab'));
                        btn.classList.remove('active');
                    }
                });

                tabContents.forEach(content => {
                    if (content) {
                        console.log('Désactivation du contenu:', content.id);
                        content.classList.remove('active');
                    }
                });

                // Ajouter la classe active au bouton cliqué
                button.classList.add('active');
                console.log('Activation du bouton:', tabId);

                // Afficher le contenu correspondant
                const content = document.getElementById(`${tabId}-guide`);
                if (content) {
                    console.log('Activation du contenu:', content.id);
                    content.classList.add('active');
                } else {
                    console.warn('Contenu non trouvé pour l\'onglet:', tabId);
                }
            });
        });

    } catch (error) {
        console.error('Erreur lors de l\'initialisation des modales:', error);
    }

    console.log('=== FIN INITIALISATION MODALES ===');
}

// Fonction pour charger les données du profil
async function loadProfileData() {
    console.log('=== DÉBUT CHARGEMENT PROFIL ===');
    
    // Récupérer le token d'authentification
    const token = localStorage.getItem('token');
    console.log('Token trouvé:', token ? 'Oui' : 'Non');
    
    if (!token) {
        console.error('Token non trouvé');
        showAlert('Session expirée, veuillez vous reconnecter', 'error');
        return;
    }

    // Vérifier si les éléments du formulaire existent avant de faire la requête
    const elements = {
        nom: document.getElementById('nom'),
        date_naissance: document.getElementById('date_naissance'),
        email: document.getElementById('email'),
        telephone: document.getElementById('telephone')
    };

    console.log('Éléments du formulaire trouvés:', {
        nom: !!elements.nom,
        date_naissance: !!elements.date_naissance,
        email: !!elements.email,
        telephone: !!elements.telephone
    });

    // Si aucun élément n'est trouvé, ne pas faire la requête
    if (!Object.values(elements).some(el => el)) {
        console.error('Aucun élément du formulaire trouvé');
        showAlert('Erreur: formulaire non trouvé', 'error');
        return;
    }

    try {
        // 1. Récupérer les données du profil utilisateur
        console.log('Récupération des données du profil...');
        const profileResponse = await fetch('/utilisateurs/me', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!profileResponse.ok) {
            throw new Error(`Erreur HTTP: ${profileResponse.status} ${profileResponse.statusText}`);
        }

        const profileData = await profileResponse.json();
        console.log('Données du profil reçues (brutes):', profileData);
        console.log('Propriétés disponibles:', Object.keys(profileData));
        console.log('Date de naissance (date_naissance):', profileData.date_naissance);
        console.log('Date de naissance (dateNaissance):', profileData.dateNaissance);

        // 2. Récupérer les données du CV
        console.log('Récupération des données du CV...');
        const cvResponse = await fetch(`/utilisateurs/${profileData.id}/cv`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        let cvData = null;
        if (cvResponse.ok) {
            cvData = await cvResponse.json();
            console.log('Données du CV reçues:', cvData);
        } else {
            console.log('Aucun CV trouvé pour cet utilisateur');
        }

        // Pré-remplir les champs avec les données reçues
        if (profileData) {
            if (elements.nom) elements.nom.value = profileData.nom || '';
            if (elements.date_naissance) {
                // Formater la date pour l'input date (YYYY-MM-DD)
                const dateNaissance = profileData.date_naissance || profileData.dateNaissance;
                console.log('Date de naissance trouvée:', dateNaissance);
                
                if (dateNaissance) {
                    try {
                        const date = new Date(dateNaissance);
                        console.log('Date parsée:', date);
                        const formattedDate = date.toISOString().split('T')[0];
                        console.log('Date formatée:', formattedDate);
                        elements.date_naissance.value = formattedDate;
                    } catch (error) {
                        console.error('Erreur lors du formatage de la date:', error);
                    }
                } else {
                    console.log('Aucune date de naissance trouvée dans les données');
                }
            }
            if (elements.email) elements.email.value = profileData.email || '';
        }

        // Ajouter le téléphone depuis le CV s'il existe
        if (cvData && elements.telephone) {
            elements.telephone.value = cvData.telephone || '';
        }

    } catch (error) {
        console.error('Erreur détaillée:', {
            message: error.message,
            stack: error.stack
        });
        showAlert('Erreur lors du chargement des informations', 'error');
    } finally {
        console.log('=== FIN CHARGEMENT PROFIL ===');
    }
}
