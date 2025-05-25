import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const reservationService = {
  // Crear nueva reserva
  createReservation: async (reservationData) => {
    try {
      const response = await api.post('/reservations', reservationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Obtener todas las reservas
  getReservations: async () => {
    try {
      const response = await api.get('/reservations');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Obtener próximo horario disponible
  getNextAvailable: async (startTime, timezone) => {
    try {
      const response = await api.get('/next-available', {
        params: {
          startTime,
          timezone
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default api;