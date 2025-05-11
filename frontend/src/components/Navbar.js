import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="nav-links">
          <Link to="/dashboard">Tableau de bord</Link>
          <Link to="/dicom">Bibliothèque DICOM</Link>
          {user?.role === 'patient' && <Link to="/patient">Mon espace patient</Link>}
          {user?.role === 'doctor' && <Link to="/doctor">Espace médecin</Link>}
          {user?.role === 'admin' && <Link to="/admin">Administration</Link>}
          {user?.role === 'assistant' && <Link to="/assistant">Espace assistant</Link>}
        </div>
        <button className="nav-logout" onClick={handleLogout}>
          Déconnexion
        </button>
      </div>
    </nav>
  );
}

export default Navbar;