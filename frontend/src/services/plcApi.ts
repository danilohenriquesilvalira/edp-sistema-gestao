// frontend/src/services/plcApi.ts
import apiService from './api';
import { AxiosResponse } from 'axios';

// PLC API methods
export const plcApi = {
  // PLC CRUD operations
  async getAllPLCs(params?: Record<string, string | number>): Promise<AxiosResponse> {
    return apiService.request({
      method: 'GET',
      url: '/api/plcs',
      params
    });
  },

  async getPLCById(id: number): Promise<AxiosResponse> {
    return apiService.request({
      method: 'GET',
      url: `/api/plcs/${id}`
    });
  },

  async createPLC(plcData: Record<string, any>): Promise<AxiosResponse> {
    return apiService.request({
      method: 'POST',
      url: '/api/plcs',
      data: plcData
    });
  },

  async updatePLC(id: number, plcData: Record<string, any>): Promise<AxiosResponse> {
    return apiService.request({
      method: 'PUT',
      url: `/api/plcs/${id}`,
      data: plcData
    });
  },

  async deletePLC(id: number): Promise<AxiosResponse> {
    return apiService.request({
      method: 'DELETE',
      url: `/api/plcs/${id}`
    });
  },

  // Tag operations
  async getPLCTags(plcId: number, params?: Record<string, string | number>): Promise<AxiosResponse> {
    return apiService.request({
      method: 'GET',
      url: `/api/plcs/${plcId}/tags`,
      params
    });
  },

  async getTagById(id: number): Promise<AxiosResponse> {
    return apiService.request({
      method: 'GET',
      url: `/api/plcs/tags/${id}`
    });
  },

  async createTag(tagData: Record<string, any>): Promise<AxiosResponse> {
    return apiService.request({
      method: 'POST',
      url: '/api/plcs/tags',
      data: tagData
    });
  },

  async updateTag(id: number, tagData: Record<string, any>): Promise<AxiosResponse> {
    return apiService.request({
      method: 'PUT',
      url: `/api/plcs/tags/${id}`,
      data: tagData
    });
  },

  async deleteTag(id: number): Promise<AxiosResponse> {
    return apiService.request({
      method: 'DELETE',
      url: `/api/plcs/tags/${id}`
    });
  },

  async readTagValue(id: number): Promise<AxiosResponse> {
    return apiService.request({
      method: 'GET',
      url: `/api/plcs/tags/${id}/value`
    });
  },

  async writeTagValue(id: number, value: any): Promise<AxiosResponse> {
    return apiService.request({
      method: 'POST',
      url: `/api/plcs/tags/${id}/value`,
      data: { valor: value }
    });
  },

  // Fault management
  async getFaultDefinitions(params?: Record<string, string | number>): Promise<AxiosResponse> {
    return apiService.request({
      method: 'GET',
      url: '/api/falhas',
      params
    });
  },
  
  async getFaultDefinitionById(id: number): Promise<AxiosResponse> {
    return apiService.request({
      method: 'GET',
      url: `/api/falhas/${id}`
    });
  },
  
  async createFaultDefinition(data: Record<string, any>): Promise<AxiosResponse> {
    return apiService.request({
      method: 'POST',
      url: '/api/falhas',
      data
    });
  },
  
  async updateFaultDefinition(id: number, data: Record<string, any>): Promise<AxiosResponse> {
    return apiService.request({
      method: 'PUT',
      url: `/api/falhas/${id}`,
      data
    });
  },
  
  async deleteFaultDefinition(id: number): Promise<AxiosResponse> {
    return apiService.request({
      method: 'DELETE',
      url: `/api/falhas/${id}`
    });
  },
  
  async getActiveFaults(): Promise<AxiosResponse> {
    return apiService.request({
      method: 'GET',
      url: '/api/falhas/ativas'
    });
  },
  
  async getFaultHistory(params?: Record<string, string | number>): Promise<AxiosResponse> {
    return apiService.request({
      method: 'GET',
      url: '/api/falhas/historico',
      params
    });
  },
  
  async acknowledgeFault(id: number): Promise<AxiosResponse> {
    return apiService.request({
      method: 'POST',
      url: `/api/falhas/${id}/reconhecer`
    });
  },
  
  async getEclusasList(): Promise<AxiosResponse> {
    return apiService.request({
      method: 'GET',
      url: '/api/falhas/eclusas'
    });
  },
  
  async getSubsistemasList(eclusa?: string): Promise<AxiosResponse> {
    return apiService.request({
      method: 'GET',
      url: '/api/falhas/subsistemas',
      params: eclusa ? { eclusa } : undefined
    });
  },
  
  // NATS connection info
  async getNatsInfo(): Promise<AxiosResponse> {
    return apiService.request({
      method: 'GET',
      url: '/nats-info'
    });
  }
};

export default plcApi;