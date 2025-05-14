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

export function renderTopSkillsChart(data) {
  const ctx = document.getElementById('top-skills-chart').getContext('2d');
  const maxCount = Math.max(...data.counts);
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [{
        label: 'Nombre de CVs',
        data: data.counts,
        backgroundColor: [
          '#4f46e5',
          '#3b82f6',
          '#2563eb',
          '#1d4ed8',
          '#1e40af'
        ],
        borderRadius: 6,
        borderWidth: 0,
        barThickness: 40,
        maxBarThickness: 50
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: 'Top 5 des compétences recherchées',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.raw} CV${context.raw > 1 ? 's' : ''}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Nombre de CVs'
          },
          ticks: {
            stepSize: 1,
            max: maxCount,
            precision: 0
          }
        },
        x: {
          title: {
            display: true,
            text: 'Compétences'
          }
        }
      }
    }
  });
} 