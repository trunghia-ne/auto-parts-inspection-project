import axiosClient from './axiosClient';

export interface CreateSessionRequest {
    lotCode: string;
    partId: number;
}

export const inspectionService = {
    createSession: async (data: CreateSessionRequest) => {
        const response: any = await axiosClient.post('/inspections/sessions', data);
        return response?.data ?? response; 
    },

    getSession: async (sessionId: number) => {
        const response: any = await axiosClient.get(`/inspections/sessions/${sessionId}`);
        return response?.data ?? response; 
    },

    addDetailImage: async (sessionId: number, imageFile: File) => {
        const formData = new FormData();
        formData.append('image', imageFile);
        const response: any = await axiosClient.post(
            `/inspections/sessions/${sessionId}/inspect`, 
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        return response?.data ?? response; 
    },

    updateStatus: async (sessionId: number, status: string) => {
        const response: any = await axiosClient.patch(`/inspections/sessions/${sessionId}/status`, { status });
        return response?.data ?? response; 
    }
};