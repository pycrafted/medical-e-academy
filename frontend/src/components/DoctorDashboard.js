import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DicomViewer from './DicomViewer';

function DoctorDashboard() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [form, setForm] = useState({ medication: '', dosage: '', instructions: '' });
  const [error, setError] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/patients', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setPatients(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur lors du chargement des patients');
      }
    };
    fetchPatients();
  }, []);

  const handleSelectPatient = async (patientId) => {
    try {
      const [patientRes, prescriptionsRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/patients/${patientId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        axios.get(`http://localhost:5000/api/prescriptions/${patientId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
      ]);
      setSelectedPatient(patientRes.data);
      setPrescriptions(prescriptionsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des données du patient');
    }
  };

  const handlePrescriptionSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        'http://localhost:5000/api/prescriptions',
        { patient_id: selectedPatient.id, ...form },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      alert('Prescription créée');
      const res = await axios.get(`http://localhost:5000/api/prescriptions/${selectedPatient.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setPrescriptions(res.data);
      setForm({ medication: '', dosage: '', instructions: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création de la prescription');
    }
  };

  return (
    <div className="doctor-dashboard">
      <h2>Espace médecin</h2>
      {error && <p className="error">{error}</p>}
      <div className="card">
        <h3>Mes patients</h3>
        {patients.length === 0 ? (
          <p>Aucun patient assigné.</p>
        ) : (
          <ul>
            {patients.map((patient) => (
              <li key={patient.id}>
                {patient.name} <button onClick={() => handleSelectPatient(patient.id)}>Sélectionner</button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {selectedPatient && (
        <>
          <div className="card">
            <h3>Dossier de {selectedPatient.name}</h3>
            <p>Email : {selectedPatient.email}</p>
            <p>Date de naissance : {new Date(selectedPatient.date_of_birth).toLocaleDateString()}</p>
            <p>Genre : {selectedPatient.gender}</p>
            <DicomViewer studyId={selectedPatient.study_id} /> {/* À adapter si study_id est disponible */}
          </div>
          <div className="card">
            <h3>Prescriptions</h3>
            {prescriptions.length === 0 ? (
              <p>Aucune prescription pour ce patient.</p>
            ) : (
              <ul>
                {prescriptions.map((pres) => (
                  <li key={pres.id}>
                    Médicament : {pres.medication}, Dosage : {pres.dosage}, Instructions : {pres.instructions}
                  </li>
                ))}
              </ul>
            )}
            <h4>Nouvelle prescription</h4>
            <form onSubmit={handlePrescriptionSubmit}>
              <div>
                <label>Médicament :</label>
                <input
                  type="text"
                  value={form.medication}
                  onChange={(e) => setForm({ ...form, medication: e.target.value })}
                  required
                />
              </div>
              <div>
                <label>Dosage :</label>
                <input
                  type="text"
                  value={form.dosage}
                  onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                  required
                />
              </div>
              <div>
                <label>Instructions :</label>
                <textarea
                  value={form.instructions}
                  onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                  required
                  rows="4"
                />
              </div>
              <button type="submit">Ajouter</button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

export default DoctorDashboard;