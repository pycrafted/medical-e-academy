import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'doctor',
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/auth/users', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setUsers(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur lors du chargement des utilisateurs');
      }
    };
    fetchUsers();
  }, []);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        'http://localhost:5000/api/auth/create-user',
        form,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      alert('Utilisateur créé avec succès');
      // Rafraîchir la liste des utilisateurs
      const res = await axios.get('http://localhost:5000/api/auth/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setUsers(res.data);
      // Réinitialiser le formulaire
      setForm({ name: '', email: '', password: '', role: 'doctor' });
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création de l’utilisateur');
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) {
      try {
        await axios.delete(`http://localhost:5000/api/auth/users/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        alert('Utilisateur supprimé');
        const res = await axios.get('http://localhost:5000/api/auth/users', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setUsers(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  return (
    <div className="admin-dashboard">
      <h2>Administration</h2>
      {error && <p className="error">{error}</p>}

      <div className="card">
        <h3>Créer un nouvel utilisateur</h3>
        <form onSubmit={handleCreateUser} className="create-user-form">
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
            <label>Mot de passe :</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <label>Rôle :</label>
            <select
              name="role"
              value={form.role}
              onChange={handleInputChange}
              required
            >
              <option value="doctor">Médecin</option>
              <option value="assistant">Assistant</option>
              <option value="researcher">Chercheur</option>
            </select>
          </div>
          <button type="submit">Créer l’utilisateur</button>
        </form>
      </div>

      <div className="card">
        <h3>Gestion des utilisateurs</h3>
        {users.length === 0 ? (
          <p>Aucun utilisateur trouvé.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>
                    <button onClick={() => handleDeleteUser(user.id)}>Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;