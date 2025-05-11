import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AssistantDashboard() {
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    date_of_birth: '',
    gender: 'M',
    doctor_id: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/auth/doctors', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setDoctors(res.data);
        if (res.data.length > 0) {
          setForm((prev) => ({ ...prev, doctor_id: res.data[0].id }));
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur lors du chargement des médecins');
      }
    };
    fetchDoctors();
  }, []);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        'http://localhost:5000/api/patients',
        form,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      alert('Patient créé avec succès');
      setForm({
        name: '',
        email: '',
        date_of_birth: '',
        gender: 'M',
        doctor_id: doctors.length > 0 ? doctors[0].id : '',
      });
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création du patient');
    }
  };

  return (
    <div className="assistant-dashboard">
      <h2>Espace Assistant</h2>
      {error && <p className="error">{error}</p>}
      <div className="card">
        <h3>Créer un nouveau patient</h3>
        <form onSubmit={handleSubmit} className="create-patient-form">
          <div>
            <label>Nom :</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <label>Email :</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <label>Date de naissance :</label>
            <input
              type="date"
              name="date_of_birth"
              value={form.date_of_birth}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <label>Genre :</label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleInputChange}
              required
            >
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
              <option value="Other">Autre</option>
            </select>
          </div>
          <div>
            <label>Médecin assigné :</label>
            <select
              name="doctor_id"
              value={form.doctor_id}
              onChange={handleInputChange}
              required
            >
              {doctors.length === 0 ? (
                <option value="">Aucun médecin disponible</option>
              ) : (
                doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name} ({doctor.email})
                  </option>
                ))
              )}
            </select>
          </div>
          <button type="submit" disabled={doctors.length === 0}>
            Créer le patient
          </button>
        </form>
      </div>
    </div>
  );
}

export default AssistantDashboard;