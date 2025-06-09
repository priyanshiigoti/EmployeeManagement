import api from '../axiosConfig';

export const getEmployeesPaginated = async ({
  page = 1,
  pageSize = 10,
  sortColumn = 'Name',
  sortDirection = 'asc',
  searchTerm = '',
}) => {
  const response = await api.get('/Employee', {
    params: {
      pageNumber: page,
      pageSize: pageSize,
      sortColumn: sortColumn,
      sortDirection: sortDirection,
      searchTerm: searchTerm,
    }
  });
  return response.data;
};

export const createEmployee = async (employeeData) => {
  const response = await api.post('/Employee', employeeData);
  return response.data;
};

export const updateEmployee = async (id, employeeData) => {
  const response = await api.put(`/Employee/${id}`, employeeData);
  return response.data;
};

export const deleteEmployee = async (id) => {
  const response = await api.delete(`/Employee/${id}`);
  return response.data;
};

export const getEmployee = async (id) => {
  const response = await api.get(`/Employee/${id}`);
  return response.data;
};
