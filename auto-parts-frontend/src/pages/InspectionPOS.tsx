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
            setCurrentSession(session);
            alert(`Đã khởi tạo lượt kiểm định thành công! ID: #${session.id}`);
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
            // Bước 1: Đổi trạng thái sang PROCESSING (Đang phân tích)
            await inspectionService.updateStatus(currentSession.id, 'PROCESSING');
            setCurrentSession(prev => prev ? { ...prev, status: 'PROCESSING' } : null);

            // Bước 2: Đẩy file ảnh lên endpoint details nhận multipart/form-data
            await inspectionService.addDetailImage(currentSession.id, selectedFile);

            // Bước 3: Giả lập AI trả kết quả (Sau này AI Python/OpenCV tự động cập nhật status sang PASSED/FAILED)
            const mockAIResult = Math.random() > 0.3 ? 'PASSED' : 'FAILED';
            const updatedSession = await inspectionService.updateStatus(currentSession.id, mockAIResult);

            setCurrentSession(updatedSession);
            alert(`Xử lý hoàn tất! Kết quả: ${mockAIResult === 'PASSED' ? 'ĐẠT' : 'LỖI'}`);
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
                // Gọi API /sessions/{id}/cancel của bạn
                const response = await fetch(`http://localhost:8080/api/inspections/sessions/${currentSession.id}/cancel`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                if (response.ok) {
                    setCurrentSession(prev => prev ? { ...prev, status: 'CANCELLED' } : null);
                    alert("Đã hủy lượt kiểm định.");
                    // Reset trạm về ban đầu
                    setSelectedFile(null);
                    setPreviewUrl(null);
                }
            } catch (err) {
                alert("Hủy thất bại.");
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* CỘT 1 & 2: KHU VỰC CAMERA / UPLOAD & HIỂN THỊ ẢNH (Use Case: Upload ảnh) */}
            <div className="lg:col-span-2 flex flex-col gap-4">
                <div className="bg-slate-950 rounded-xl border border-slate-800 relative p-4 flex flex-col items-center justify-center min-h-[450px]">
                    {previewUrl ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                            <img src={previewUrl} alt="Phụ tùng" className="max-h-[400px] rounded border border-slate-700 object-contain" />
                            {currentSession?.status === 'PASSED' && (
                                <div className="absolute top-4 left-4 bg-emerald-500 text-white font-bold px-4 py-2 rounded shadow">✓ ĐẠT CHẤT LƯỢNG</div>
                            )}
                            {currentSession?.status === 'FAILED' && (
                                <div className="absolute top-4 left-4 bg-red-500 text-white font-bold px-4 py-2 rounded shadow">⚠ PHÁT HIỆN LỖI CHI TIẾT</div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center">
                            <svg className="w-16 h-16 mx-auto text-slate-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            </svg>
                            <p className="text-slate-400 mb-4">Trạm kiểm định đang chờ nhận ảnh bề mặt/kết cấu linh kiện</p>
                        </div>
                    )}

                    {currentSession && currentSession.status === 'PENDING' && (
                        <div className="mt-4">
                            <input type="file" accept="image/*" id="part-image" className="hidden" onChange={handleFileChange} />
                            <label htmlFor="part-image" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-medium text-sm cursor-pointer transition">
                                {selectedFile ? "Thay đổi ảnh khác" : "Chọn ảnh từ thiết bị/bảng kiểm"}
                            </label>
                        </div>
                    )}
                </div>
            </div>

            {/* CỘT 3: KHU VỰC ĐIỀU KHIỂN TÁC VỤ & THÔNG TIN (Tất cả Use Case tích hợp tại đây) */}
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-6 flex flex-col justify-between">
                <div>
                    <h2 className="text-lg font-semibold border-b border-slate-800 pb-2 mb-4 text-blue-400">BẢNG ĐIỀU KHIỂN TÁC VỤ</h2>

                    {/* [USE CASE]: Tạo lượt kiểm định mới */}
                    {!currentSession ? (
                        <form onSubmit={handleCreateSession} className="space-y-4">
                            <h3 className="text-sm font-medium text-slate-300">1. Khởi tạo phiên làm việc mới</h3>
                            <div>
                                <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Chọn Phụ Tùng Kiểm Định</label>
                                <select
                                    className="bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm w-full text-slate-100 focus:outline-none focus:border-blue-500"
                                    value={selectedPartId}
                                    onChange={(e) => setSelectedPartId(e.target.value === '' ? '' : Number(e.target.value))}
                                >
                                    <option value="">-- Chọn phụ tùng từ danh mục --</option>
                                    {parts.map(p => (
                                        <option key={p.id} value={p.id}>{p.partName} ({p.partCode})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Mã Lô Hàng (Lot Code)</label>
                                <input
                                    type="text"
                                    placeholder="Ví dụ: LOT-2026-05"
                                    className="bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm w-full text-slate-100 focus:outline-none focus:border-blue-500"
                                    value={lotCode}
                                    onChange={(e) => setLotCode(e.target.value)}
                                />
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 font-bold py-2 rounded text-sm transition">
                                Bắt Đầu Lượt Kiểm Định mới
                            </button>
                        </form>
                    ) : (
                        /* THÔNG TIN KHI ĐANG TRONG PHIÊN KIỂM ĐỊNH */
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-medium text-slate-300">Lượt kiểm hiện tại: <span className="text-blue-400">#{currentSession.id}</span></h3>
                                <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                                    currentSession.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' :
                                        currentSession.status === 'PROCESSING' ? 'bg-blue-500/20 text-blue-400 animate-pulse' :
                                            currentSession.status === 'PASSED' ? 'bg-emerald-500/20 text-emerald-400' :
                                                currentSession.status === 'FAILED' ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400'
                                }`}>
                                    {currentSession.status}
                                </span>
                            </div>

                            <div className="bg-slate-900 p-4 rounded border border-slate-800 text-xs space-y-2 text-slate-300">
                                <p><span className="text-slate-500">Loại sản phẩm:</span> {currentSession.partName}</p>
                                <p><span className="text-slate-500">Mã Lô hàng:</span> {currentSession.lotCode}</p>
                                <p><span className="text-slate-500">Thời gian tạo:</span> {new Date(currentSession.createdAt).toLocaleTimeString()}</p>
                            </div>

                            {/* [USE CASE]: Gửi ảnh đi xử lý và kiểm định phân loại */}
                            {currentSession.status === 'PENDING' && (
                                <button
                                    onClick={handleUploadImage}
                                    disabled={!selectedFile || loading}
                                    className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 font-bold py-3 rounded text-sm transition"
                                >
                                    {loading ? "ĐANG XỬ LÝ..." : "✓ GỬI ẢNH LÊN SERVER PHÂN TÍCH AI"}
                                </button>
                            )}

                            {/* Nút dọn dẹp trạm để làm lượt tiếp theo */}
                            {(currentSession.status === 'PASSED' || currentSession.status === 'FAILED' || currentSession.status === 'CANCELLED') && (
                                <button
                                    onClick={() => { setCurrentSession(null); setSelectedFile(null); setPreviewUrl(null); setLotCode(''); }}
                                    className="w-full mt-2 bg-slate-800 hover:bg-slate-700 font-bold py-2 rounded text-sm transition"
                                >
                                    + Tiếp Tục Kiểm Linh Kiện Mới
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* [USE CASE]: Hủy lượt kiểm định sai (Chỉ cho phép khi đang PENDING hoặc PROCESSING) */}
                {currentSession && (currentSession.status === 'PENDING' || currentSession.status === 'PROCESSING') && (
                    <div className="pt-4 border-t border-slate-800">
                        <button
                            onClick={handleCancelSession}
                            disabled={loading}
                            className="w-full text-xs text-red-400 hover:text-red-300 underline text-center bg-transparent border-none cursor-pointer"
                        >
                            Hủy bỏ lượt kiểm định sai này
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}