// frontend/src/components/PatientDashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './PatientDashboard.css';

const PatientDashboard = () => {
  const [medicalRecord, setMedicalRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.is_default_password) {
      return;
    }

    const fetchMedicalRecord = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `http://localhost:5000/api/patients/${user.id}/medical-record`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMedicalRecord(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur lors du chargement du dossier médical');
      } finally {
        setLoading(false);
      }
    };

    fetchMedicalRecord();
  }, [user]);

  const handleViewDicom = (studyId) => {
    window.open(`http://localhost:8042/ohif/viewer?StudyInstanceUIDs=${studyId}`, '_blank');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  // Dans le cas où is_default_password est true
if (user?.is_default_password) {
  return (
    <div className="password-change-required">
      <h2>Changement de mot de passe requis</h2>
      <p>Pour des raisons de sécurité, veuillez changer votre mot de passe par défaut.</p>
      <button
        onClick={() => navigate('/change-password')}
        className="change-password-button"
      >
        Changer mon mot de passe
      </button>
    </div>
  );
}

  if (loading) {
    return <div className="loading">Chargement de votre dossier médical...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="patient-dashboard">
      <h1>Mon Dossier Médical</h1>

      {medicalRecord && (
        <>
          {/* Section Informations Personnelles */}
          <section className="personal-info">
            <h2>Informations Personnelles</h2>
            <div className="info-grid">
              <div>
                <label>Nom Complet:</label>
                <p>{medicalRecord.patientInfo.name}</p>
              </div>
              <div>
                <label>Date de Naissance:</label>
                <p>{formatDate(medicalRecord.patientInfo.date_of_birth)}</p>
              </div>
              <div>
                <label>Genre:</label>
                <p>{medicalRecord.patientInfo.gender === 'M' ? 'Masculin' : 'Féminin'}</p>
              </div>
              <div>
                <label>Groupe Sanguin:</label>
                <p>{medicalRecord.patientInfo.blood_type || 'Non spécifié'}</p>
              </div>
              <div>
                <label>Médecin Traitant:</label>
                <p>{medicalRecord.patientInfo.doctor.name}</p>
              </div>
            </div>
          </section>

          {/* Section Allergies */}
          <section className="allergies-section">
            <h2>Allergies</h2>
            {medicalRecord.medicalData.allergies.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Allergie</th>
                    <th>Sévérité</th>
                  </tr>
                </thead>
                <tbody>
                  {medicalRecord.medicalData.allergies.map((allergy, index) => (
                    <tr key={index}>
                      <td>{allergy.allergy_name}</td>
                      <td>{allergy.severity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>Aucune allergie enregistrée.</p>
            )}
          </section>

          {/* Section Imagerie Médicale */}
          <section className="medical-imaging">
            <h2>Imagerie Médicale</h2>
            {medicalRecord.medicalData.dicomStudies.length > 0 ? (
              <div className="dicom-grid">
                {medicalRecord.medicalData.dicomStudies.map((studyId, index) => (
                  <div key={index} className="dicom-card">
                    <h4>Examen #{index + 1}</h4>
                    <p>ID: {studyId.substring(0, 8)}...</p>
                    <button onClick={() => handleViewDicom(studyId)}>
                      Voir l'examen
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p>Aucun examen d'imagerie disponible.</p>
            )}
          </section>

          {/* Section Prescriptions */}
          <section className="prescriptions">
            <h2>Prescriptions Médicales</h2>
            {medicalRecord.medicalData.prescriptions.length > 0 ? (
              <div className="prescriptions-list">
                {medicalRecord.medicalData.prescriptions.map((prescription, index) => (
                  <div key={index} className="prescription-card">
                    <h4>{prescription.medication}</h4>
                    <p><strong>Dosage:</strong> {prescription.dosage}</p>
                    <p><strong>Instructions:</strong> {prescription.instructions}</p>
                    <p><strong>Prescrit par:</strong> {prescription.doctor_name}</p>
                    <p><strong>Date:</strong> {formatDate(prescription.created_at)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>Aucune prescription disponible.</p>
            )}
          </section>

          {/* Section Historique Médical */}
          <section className="medical-history">
            <h2>Historique Médical</h2>
            {medicalRecord.medicalData.medicalHistory.length > 0 ? (
              <div className="timeline">
                {medicalRecord.medicalData.medicalHistory.map((record, index) => (
                  <div key={index} className="timeline-item">
                    <div className="timeline-date">{formatDate(record.diagnosis_date)}</div>
                    <div className="timeline-content">
                      <h4>{record.condition_name}</h4>
                      <p><strong>Statut:</strong> {record.status}</p>
                      {record.notes && <p><strong>Notes:</strong> {record.notes}</p>}
                      {record.doctor_name && <p><strong>Médecin:</strong> {record.doctor_name}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>Aucun historique médical enregistré.</p>
            )}
          </section>

          {/* Section Rendez-vous */}
          <section className="appointments">
            <h2>Rendez-vous</h2>
            {medicalRecord.medicalData.appointments.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Médecin</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {medicalRecord.medicalData.appointments.map((appointment, index) => (
                    <tr key={index}>
                      <td>{formatDateTime(appointment.appointment_date)}</td>
                      <td>{appointment.doctor_name}</td>
                      <td>{appointment.status || 'Planifié'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>Aucun rendez-vous à venir.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default PatientDashboard;