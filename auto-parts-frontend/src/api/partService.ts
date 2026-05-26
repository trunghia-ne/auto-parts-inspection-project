import axiosClient from './axiosClient';

export interface Part {
    id: number;
    partCode: string;
    partName: string;
    specifications: string;
}

export const partService = {
    getAllParts: async (): Promise<Part[]> => {
        const response: any = await axiosClient.get('/parts');
        return response?.data ?? response;
    },

    createPart: async (data: Omit<Part, 'id'>): Promise<Part> => {
        const response: any = await axiosClient.post('/parts', data);
        return response?.data ?? response;
    },

    deletePart: async (id: number): Promise<void> => {
        await axiosClient.delete(`/parts/${id}`);
    }
};