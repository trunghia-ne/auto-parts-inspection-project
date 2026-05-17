import axiosClient from './axiosClient';

export interface Part {
    id: number;
    partCode: string;
    partName: string;
    specifications: string;
}

export const partService = {
    getAllParts: async (): Promise<Part[]> => {
        const response = await axiosClient.get('/parts');
        return response.data;
    },

    createPart: async (data: Omit<Part, 'id'>): Promise<Part> => {
        const response = await axiosClient.post('/parts', data);
        return response.data;
    },

    deletePart: async (id: number): Promise<void> => {
        await axiosClient.delete(`/parts/${id}`);
    }
};