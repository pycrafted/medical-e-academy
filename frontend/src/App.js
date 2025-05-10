import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import DicomList from './components/DicomList';
import ExerciseList from './components/ExerciseList';
import Login from './components/Login';
import Register from './components/Register';
import TeacherDashboard from './components/TeacherDashboard';
import './App.css';

// Composant pour gérer l'affichage conditionnel de la Navbar
function Layout() {
  const location = useLocation();
  // Ajout de '/' dans les routes où la navbar doit être cachée
  const hideNavbar = ['/', '/login', '/register'].includes(location.pathname);

  return (
    <>
      {!hideNavbar && <Navbar />}
      <div className="container">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dicom" element={<DicomList />} />
          <Route path="/exercises" element={<ExerciseList />} />
          <Route path="/teacher" element={<TeacherDashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Login />} />
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;