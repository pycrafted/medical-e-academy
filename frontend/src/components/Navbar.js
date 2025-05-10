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
          <Link to="/exercises">Exercices</Link>
          {user?.role === 'teacher' && <Link to="/teacher">Gestion des exercices</Link>}
        </div>
        <button className="nav-logout" onClick={handleLogout}>
          Déconnexion
        </button>
      </div>
    </nav>
  );
}

export default Navbar;