import React from 'react';

function DicomViewer({ studyId }) {
  if (!studyId) {
    return <p style={{ color: 'red' }}>Erreur : ID de l’étude manquant.</p>;
  }

  return (
    <div style={{ height: '600px', width: '100%' }}>
      <iframe
        src={`http://localhost:8042/ohif/viewer?StudyInstanceUIDs=${studyId}`}
        title="OHIF Viewer"
        style={{ width: '100%', height: '100%', border: 'none' }}
        onError={() => (
          <p style={{ color: 'red' }}>
            Erreur lors du chargement de OHIF Viewer. Vérifiez l’ID de l’étude.
          </p>
        )}
      />
    </div>
  );
}

export default DicomViewer;