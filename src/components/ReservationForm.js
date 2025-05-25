import React, { useState, useEffect } from 'react';
import { reservationService } from '../services/api';
import { 
  TIMEZONES, 
  PRIORITIES, 
  getCurrentDateTime, 
  addOneHour,
  validateDuration,
  isWeekday 
} from '../utils/dateUtils';

const ReservationForm = ({ onReservationCreated, onConflict }) => {
  const [formData, setFormData] = useState({
    date: '',
    startHour: '',
    startMinute: '',
    endHour: '',
    endMinute: '',
    priority: 'normal',
    projector: false,
    capacity: 1,
    timezone: 'America/Mexico_City'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [utcLegend, setUtcLegend] = useState('');

  // genera opciones de tiempo (horas y minutos)
  const generateTimeOptions = (interval = 1) => {
    const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
    const minutes = Array.from({ length: 60 / interval }, (_, i) => String(i * interval).padStart(2, '0'));
    return { hours, minutes };
  };

  const { hours, minutes } = generateTimeOptions();

  // Inicializar fechas y horas cuando cambia la zona horaria o al montar el componente
  useEffect(() => {
    const currentDateTime = getCurrentDateTime(formData.timezone);
    const [datePart, timePart] = currentDateTime.split('T');
    const [currentHour, currentMinute] = timePart.split(':');

    const nextHourDateTime = addOneHour(currentDateTime);
    const [, nextTimePart] = nextHourDateTime.split('T');
    const [nextHour, nextMinute] = nextTimePart.split(':');

    setFormData(prev => ({
      ...prev,
      date: datePart,
      startHour: currentHour,
      startMinute: currentMinute.slice(0,2), // Ensure only two digits
      endHour: nextHour,
      endMinute: nextMinute.slice(0,2), // Ensure only two digits
    }));
  }, [formData.timezone]);

  // Actualizar la leyenda en UTC cuando cambian fecha, hora o zona horaria
  useEffect(() => {
    if (formData.date && formData.startHour && formData.startMinute && formData.endHour && formData.endMinute && formData.timezone) {
      const startTime = `${formData.startHour}:${formData.startMinute}`;
      const endTime = `${formData.endHour}:${formData.endMinute}`;
      const legend = getUTCLegend(formData.date, startTime, endTime, formData.timezone);
      setUtcLegend(legend);
    } else {
      setUtcLegend('');
    }
  }, [formData.date, formData.startHour, formData.startMinute, formData.endHour, formData.endMinute, formData.timezone]);

  // Ayuda para obtener la diferencia de una zona horaria con respecto a UTC en una fecha específica
  const getOffsetMinutesFromUTC = (timeZone, referenceDate) => {
    const timezoneOptions = { 
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: false, timeZone: timeZone 
    };
    const utcOptions = { 
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: false, timeZone: 'UTC' 
    };

    const timezoneString = new Intl.DateTimeFormat('en-US', timezoneOptions).format(referenceDate);
    const utcString = new Intl.DateTimeFormat('en-US', utcOptions).format(referenceDate);
    const timezoneDateAsLocal = new Date(timezoneString);
    const utcDateAsLocal = new Date(utcString);
    const offsetMs = timezoneDateAsLocal.getTime() - utcDateAsLocal.getTime();
    return offsetMs / (1000 * 60); // Offset in minutes
  };


  // Convierte fecha, hora inicio, hora fin y zona horaria a un string de leyenda en UTC
  const getUTCLegend = (date, startTime, endTime, timeZone) => {
    try {
      if (!date || !startTime || !endTime) {
        throw new Error('Fecha, hora de inicio o hora de fin no son válidos.');
      }

      const [year, month, day] = date.split('-').map(Number);
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      const referenceDateForOffset = new Date(year, month - 1, day, startHour, startMinute);
      const offsetMinutesFromUTC = getOffsetMinutesFromUTC(timeZone, referenceDateForOffset);
      const startDateTimeUTC = new Date(Date.UTC(year, month - 1, day, startHour, startMinute) - (offsetMinutesFromUTC * 60 * 1000));
      const endDateTimeUTC = new Date(Date.UTC(year, month - 1, day, endHour, endMinute) - (offsetMinutesFromUTC * 60 * 1000));
      
      if (isNaN(startDateTimeUTC.getTime()) || isNaN(endDateTimeUTC.getTime())) {
        throw new Error('Fecha y hora no son válidas después de la conversión a UTC.');
      }

      const displayFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'UTC',
      };

      const utcFormatter = new Intl.DateTimeFormat('es-ES', displayFormatOptions);
      const startPartsUTC = utcFormatter.formatToParts(startDateTimeUTC);
      const endPartsUTC = utcFormatter.formatToParts(endDateTimeUTC);

      const getDisplayPartValue = (parts, type) => parts.find(part => part.type === type)?.value || '';

      const displayStartDay = getDisplayPartValue(startPartsUTC, 'day');
      const displayStartMonth = getDisplayPartValue(startPartsUTC, 'month');
      const displayStartYear = getDisplayPartValue(startPartsUTC, 'year');
      const displayStartHour = getDisplayPartValue(startPartsUTC, 'hour');
      const displayStartMinute = getDisplayPartValue(startPartsUTC, 'minute');

      const displayEndHour = getDisplayPartValue(endPartsUTC, 'hour');
      const displayEndMinute = getDisplayPartValue(endPartsUTC, 'minute'); // Corrected variable name

      const utcDateForWeekday = new Date(Date.UTC(displayStartYear, displayStartMonth - 1, displayStartDay));
      const dayFormatted = utcDateForWeekday.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      });

      return `Su horario a reservar en UTC es el día ${dayFormatted} de ${displayStartHour}:${displayStartMinute} a ${displayEndHour}:${displayEndMinute}`;

    } catch (error) {
      console.error('Error en getUTCLegend:', error);
      return 'Error al calcular la leyenda en UTC.';
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const startDateTime = `${formData.date}T${formData.startHour}:${formData.startMinute}`;
    const endDateTime = `${formData.date}T${formData.endHour}:${formData.endMinute}`;

    if (!isWeekday(startDateTime)) {
      setError('Solo se permiten reservas en días laborables (lunes a viernes)');
      setLoading(false);
      return;
    }

    const durationValidation = validateDuration(startDateTime, endDateTime);
    if (!durationValidation.isValid) {
      setError(durationValidation.error);
      setLoading(false);
      return;
    }

    if (formData.capacity > 8 || formData.capacity < 1) {
      setError('La capacidad debe ser entre 1 y 8 personas');
      setLoading(false);
      return;
    }

    try {
      const reservationData = {
        startTime: startDateTime,
        endTime: endDateTime,
        priority: formData.priority,
        resources: {
          projector: formData.projector,
          capacity: parseInt(formData.capacity)
        },
        timezone: formData.timezone
      };

      const response = await reservationService.createReservation(reservationData);

      const currentDateTime = getCurrentDateTime(formData.timezone);
      const [datePart, timePart] = currentDateTime.split('T');
      const [currentHour, currentMinute] = timePart.split(':');

      const nextHourDateTime = addOneHour(currentDateTime);
      const [, nextTimePart] = nextHourDateTime.split('T');
      const [nextHour, nextMinute] = nextTimePart.split(':');

      setFormData(prev => ({
        ...prev,
        date: datePart,
        startHour: currentHour,
        startMinute: currentMinute.slice(0,2),
        endHour: nextHour,
        endMinute: nextMinute.slice(0,2),
        priority: 'normal',
        projector: false,
        capacity: 1
      }));

      onReservationCreated(response);
    } catch (error) {
      if (error.error === 'Conflicto de horario' && error.nextAvailable) {
        onConflict(error.nextAvailable, formData.timezone);
      } else {
        setError(error.error || 'Error al crear la reserva');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reservation-form" style={{ maxWidth: '480px', margin: 'auto', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <h2 style={{textAlign: 'center', color: '#2c3e50'}}>Nueva Reserva</h2>
      <form onSubmit={handleSubmit} style={{background: '#f7f9fc', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgb(0 0 0 / 0.1)'}}>
        <div className="form-group" style={{ marginBottom: '12px' }}>
          <label htmlFor="timezone" style={{ fontWeight: 'bold' }}>Zona Horaria:</label>
          <select
            id="timezone"
            name="timezone"
            value={formData.timezone}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            {TIMEZONES.map(timezone => (
              <option key={timezone.value} value={timezone.value}>
                {timezone.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: '12px' }}>
          <label htmlFor="date" style={{ fontWeight: 'bold' }}>Fecha:</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: '12px' }}>
          <label htmlFor="startHour" style={{ fontWeight: 'bold' }}>Hora de Inicio:</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              id="startHour"
              name="startHour"
              value={formData.startHour}
              onChange={handleChange}
              required
              style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              {hours.map(hour => (
                <option key={`start-hour-${hour}`} value={hour}>{hour}</option>
              ))}
            </select>
            <span style={{ alignSelf: 'center', fontWeight: 'bold' }}>:</span>
            <select
              id="startMinute"
              name="startMinute"
              value={formData.startMinute}
              onChange={handleChange}
              required
              style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              {minutes.map(minute => (
                <option key={`start-minute-${minute}`} value={minute}>{minute}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '12px' }}>
          <label htmlFor="endHour" style={{ fontWeight: 'bold' }}>Hora de Fin:</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              id="endHour"
              name="endHour"
              value={formData.endHour}
              onChange={handleChange}
              required
              style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              {hours.map(hour => (
                <option key={`end-hour-${hour}`} value={hour}>{hour}</option>
              ))}
            </select>
            <span style={{ alignSelf: 'center', fontWeight: 'bold' }}>:</span>
            <select
              id="endMinute"
              name="endMinute"
              value={formData.endMinute}
              onChange={handleChange}
              required
              style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              {minutes.map(minute => (
                <option key={`end-minute-${minute}`} value={minute}>{minute}</option>
              ))}
            </select>
          </div>
        </div>

        {utcLegend && (
          <div style={{ marginBottom: '12px', color: '#2980b9', fontWeight: '600' }}>
            {utcLegend}
          </div>
        )}

        <div className="form-group" style={{ marginBottom: '12px' }}>
          <label htmlFor="priority" style={{ fontWeight: 'bold' }}>Prioridad:</label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            {PRIORITIES.map(p => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: '12px' }}>
          <label style={{ fontWeight: 'bold' }}>
            <input
              type="checkbox"
              name="projector"
              checked={formData.projector}
              onChange={handleChange}
              style={{ marginRight: '8px' }}
            />
            Necesita Proyector
          </label>
        </div>

        <div className="form-group" style={{ marginBottom: '12px' }}>
          <label htmlFor="capacity" style={{ fontWeight: 'bold' }}>Capacidad (personas):</label>
          <input
            type="number"
            id="capacity"
            name="capacity"
            min="1"
            max="8"
            value={formData.capacity}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        {error && <div className="error-message" style={{ color: 'red', marginBottom: '12px' }}>{error}</div>}

        <button 
          type="submit" 
          disabled={loading} 
          style={{ 
            width: '100%', 
            padding: '10px', 
            borderRadius: '4px', 
            border: 'none', 
            backgroundColor: loading ? '#95a5a6' : '#27ae60', 
            color: 'white', 
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Creando...' : 'Crear Reserva'}
        </button>
      </form>
    </div>
  );
};

export default ReservationForm;
