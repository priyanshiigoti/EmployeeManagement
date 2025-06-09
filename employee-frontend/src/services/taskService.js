// taskService.js
import api from "../axiosConfig";

const taskService = {
  getPaged: (request) => api.post("/Task/paged", request),
  create: (data) => api.post("/Task", data),
  update: (id, data) => api.put(`/Task/${id}`, data),
  delete: (id) => api.delete(`/Task/${id}`),
  getEmployees: () => api.get("/Task/employees")
};

export default taskService;
