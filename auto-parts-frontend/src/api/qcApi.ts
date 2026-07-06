import axiosClient from './axiosClient';

export interface BoundingBox {
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

// 1. Khớp hoàn toàn với record QcSessionResponse trong Java của bác
export interface QcSessionResponse {
    id: number;
    lotCode: string;
    partName: string;
    quantity: number;
    scannedCount: number; 
    status: string;         // PENDING, PENDING_EXPERT, PASSED, FAILED
    paymentStatus: string;  // 🔥 Thêm trường này (Ví dụ: PAID, UNPAID)
    createdAt: string;
    pdfReportUrl: string | null;
    imageUrls?: string[];
}

// 2. Khớp hoàn toàn với record QcManualInspectRequest trong Java của bác
export interface QcManualInspectRequest {
    status: string;      // PASSED hoặc FAILED
    overallNote: string; // Ghi chú tổng quan của chuyên gia kỹ thuật
}

export const qcApi = {
    // 1. Lấy danh sách hàng đợi chờ xử lý (PENDING và PENDING_EXPERT)
    getPendingSessions: async () => {
        const res = await axiosClient.get<QcSessionResponse[]>('/qc/sessions/pending');
        return res.data;
    },

    // 2. Phân tích AI từng tấm ảnh phụ tùng (Bắn dữ liệu dạng Multipart Form)
    analyzeImage: async (id: number, file: File, boundingBoxes?: string) => {
        const formData = new FormData();
        formData.append('file', file);
        if (boundingBoxes) {
            formData.append('boundingBoxes', boundingBoxes);
        }
        
        const res = await axiosClient.post<string>(`/qc/sessions/${id}/analyze`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data; // Trả về câu thông báo: "Đã lưu ảnh thứ X/Y thành công!"
    },

    // 3. Chuyên gia ký duyệt đóng hồ sơ bằng tay (Dành cho đơn PENDING_EXPERT)
    manualInspect: async (id: number, data: QcManualInspectRequest) => {
        const res = await axiosClient.patch<QcSessionResponse>(`/qc/sessions/${id}/inspect`, data);
        return res.data; 
    }
};