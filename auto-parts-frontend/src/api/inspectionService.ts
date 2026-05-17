import axiosClient from './axiosClient';

// Định nghĩa Types (Tương tự DTO bên Java)
export interface CreateSessionRequest {
    lotCode: string;
    partId: number;
}

export const inspectionService = {
    createSession: async (data: CreateSessionRequest) => {
        const response = await axiosClient.post('/inspections/sessions', data);
        return response.data;
    },

    getSession: async (sessionId: number) => {
        const response = await axiosClient.get(`/inspections/sessions/${sessionId}`);
        return response.data;
    },

    updateStatus: async (sessionId: number, status: string) => {
        const response = await axiosClient.patch(`/inspections/sessions/${sessionId}/status`, { status });
        return response.data;
    },

    // ĐẶC BIỆT: Upload File phải dùng FormData và đổi Content-Type
    addDetailImage: async (sessionId: number, imageFile: File) => {
        const formData = new FormData();
        formData.append('image', imageFile);

        const response = await axiosClient.post(
            `/inspections/sessions/${sessionId}/details`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    }
};