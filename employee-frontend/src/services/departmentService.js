import api from '../axiosConfig';
import axios from 'axios';


export const getDepartments = async ({
  draw = 1,
  page = 1,
  pageSize = 10,
  searchTerm = '',
  sortColumn = 'Name',
  sortDirection = 'asc'
} = {}) => {
  try {
    const params = {
      draw,
      page,
      pageSize,
      searchTerm,
      sortColumn,
      sortDirection
    };

    const response = await api.get('/Department', { params });
    return response.data;
  } catch (error) {
    console.error('Error details:', error.response ? error.response.data : error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch departments');
  }
};



// Keep the create, update, delete functions the same

export const createDepartment = async (departmentData) => {
  try {
    const response = await api.post('/Department', departmentData);
    return response.data;
  } catch (error) {
    console.error('Error creating department:', error.response?.data);
    throw new Error(error.response?.data?.message || 'Failed to create department');
  }
};

export const updateDepartment = async (id, departmentData) => {
  try {
    const response = await api.put(`/Department/${id}`, departmentData);
    return response.data;
  } catch (error) {
    console.error('Error updating department:', error.response?.data);
    throw new Error(error.response?.data?.message || 'Failed to update department');
  }
};

export const deleteDepartment = async (id) => {
  try {
    const response = await api.delete(`/Department/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting department:', error.response?.data);
    throw new Error(error.response?.data?.message || 'Failed to delete department');
  }
};

export const getActiveDepartments = async () => {
  try {
    const response = await api.get('/Employee/active'); 
    return response.data;
  } catch (error) {
    console.error("Error fetching active departments:", error.response?.data || error.message);
    throw error;
  }
};
