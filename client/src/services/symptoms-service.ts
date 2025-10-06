// services/symptoms-service.ts
import axios from "axios";

const config = {
  baseApiUrl: "http://localhost:3030",
  apiPath: "/symptoms",
};

const apiClient = axios.create({
  baseURL: config.baseApiUrl,
});

export const symptomsService = {
  getAll: () => apiClient.get(`${config.apiPath}/getAll`),
  get: (id: string) => apiClient.get(`${config.apiPath}/getById/${id}`),
  create: (data: any) => apiClient.post(`${config.apiPath}/create`, data),
  update: (id: string, data: any) =>
    apiClient.put(`${config.apiPath}/update/${id}`, data),
  remove: (id: string) => apiClient.delete(`${config.apiPath}/delete/${id}`),
};
