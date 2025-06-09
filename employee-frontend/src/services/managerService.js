// src/services/managerService.js
import api from '../axiosConfig';

// Get paginated list of managers with sorting and searching
export const getManagersPaginated = async ({
  page = 1,
  pageSize = 10,
  sortColumn = 'firstName',
  sortDirection = 'asc',
  searchTerm = ''
} = {}) => {
  try {
    const params = {
      page,
      pageSize,
      sortColumn,
      sortDirection,
      searchTerm,
    };
    const response = await api.get('/Employee/managerpaged', { params });
    return response.data;
  } catch (error) {
    console.error('getManagersPaginated error', error);
    throw error;
  }
};

// Create a new manager
export const createManager = async (managerData) => {
  try {
const response = await api.post('/Employee/manager', managerData);
    return response.data;
  } catch (error) {
    console.error('createManager error', error);
    throw error;
  }
};

// Update an existing manager
export const updateManager = async (id, managerData) => {
  try {
    const response = await api.put(`/Employee/Manager/${id}`, managerData);
    return response.data;
  } catch (error) {
    console.error('updateManager error', error);
    throw error;
  }
};

export const deleteManager = async (userId) => {
  try {
    const response = await api.delete(`/Employee/manager/${userId}`);
    return response.data;
  } catch (error) {
    console.error('deleteManager error', error);
    throw error;
  }
};


export const getManagerById = async (id) => {
  try {
    const response = await api.get(`/Employee/getManager/${id}`);
    return response.data;
  } catch (error) {
    console.error('getManagerById error', error);
    throw error;
  }
};

