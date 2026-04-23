import { api } from './api';

export interface HospitalInventory {
  id: string;
  bloodType: string;
  units: number;
  updatedAt: string;
}

export const hospitalService = {
  getInventory: async () => {
    const response = await api.get<HospitalInventory[]>('/hospitals/inventory');
    return response.data;
  },

  updateInventory: async (bloodType: string, units: number) => {
    const response = await api.put<HospitalInventory>('/hospitals/inventory', {
      bloodType,
      units,
    });
    return response.data;
  },
};
