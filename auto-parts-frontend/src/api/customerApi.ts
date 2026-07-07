import axiosClient from './axiosClient';

// Định nghĩa thêm Interface phản hồi khi tạo đơn thành công
interface CreateSessionResponse {
    message: string;
    sessionId: number;
    paymentUrl?: string; // 🔥 Hứng link VNPay từ Backend trả về
}

export interface Part {
    id: number;
    partCode: string;
    partName: string;
    price: number;
}

export interface SessionResponse {
    id: number;
    lotCode: string;
    partName: string;
    quantity: number;
    status: string;
    paymentStatus: string; // 🔥 Thêm trường này để hiển thị UNPAID / PAID công khai
    paymentMethod: string;
    packageType: string;
    serviceFee: number;
    createdAt: string;
    resultImageUrl?: string;
    pdfReportUrl?: string;
}

export interface CreateSessionRequest {
    lotCode: string;
    partId: number;
    quantity: number;
    packageType: string; // 'BASIC_AI' hoặc 'PREMIUM_EXPERT'
    paymentMethod: string;
}

export const customerApi = {
    getAvailableParts: async () => {
        const res = await axiosClient.get<Part[]>('/customer/sessions/parts');
        return res.data;
    },
    getMySessions: async () => {
        const res = await axiosClient.get<SessionResponse[]>('/customer/sessions');
        return res.data;
    },
    getSessionDetail: async (id: number) => {
        const res = await axiosClient.get<SessionResponse>(`/customer/sessions/${id}`);
        return res.data;
    },
    // 🔥 Cập nhật kiểu trả về ở đây để lấy được paymentUrl luôn
    createSession: async (data: CreateSessionRequest) => {
        const res = await axiosClient.post<CreateSessionResponse>('/customer/sessions', data);
        return res.data;
    },
    // 🔥 Thêm API xác nhận VietQR
    confirmVietQr: async (id: number) => {
        const res = await axiosClient.patch(`/customer/sessions/${id}/confirm-vietqr`);
        return res.data;
    }
};
