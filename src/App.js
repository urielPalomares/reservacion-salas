import React, { useState, useEffect } from 'react';
import './App.css';
import ReservationForm from './components/ReservationForm';
import ReservationsList from './components/ReservationsList';
import ConflictMessage from './components/ConflictMessage';
import { reservationService } from './services/api';

function App() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [conflictInfo, setConflictInfo] = useState(null);

  // Cargar reservas al iniciar
  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const data = await reservationService.getReservations();
      setReservations(data);
      setError('');
    } catch (error) {
      setError('Error al cargar las reservas');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReservationCreated = (response) => {
    // Recargar la lista de reservas
    loadReservations();
    
    // Mostrar mensaje de éxito
    alert(`Reserva creada exitosamente! ID: ${response.id}`);
  };

  const handleConflict = (nextAvailable, timezone) => {
    setConflictInfo({ nextAvailable, timezone });
  };

  const closeConflictMessage = () => {
    setConflictInfo(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Sistema de Reservas de Sala de Reuniones</h1>
      </header>
      
      <main className="App-main">
        <div className="container">
          <div className="form-section">
            <ReservationForm 
              onReservationCreated={handleReservationCreated}
              onConflict={handleConflict}
            />
          </div>
          
          <div className="list-section">
            {error && <div className="error-message">{error}</div>}
            {loading ? (
              <div className="loading">Cargando reservas...</div>
            ) : (
              <ReservationsList reservations={reservations} />
            )}
          </div>
        </div>
      </main>

      {conflictInfo && (
        <ConflictMessage 
          nextAvailable={conflictInfo.nextAvailable}
          timezone={conflictInfo.timezone}
          onClose={closeConflictMessage}
        />
      )}
    </div>
  );
}

export default App;