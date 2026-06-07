import React, { useState, useEffect } from 'react';
import { inspectionService } from '../api/inspectionService';
import { partService } from '../api/partService';
import type { Part } from '../api/partService';

interface InspectionSession {
    id: number;
    lotCode: string;
    partId: number;
    partName: string;
    status: 'PENDING' | 'PROCESSING' | 'PASSED' | 'FAILED' | 'CANCELLED';
    createdAt: string;
}

export default function InspectionPOS() {
    // --- State Danh mục (Dùng cho Use Case chọn phụ tùng) ---
    const [parts, setParts] = useState<Part[]>([]);

    // --- State Form Nhập liệu (Use Case: Tạo lượt kiểm) ---
    const [selectedPartId, setSelectedPartId] = useState<number | ''>('');
    const [lotCode, setLotCode] = useState('');

    // --- State Quản lý Lượt kiểm hiện tại ---
    const [currentSession, setCurrentSession] = useState<InspectionSession | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Tải danh mục phụ tùng từ database khi mở trạm
    useEffect(() => {
        partService.getAllParts()
            .then(data => setParts(data))
            .catch(err => console.error("Không thể tải danh mục phụ tùng", err));
    }, []);

    // Xử lý khi nhân viên chọn ảnh từ máy/camera
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file)); // Tạo link ảnh tạm để xem trước trên UI
        }
    };

    // [USE CASE]: Tạo lượt kiểm định (Create Session)
    const handleCreateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPartId || !lotCode.trim()) {
            alert("Vui lòng chọn loại phụ tùng và nhập mã lô hàng!");
            return;
        }
        setLoading(true);
        try {
            const session = await inspectionService.createSession({
                partId: Number(selectedPartId),
                lotCode: lotCode.trim()
            });
            setCurrentSession(session as any);
            alert(`Đã khởi tạo lượt kiểm định thành công! ID: #${(session as any).id}`);
        } catch (err) {
            alert("Khởi tạo lượt kiểm thất bại.");
        } finally {
            setLoading(false);
        }
    };

    // [USE CASE]: Upload ảnh phụ tùng lên Server gửi cho AI xử lý
    const handleUploadImage = async () => {
        if (!currentSession || !selectedFile) {
            alert("Vui lòng tạo lượt kiểm và chọn ảnh trước!");
            return;
        }
        setLoading(true);
        try {
            // Bước 1: Đẩy file ảnh lên endpoint details nhận multipart/form-data
            await inspectionService.addDetailImage(currentSession.id, selectedFile);

            // Bước 2: Lấy lại thông tin session đã được AI cập nhật
            const updatedSession = await inspectionService.getSession(currentSession.id);
            setCurrentSession(updatedSession as any);

            const status = (updatedSession as any).status;
            alert(`Xử lý hoàn tất! Kết quả: ${status === 'PASSED' ? 'ĐẠT' : 'LỖI'}`);
        } catch (err) {
            alert("Lỗi trong quá trình upload hoặc phân tích ảnh.");
        } finally {
            setLoading(false);
        }
    };

    // [USE CASE]: Hủy lượt kiểm định sai
    const handleCancelSession = async () => {
        if (!currentSession) return;
        if (window.confirm("Bạn có chắc chắn muốn hủy lượt kiểm định này không?")) {
            setLoading(true);
            try {
                setCurrentSession(null);
                setSelectedFile(null);
                setPreviewUrl(null);
                alert("Đã hủy lượt kiểm định.");
            } catch (err) {
                alert("Lỗi khi hủy.");
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Trạm Kiểm Định POS</h1>

            {/* Form tạo lượt kiểm */}
            {!currentSession && (
                <form onSubmit={handleCreateSession} className="bg-white shadow rounded-lg p-6 mb-6 space-y-4">
                    <h2 className="text-xl font-semibold text-gray-700">Tạo lượt kiểm mới</h2>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Chọn loại phụ tùng</label>
                        <select
                            value={selectedPartId}
                            onChange={e => setSelectedPartId(Number(e.target.value))}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                            required
                        >
                            <option value="">-- Chọn phụ tùng --</option>
                            {parts.map(part => (
                                <option key={part.id} value={part.id}>
                                    [{part.partCode}] {part.partName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mã lô hàng</label>
                        <input
                            type="text"
                            value={lotCode}
                            onChange={e => setLotCode(e.target.value)}
                            placeholder="VD: LOT-2024-001"
                            className="w-full border border-gray-300 rounded px-3 py-2"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Đang tạo...' : 'Tạo lượt kiểm'}
                    </button>
                </form>
            )}

            {/* Khu vực upload ảnh */}
            {currentSession && (
                <div className="bg-white shadow rounded-lg p-6 mb-6 space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-700">
                            Lượt kiểm #{currentSession.id} — Trạng thái:
                            <span className={`ml-2 px-2 py-1 rounded text-sm ${
                                currentSession.status === 'PASSED' ? 'bg-green-100 text-green-800' :
                                currentSession.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                            }`}>
                                {currentSession.status}
                            </span>
                        </h2>
                        <button
                            onClick={handleCancelSession}
                            className="text-red-600 hover:text-red-800 text-sm"
                        >
                            Hủy lượt kiểm
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Chọn ảnh phụ tùng</label>
                        <input type="file" accept="image/*" onChange={handleFileChange} />
                    </div>

                    {previewUrl && (
                        <img src={previewUrl} alt="Preview" className="max-h-64 rounded border" />
                    )}

                    <button
                        onClick={handleUploadImage}
                        disabled={loading || !selectedFile}
                        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                        {loading ? 'Đang phân tích...' : 'Upload & Phân tích AI'}
                    </button>
                </div>
            )}
        </div>
    );
}