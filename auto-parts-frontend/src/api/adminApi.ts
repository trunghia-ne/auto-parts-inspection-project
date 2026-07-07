import axiosClient from './axiosClient';

// ==========================================
// INTERFACES (KIỂU DỮ LIỆU)
// ==========================================

export interface Part {
    id?: number;
    partCode: string;
    partName: string;
    specifications: string;
    aiClassId: number;
    price: number;
}

export interface DashboardStats {
    status: string;
    totalRevenue: number;
    totalUsers?: number;
    totalSessions?: number;
    pendingSessions?: number;
}

// 🔥 Bổ sung Interface cho User
export interface UserResponse {
    id: number;
    username: string;
    fullName?: string;
    companyName?: string;
    email?: string;
    phoneNumber?: string;
    taxCode?: string;
    address?: string;
    roles: string[];
}

export interface UserUpdateRequest {
    fullName?: string;
    companyName?: string;
    email?: string;
    phoneNumber?: string;
    taxCode?: string;
    address?: string;
    roles?: string[]; // VD: ["CUSTOMER"], ["QC"], ["ADMIN"]
}

// ==========================================
// API CLIENT
// ==========================================

export const adminApi = {
    // --- Thống kê ---
    getStats: async () => {
        const res = await axiosClient.get<DashboardStats>('/admin/dashboard/statistics');
        return res.data;
    },
    // Thêm vào dưới hàm getStats:
    getCharts: async () => {
        const res = await axiosClient.get('/admin/dashboard/charts');
        return res.data;
    },

    // --- Quản lý danh mục phụ tùng (CRUD) ---
    getAllParts: async () => {
        const res = await axiosClient.get<Part[]>('/admin/parts');
        return res.data;
    },
    createPart: async (data: Part) => {
        const res = await axiosClient.post<Part>('/admin/parts', data);
        return res.data;
    },
    updatePart: async (id: number, data: Part) => {
        const res = await axiosClient.put<Part>(`/admin/parts/${id}`, data);
        return res.data;
    },
    deletePart: async (id: number) => {
        const res = await axiosClient.delete(`/admin/parts/${id}`);
        return res.data;
    },

    // --- 🔥 Quản lý Người dùng (User Management) ---
    getAllUsers: async () => {
        const res = await axiosClient.get<UserResponse[]>('/admin/users');
        return res.data;
    },
    getUserById: async (id: number) => {
        const res = await axiosClient.get<UserResponse>(`/admin/users/${id}`);
        return res.data;
    },
    createUser: async (data: any) => {
        const res = await axiosClient.post('/auth/register', data);
        return res.data;
    },
    updateUser: async (id: number, data: UserUpdateRequest) => {
        const res = await axiosClient.put<UserResponse>(`/admin/users/${id}`, data);
        return res.data;
    },
    deleteUser: async (id: number) => {
        const res = await axiosClient.delete(`/admin/users/${id}`);
        return res.data;
    },
    // Báo cáo chi tiết:
    getReports: async (startDate: string, endDate: string, status: string) => {
        const res = await axiosClient.get(`/admin/reports/sessions`, {
            params: { startDate, endDate, status }
        });
        return res.data;
    }
};
