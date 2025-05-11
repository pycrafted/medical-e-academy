// frontend/src/components/ChangePasswordForm.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ChangePasswordForm.css';

const ChangePasswordForm = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.newPassword !== formData.confirmNewPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/auth/change-password',
        {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccess(true);
      // Mettre à jour l'état de l'utilisateur dans localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      localStorage.setItem('user', JSON.stringify({
        ...user,
        is_default_password: false
      }));

      // Rediriger après 2 secondes
      setTimeout(() => {
        navigate('/patient');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="password-change-success">
        <h2>Mot de passe changé avec succès !</h2>
        <p>Vous serez redirigé vers votre espace patient...</p>
      </div>
    );
  }

  return (
    <div className="password-change-container">
      <h2>Changement de mot de passe obligatoire</h2>
      <p>Pour des raisons de sécurité, vous devez changer votre mot de passe par défaut.</p>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Mot de passe actuel :</label>
          <input
            type="password"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Nouveau mot de passe :</label>
          <input
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            required
            minLength="8"
          />
        </div>

        <div className="form-group">
          <label>Confirmer le nouveau mot de passe :</label>
          <input
            type="password"
            name="confirmNewPassword"
            value={formData.confirmNewPassword}
            onChange={handleChange}
            required
            minLength="8"
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Changement en cours...' : 'Changer le mot de passe'}
        </button>
      </form>
    </div>
  );
};

export default ChangePasswordForm;