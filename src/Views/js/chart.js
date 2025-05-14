// === charts.js ===
export function renderUserRolesChart(data) {
 const ctx = document.getElementById('user-roles-chart').getContext('2d');
 new Chart(ctx, {
   type: 'pie',
   data: {
     labels: ['Candidats', 'Recruteurs'],
     datasets: [{
       label: 'Répartition des rôles',
       data: [data.candidats, data.recruteurs],
       backgroundColor: ['#4f46e5', '#10b981'],
       borderWidth: 1
     }]
   },
   options: {
     responsive: true,
     plugins: {
       legend: {
         position: 'bottom'
       },
       title: {
         display: true,
         text: 'Utilisateurs par rôle'
       }
     }
   }
 });
}
export function renderCvDistributionChart(data) {
 const ctx = document.getElementById('cv-distribution-chart').getContext('2d');
 new Chart(ctx, {
   type: 'bar',
   data: {
     labels: data.labels,
     datasets: [{
       label: 'Nombre de CVs',
       data: data.counts,
       backgroundColor: '#4f46e5'
     }]
   },
   options: {
     responsive: true,
     plugins: {
       legend: { display: false },
       title: {
         display: true,
         text: 'CVs par utilisateur'
       }
     },
     scales: {
       y: {
         beginAtZero: true
       }
     }
   }
 });
}