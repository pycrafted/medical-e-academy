import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DicomViewer from './DicomViewer';

function ExerciseList() {
  const [exercises, setExercises] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [error, setError] = useState('');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [answer, setAnswer] = useState('');
  const [newBadges, setNewBadges] = useState([]);
  const [isTrainingMode, setIsTrainingMode] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [exercisesRes, submissionsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/exercises'),
          axios.get('http://localhost:5000/api/exercises/my-submissions', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }),
        ]);
        setExercises(exercisesRes.data);
        setSubmissions(submissionsRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur lors du chargement des données');
        console.error('Erreur fetchData:', err);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmissionResult(null);
    setNewBadges([]);

    try {
      if (isTrainingMode) {
        const response = await axios.post('http://localhost:5000/api/exercises/evaluate', {
          exercise_id: selectedExercise.id,
          answer,
        });
        setSubmissionResult({
          grade: response.data.grade,
          feedback: response.data.feedback,
        });
        setAnswer('');
      } else {
        const badgesBefore = await axios.get('http://localhost:5000/api/exercises/badges', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        const response = await axios.post('http://localhost:5000/api/exercises/submit', {
          exercise_id: selectedExercise.id,
          user_id: user.id,
          answer,
        });
        setSubmissionResult({
          grade: response.data.grade,
          feedback: response.data.feedback,
        });
        setAnswer('');

        const submissionsRes = await axios.get('http://localhost:5000/api/exercises/my-submissions', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setSubmissions(submissionsRes.data);

        const badgesAfter = await axios.get('http://localhost:5000/api/exercises/badges', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        const newBadgesEarned = badgesAfter.data.filter(
          (badgeAfter) =>
            !badgesBefore.data.some((badgeBefore) => badgeBefore.id === badgeAfter.id)
        );
        setNewBadges(newBadgesEarned);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la soumission');
      console.error('Erreur handleSubmit:', err);
    }
  };

  const uniqueExercisesSubmitted = [...new Set(submissions.map((sub) => sub.exercise_id))].length;
  const progressPercentage = Math.min((uniqueExercisesSubmitted / 5) * 100, 100);

  return (
    <div className="exercise-list">
      <h2>Exercices de diagnostic</h2>
      {error && <p className="error">{error}</p>}

      <div className="card">
        <h3>Votre progression</h3>
        <p>Exercices complétés : {uniqueExercisesSubmitted}/5</p>
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${progressPercentage}%` }}
          >
            {Math.round(progressPercentage)}%
          </div>
        </div>
      </div>

      {newBadges.length > 0 && (
        <div className="card">
          <h4>Félicitations ! Vous avez obtenu de nouveaux badges :</h4>
          <ul className="badges-list">
            {newBadges.map((badge) => (
              <li key={badge.id}>
                <strong>{badge.name}</strong> - {badge.description}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <h3>Liste des exercices</h3>
        {exercises.length === 0 ? (
          <p>Aucun exercice disponible pour le moment.</p>
        ) : (
          <div>
            <ul>
              {exercises.map((exercise) => (
                <li key={exercise.id}>
                  {exercise.title}{' '}
                  <button onClick={() => setSelectedExercise(exercise)}>
                    Commencer
                  </button>
                </li>
              ))}
            </ul>
            {selectedExercise && (
              <div className="exercise-details">
                <h3>{selectedExercise.title}</h3>
                <DicomViewer studyId={selectedExercise.study_id} />
                <p><strong>Question :</strong> {selectedExercise.question}</p>

                <div style={{ margin: '10px 0' }}>
                  <label>
                    <input
                      type="checkbox"
                      checked={isTrainingMode}
                      onChange={(e) => setIsTrainingMode(e.target.checked)}
                    />
                    Mode entraînement (votre réponse ne sera pas enregistrée)
                  </label>
                </div>

                <form onSubmit={handleSubmit}>
                  <label>
                    Votre réponse :
                    <textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      required
                      rows="4"
                    />
                  </label>
                  <button type="submit">
                    {isTrainingMode ? 'Évaluer ma réponse' : 'Soumettre'}
                  </button>
                </form>
                {submissionResult && (
                  <div style={{ marginTop: '20px' }}>
                    <h4>{isTrainingMode ? 'Résultat de votre entraînement' : 'Résultat de votre soumission'}</h4>
                    <p><strong>Note :</strong> {submissionResult.grade}/100</p>
                    <p><strong>Feedback :</strong> {submissionResult.feedback}</p>
                    {isTrainingMode && (
                      <p style={{ color: 'blue' }}>
                        Ceci est un entraînement. Votre réponse n’a pas été enregistrée.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <h3>Vos soumissions passées</h3>
        {submissions.length === 0 ? (
          <p>Aucune soumission pour le moment.</p>
        ) : (
          <ul className="submissions-list">
            {submissions.map((submission) => (
              <li key={submission.id}>
                Exercice: {submission.title}, Réponse: {submission.answer},
                Note: {submission.grade}/100, Feedback: {submission.feedback},
                Soumis le: {new Date(submission.submitted_at).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ExerciseList;