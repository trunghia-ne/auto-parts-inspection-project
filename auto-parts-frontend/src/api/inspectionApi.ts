import axiosClient from './axiosClient';

export interface CreateSessionRequest {
  lotCode: string;
  partId: number;
}

export interface BoundingBox {
  label: 'scratch' | 'crack';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface UpdateStatusRequest {
  status: 'PASSED' | 'FAILED' | 'PENDING' | 'CANCELLED';
  defectType?: string;
  boundingBoxes?: BoundingBox[];
}

export interface InspectionSessionResponse {
  id: number;
  lotCode: string;
  partId: number;
  partName: string;
  status: string;
  createdAt: string;
  defectType: string;
  boundingBoxes: BoundingBox[] | null;
}

export const inspectionApi = {
  createSession: (data: CreateSessionRequest): Promise<InspectionSessionResponse> => {
    return axiosClient.post('/inspections/sessions', data);
  },

  // Khi upload file, ta đè header Content-Type cục bộ
  uploadAndInspect: (sessionId: number, imageFile: File): Promise<any> => {
    const formData = new FormData();
    formData.append('image', imageFile);

    return axiosClient.post(`/inspections/sessions/${sessionId}/inspect`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  updateSessionStatus: (sessionId: number, data: UpdateStatusRequest): Promise<InspectionSessionResponse> => {
    return axiosClient.patch(`/inspections/sessions/${sessionId}/status`, data);
  },

  getSession: (sessionId: number): Promise<InspectionSessionResponse> => {
    return axiosClient.get(`/inspections/sessions/${sessionId}`);
  }
};