import React from 'react';
import { formatForDisplay } from '../utils/dateUtils';

const ReservationsList = ({ reservations }) => {
  if (reservations.length === 0) {
    return (
      <div className="reservations-list">
        <h2>Reservas Existentes</h2>
        <p>No hay reservas programadas.</p>
      </div>
    );
  }

  const getTimezoneLabel = (timezone) => {
    const labels = {
      'America/Mexico_City': 'México',
      'America/New_York': 'Nueva York',
      'Asia/Tokyo': 'Tokyo'
    };
    return labels[timezone] || timezone;
  };

  return (
    <div className="reservations-list">
      <h2>Reservas Existentes</h2>
      <table>
        <thead>
          <tr>
            <th>Inicio</th>
            <th>Fin</th>
            <th>Prioridad</th>
            <th>Proyector</th>
            <th>Capacidad</th>
            <th>Zona Horaria</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map((reservation) => (
            <tr key={reservation.id} className={`priority-${reservation.priority}`}>
              <td>{formatForDisplay(reservation.startTime, reservation.timezone)}</td>
              <td>{formatForDisplay(reservation.endTime, reservation.timezone)}</td>
              <td>
                <span className={`priority-badge ${reservation.priority}`}>
                  {reservation.priority === 'high' ? 'Alta' : 'Normal'}
                </span>
              </td>
              <td>{reservation.projector ? '✓' : '✗'}</td>
              <td>{reservation.capacity} personas</td>
              <td>{getTimezoneLabel(reservation.timezone)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReservationsList;