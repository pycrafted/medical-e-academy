import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Enregistrer les composants nécessaires pour Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

function Dashboard() {
  const [badges, setBadges] = useState([]);
  const [progressData, setProgressData] = useState({ submissions: [], averageGrades: [] });
  const [error, setError] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchData = async () => {
      if (user.role === 'student') {
        try {
          // Récupérer les badges
          const badgesResponse = await axios.get('http://localhost:5000/api/exercises/badges', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          });
          setBadges(badgesResponse.data);

          // Récupérer les données de progression
          const progressResponse = await axios.get('http://localhost:5000/api/exercises/student-progress', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          });
          setProgressData(progressResponse.data);
        } catch (err) {
          setError(err.response?.data?.message || 'Erreur lors du chargement des données');
          console.error('Erreur fetchData:', err);
        }
      }
    };
    fetchData();
  }, [user.role]);

  // Préparer les données pour le graphique linéaire (évolution des notes dans le temps)
  const lineChartData = {
    labels: progressData.submissions.map((submission) =>
      new Date(submission.submitted_at).toLocaleDateString()
    ),
    datasets: [
      {
        label: 'Note',
        data: progressData.submissions.map((submission) => submission.grade),
        fill: false,
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1,
      },
    ],
  };

  const lineChartOptions = {
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Note (/100)',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Date de soumission',
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      title: {
        display: true,
        text: 'Évolution de vos notes dans le temps',
      },
    },
  };

  // Préparer les données pour le graphique en barres (note moyenne par exercice)
  const barChartData = {
    labels: progressData.averageGrades.map((grade) => grade.title),
    datasets: [
      {
        label: 'Note moyenne',
        data: progressData.averageGrades.map((grade) => grade.average_grade),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const barChartOptions = {
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Note moyenne (/100)',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Exercices',
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      title: {
        display: true,
        text: 'Notes moyennes par exercice',
      },
    },
  };

  return (
    <div className="dashboard">
      <h2>Bienvenue, {user?.name} !</h2>
      <p>Votre rôle : {user?.role}</p>

      <div className="card">
        <h3>Actions rapides</h3>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <Link to="/dicom">
            <button>Voir la bibliothèque DICOM</button>
          </Link>
          <Link to="/exercises">
            <button>Accéder aux exercices</button>
          </Link>
          {user?.role === 'teacher' && (
            <Link to="/teacher">
              <button>Gérer les exercices</button>
            </Link>
          )}
        </div>
      </div>

      {user.role === 'student' && (
        <>
          {/* Section des graphes de progression */}
          <div className="card">
            <h3>Votre progression</h3>
            {error && <p className="error">{error}</p>}

            <h4>Évolution de vos notes dans le temps</h4>
            {progressData.submissions.length === 0 ? (
              <p>Aucune soumission pour afficher l’évolution des notes.</p>
            ) : (
              <div className="chart-container">
                <Line data={lineChartData} options={lineChartOptions} />
              </div>
            )}

            <h4>Notes moyennes par exercice</h4>
            {progressData.averageGrades.length === 0 ? (
              <p>Aucune soumission pour afficher les notes moyennes par exercice.</p>
            ) : (
              <div className="chart-container">
                <Bar data={barChartData} options={barChartOptions} />
              </div>
            )}
          </div>

          {/* Section des badges */}
          <div className="card">
            <h3>Mes Badges</h3>
            {badges.length === 0 ? (
              <p>Aucun badge obtenu pour le moment. Continuez à travailler sur les exercices !</p>
            ) : (
              <ul className="badges-list">
                {badges.map((badge) => (
                  <li key={badge.id}>
                    <strong>{badge.name}</strong> - {badge.description} (Obtenu le :{' '}
                    {new Date(badge.awarded_at).toLocaleString()})
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;