import React from 'react';
import { Link } from 'react-router-dom';

function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user'));

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
          {user?.role === 'patient' && (
            <Link to="/patient">
              <button>Mon espace patient</button>
            </Link>
          )}
          {user?.role === 'doctor' && (
            <Link to="/doctor">
              <button>Espace médecin</button>
            </Link>
          )}
          {user?.role === 'admin' && (
            <Link to="/admin">
              <button>Administration</button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;