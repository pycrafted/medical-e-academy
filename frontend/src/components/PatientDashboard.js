import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AppointmentForm from './AppointmentForm';

function PatientDashboard() {
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [error, setError] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user.is_default_password) {
      const fetchData = async () => {
        try {
          const [patientRes, appointmentsRes, prescriptionsRes] = await Promise.all([
            axios.get(`http://localhost:5000/api/patients/${user.id}`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            }),
            axios.get('http://localhost:5000/api/appointments', {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            }),
            axios.get(`http://localhost:5000/api/prescriptions/${user.id}`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            }),
          ]);
          setPatient(patientRes.data);
          setAppointments(appointmentsRes.data);
          setPrescriptions(prescriptionsRes.data);
        } catch (err) {
          setError(err.response?.data?.message || 'Erreur lors du chargement des données');
        }
      };
      fetchData();
    }
  }, [user.id, user.is_default_password]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmNewPassword } = passwordForm;

    if (newPassword !== confirmNewPassword) {
      setPasswordError('Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setPasswordError('Session expirée. Veuillez vous reconnecter.');
        return;
      }

      await axios.post(
        'http://localhost:5000/api/auth/change-password',
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Mot de passe changé avec succès');
      // Mettre à jour l'utilisateur dans localStorage
      const updatedUser = { ...user, is_default_password: false };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      setPasswordError('');
      // Recharger la page pour charger les données
      window.location.reload();
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Erreur lors du changement de mot de passe');
    }
  };

  const handlePasswordInputChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  if (user.is_default_password) {
    return (
      <div className="patient-dashboard">
        <h2>Changer votre mot de passe</h2>
        <p>Pour des raisons de sécurité, vous devez changer votre mot de passe par défaut avant de continuer.</p>
        {passwordError && <p className="error">{passwordError}</p>}
        <form onSubmit={handlePasswordChange} className="change-password-form">
          <div>
            <label>Mot de passe actuel :</label>
            <input
              type="password"
              name="currentPassword"
              value={passwordForm.currentPassword}
              onChange={handlePasswordInputChange}
              required
            />
          </div>
          <div>
            <label>Nouveau mot de passe :</label>
            <input
              type="password"
              name="newPassword"
              value={passwordForm.newPassword}
              onChange={handlePasswordInputChange}
              required
            />
          </div>
          <div>
            <label>Confirmer le nouveau mot de passe :</label>
            <input
              type="password"
              name="confirmNewPassword"
              value={passwordForm.confirmNewPassword}
              onChange={handlePasswordInputChange}
              required
            />
          </div>
          <button type="submit">Changer le mot de passe</button>
        </form>
      </div>
    );
  }

  return (
    <div className="patient-dashboard">
      <h2>Mon espace patient</h2>
      {error && <p className="error">{error}</p>}
      {patient && (
        <div className="card">
          <h3>Mon dossier médical</h3>
          <p>Nom : {patient.name}</p>
          <p>Email : {patient.email}</p>
          <p>Date de naissance : {new Date(patient.date_of_birth).toLocaleDateString()}</p>
          <p>Genre : {patient.gender}</p>
        </div>
      )}
      <div className="card">
        <h3>Mes rendez-vous</h3>
        {appointments.length === 0 ? (
          <p>Aucun rendez-vous planifié.</p>
        ) : (
          <ul>
            {appointments.map((appt) => (
              <li key={appt.id}>
                Date : {new Date(appt.appointment_date).toLocaleString()}, Médecin ID : {appt.doctor_id}
              </li>
            ))}
          </ul>
        )}
        <AppointmentForm patientId={user.id} />
      </div>
      <div className="card">
        <h3>Mes prescriptions</h3>
        {prescriptions.length === 0 ? (
          <p>Aucune prescription disponible.</p>
        ) : (
          <ul>
            {prescriptions.map((pres) => (
              <li key={pres.id}>
                Médicament : {pres.medication}, Dosage : {pres.dosage}, Instructions : {pres.instructions}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default PatientDashboard;