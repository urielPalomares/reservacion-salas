import moment from 'moment-timezone';

// Zonas horarias permitidas
export const TIMEZONES = [
  { value: 'America/Mexico_City', label: 'Ciudad de México' },
  { value: 'America/New_York', label: 'Nueva York' },
  { value: 'Asia/Tokyo', label: 'Tokyo' }
];

// Prioridades
export const PRIORITIES = [
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Alta' }
];

// Formatear fecha para mostrar
export const formatForDisplay = (date, timezone) => {
  return moment.tz(date, timezone).format('DD/MM/YYYY HH:mm');
};

// Obtener fecha y hora actual en la zona horaria seleccionada
export const getCurrentDateTime = (timezone) => {
  return moment.tz(timezone).format('YYYY-MM-DDTHH:mm');
};

// Agregar una hora a una fecha
export const addOneHour = (dateTime) => {
  return moment(dateTime).add(1, 'hour').format('YYYY-MM-DDTHH:mm');
};

// Validar que la fecha sea día laboral
export const isWeekday = (date) => {
  const day = moment(date).day();
  return day >= 1 && day <= 5;
};

// Validar duración mínima y máxima en minutos
export const validateDuration = (startTime, endTime) => {
  const duration = moment(endTime).diff(moment(startTime), 'minutes');
  return {
    isValid: duration >= 30 && duration <= 120,
    duration,
    error: duration < 30 ? 'La duración mínima es 30 minutos' : 
           duration > 120 ? 'La duración máxima es 2 horas' : null
  };
};