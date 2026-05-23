// src/api/inspectionService.ts
import axiosClient from './axiosClient';

export interface CreateSessionRequest {
    lotCode: string;
    partId: number;
}

// Thêm đoạn này vào file chứa các service API của bạn
export const partService = {
    getAllParts: async () => {
        return await axiosClient.get('/parts');
    }
}
export const inspectionService = {
    createSession: async (data: CreateSessionRequest) => {
        const response = await axiosClient.post('/inspections/sessions', data);
        return response;
    },

    getSession: async (sessionId: number) => {
        const response = await axiosClient.get(`/inspections/sessions/${sessionId}`);
        return response;
    },

    addDetailImage: async (sessionId: number, imageFile: File) => {
        const formData = new FormData();
        formData.append('image', imageFile);
        const response = await axiosClient.post(
            `/inspections/sessions/${sessionId}/inspect`, // Đảm bảo URL này khớp với Java @PostMapping
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        return response;
    }
};