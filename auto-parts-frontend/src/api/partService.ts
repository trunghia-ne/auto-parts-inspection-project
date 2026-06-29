import axiosClient from './axiosClient';

export interface Part {
  id: number;
  partCode: string;
  partName: string;
  specifications: string;
  aiClassId: number | null; // Cột dùng để AI nhận diện (3 = Bình ắc quy)
}

export interface PartRequest {
  partCode: string;
  partName: string;
  specifications?: string;
  aiClassId?: number;
}

export const partService = {
  getAllParts: (): Promise<Part[]> => {
    return axiosClient.get('/parts');
  },

  getPartById: (id: number): Promise<Part> => {
    return axiosClient.get(`/parts/${id}`);
  },

  createPart: (data: PartRequest): Promise<Part> => {
    return axiosClient.post('/parts', data);
  },

  updatePart: (id: number, data: PartRequest): Promise<Part> => {
    return axiosClient.put(`/parts/${id}`, data);
  },

  deletePart: (id: number): Promise<void> => {
    return axiosClient.delete(`/parts/${id}`);
  }
};