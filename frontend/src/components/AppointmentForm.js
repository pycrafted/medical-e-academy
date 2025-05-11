import React, { useState } from 'react';
import axios from 'axios';

function AppointmentForm({ patientId }) {
  const [form, setForm] = useState({ doctorId: '', appointmentDate: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        'http://localhost:5000/api/appointments',
        { patient_id: patientId, doctor_id: form.doctorId, appointment_date: form.appointmentDate },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      alert('Rendez-vous créé');
      setForm({ doctorId: '', appointmentDate: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création du rendez-vous');
    }
  };

  return (
    <div>
      <h4>Prendre un rendez-vous</h4>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>ID du médecin :</label>
          <input
            type="text"
            value={form.doctorId}
            onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
            required
          />
        </div>
        <div>
          <label>Date et heure :</label>
          <input
            type="datetime-local"
            value={form.appointmentDate}
            onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })}
            required
          />
        </div>
        <button type="submit">Planifier</button>
      </form>
    </div>
  );
}

export default AppointmentForm;