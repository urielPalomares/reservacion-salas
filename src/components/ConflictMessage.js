import React from 'react';
import { formatForDisplay } from '../utils/dateUtils';

const ConflictMessage = ({ nextAvailable, timezone, onClose }) => {
  if (!nextAvailable) return null;

  return (
    <div className="conflict-message">
      <div className="conflict-content">
        <h3>⚠️ Conflicto de Horario</h3>
        <p>El horario solicitado no está disponible.</p>
        <p>
          <strong>Próximo horario disponible:</strong><br />
          {formatForDisplay(nextAvailable, timezone)}
        </p>
        <button onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
};

export default ConflictMessage;