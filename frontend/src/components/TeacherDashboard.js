import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Enregistrer les composants nécessaires pour Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function TeacherDashboard() {
  const [exercises, setExercises] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [statistics, setStatistics] = useState({ exerciseStats: [], topStudents: [] });
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    id: null,
    title: '',
    study_id: '',
    question: '',
    correct_answer: '',
  });
  const [editingFeedbackId, setEditingFeedbackId] = useState(null);
  const [editingFeedback, setEditingFeedback] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [exercisesRes, submissionsRes, statisticsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/exercises', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }),
          axios.get('http://localhost:5000/api/exercises/submissions', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }),
          axios.get('http://localhost:5000/api/exercises/statistics', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }),
        ]);
        setExercises(exercisesRes.data);
        setSubmissions(submissionsRes.data);
        setStatistics(statisticsRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur lors du chargement');
      }
    };
    if (user.role === 'teacher') {
      fetchData();
    }
  }, [user.role]);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (form.id) {
        await axios.put(
          `http://localhost:5000/api/exercises/${form.id}`,
          form,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        alert('Exercice modifié avec succès');
      } else {
        await axios.post(
          'http://localhost:5000/api/exercises',
          form,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        alert('Exercice créé avec succès');
      }
      setForm({ id: null, title: '', study_id: '', question: '', correct_answer: '' });
      const res = await axios.get('http://localhost:5000/api/exercises', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setExercises(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (exercise) => {
    setForm({
      id: exercise.id,
      title: exercise.title,
      study_id: exercise.study_id,
      question: exercise.question,
      correct_answer: exercise.correct_answer,
    });
  };

  const handleDeleteExercise = async (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer cet exercice ?')) {
      try {
        await axios.delete(`http://localhost:5000/api/exercises/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        alert('Exercice supprimé avec succès');
        const res = await axios.get('http://localhost:5000/api/exercises', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setExercises(res.data);
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Erreur lors de la suppression de l’exercice';
        setError(errorMessage);
        console.error('Erreur lors de la suppression de l’exercice:', err);
      }
    }
  };

  const handleDeleteSubmission = async (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette soumission ?')) {
      try {
        await axios.delete(`http://localhost:5000/api/exercises/submissions/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        alert('Soumission supprimée avec succès');
        const res = await axios.get('http://localhost:5000/api/exercises/submissions', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setSubmissions(res.data);
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Erreur lors de la suppression de la soumission';
        setError(errorMessage);
        console.error('Erreur lors de la suppression de la soumission:', err);
      }
    }
  };

  const handleEditFeedback = (submission) => {
    setEditingFeedbackId(submission.id);
    setEditingFeedback(submission.feedback);
  };

  const handleCancelEditFeedback = () => {
    setEditingFeedbackId(null);
    setEditingFeedback('');
  };

  const handleSaveFeedback = async (submissionId) => {
    try {
      await axios.put(
        `http://localhost:5000/api/exercises/submissions/${submissionId}/feedback`,
        { feedback: editingFeedback },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      alert('Feedback mis à jour avec succès');
      const res = await axios.get('http://localhost:5000/api/exercises/submissions', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setSubmissions(res.data);
      setEditingFeedbackId(null);
      setEditingFeedback('');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la mise à jour du feedback';
      setError(errorMessage);
      console.error('Erreur lors de la mise à jour du feedback:', err);
    }
  };

  const chartData = {
    labels: statistics.exerciseStats.map((stat) => stat.title),
    datasets: [
      {
        label: 'Note moyenne',
        data: statistics.exerciseStats.map((stat) => stat.average_grade || 0),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
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

  if (user.role !== 'teacher') {
    return <div className="card">Accès réservé aux professeurs.</div>;
  }

  return (
    <div className="teacher-dashboard">
      <h2>Tableau de bord professeur</h2>
      {error && <p className="error">{error}</p>}

      <div className="card">
        <h3>{form.id ? 'Modifier un exercice' : 'Créer un exercice'}</h3>
        <form onSubmit={handleSubmit} className="exercise-form">
          <div>
            <label>Titre :</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <label>ID de l’étude DICOM :</label>
            <input
              type="text"
              name="study_id"
              value={form.study_id}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <label>Question :</label>
            <textarea
              name="question"
              value={form.question}
              onChange={handleInputChange}
              required
              rows="4"
            />
          </div>
          <div>
            <label>Réponse correcte :</label>
            <textarea
              name="correct_answer"
              value={form.correct_answer}
              onChange={handleInputChange}
              required
              rows="2"
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit">{form.id ? 'Modifier' : 'Créer'}</button>
            {form.id && (
              <button
                type="button"
                onClick={() =>
                  setForm({ id: null, title: '', study_id: '', question: '', correct_answer: '' })
                }
              >
                Annuler
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <h3>Mes exercices</h3>
        {exercises.length === 0 ? (
          <p>Aucun exercice créé pour le moment.</p>
        ) : (
          <ul className="submissions-list">
            {exercises.map((exercise) => (
              <li key={exercise.id}>
                {exercise.title} (ID Étude: {exercise.study_id})
                <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                  <button onClick={() => handleEdit(exercise)}>Modifier</button>
                  <button onClick={() => handleDeleteExercise(exercise.id)}>Supprimer</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h3>Statistiques</h3>
        <h4>Notes moyennes par exercice (Graphique)</h4>
        {statistics.exerciseStats.length === 0 ? (
          <p>Aucune donnée disponible pour le graphique.</p>
        ) : (
          <div className="chart-container">
            <Bar data={chartData} options={chartOptions} />
          </div>
        )}

        <h4>Statistiques par exercice</h4>
        {statistics.exerciseStats.length === 0 ? (
          <p>Aucune statistique disponible pour le moment.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Exercice</th>
                <th>Nombre de soumissions</th>
                <th>Note moyenne</th>
              </tr>
            </thead>
            <tbody>
              {statistics.exerciseStats.map((stat) => (
                <tr key={stat.id}>
                  <td>{stat.title}</td>
                  <td style={{ textAlign: 'center' }}>{stat.submission_count}</td>
                  <td style={{ textAlign: 'center' }}>
                    {stat.average_grade !== null ? `${stat.average_grade}/100` : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h4>Meilleurs étudiants</h4>
        {statistics.topStudents.length === 0 ? (
          <p>Aucune donnée sur les étudiants pour le moment.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Étudiant</th>
                <th>Note moyenne</th>
                <th>Nombre de soumissions</th>
              </tr>
            </thead>
            <tbody>
              {statistics.topStudents.map((student) => (
                <tr key={student.id}>
                  <td>{student.student_name}</td>
                  <td style={{ textAlign: 'center' }}>{student.average_grade}/100</td>
                  <td style={{ textAlign: 'center' }}>{student.submission_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>Soumissions des étudiants</h3>
        {submissions.length === 0 ? (
          <p>Aucune soumission pour le moment.</p>
        ) : (
          <ul className="submissions-list">
            {submissions.map((submission) => (
              <li key={submission.id}>
                Exercice: {submission.title}, Étudiant: {submission.student_name},
                Réponse: {submission.answer}, Note: {submission.grade}/100,
                Soumis le: {new Date(submission.submitted_at).toLocaleString()}
                <div>
                  Feedback: {editingFeedbackId === submission.id ? (
                    <div>
                      <textarea
                        value={editingFeedback}
                        onChange={(e) => setEditingFeedback(e.target.value)}
                        rows="3"
                      />
                      <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                        <button onClick={() => handleSaveFeedback(submission.id)}>
                          Enregistrer
                        </button>
                        <button onClick={handleCancelEditFeedback}>
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {submission.feedback}
                      <button onClick={() => handleEditFeedback(submission)} style={{ marginLeft: '10px' }}>
                        Modifier le feedback
                      </button>
                    </>
                  )}
                </div>
                <button onClick={() => handleDeleteSubmission(submission.id)} style={{ marginTop: '5px' }}>
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default TeacherDashboard;