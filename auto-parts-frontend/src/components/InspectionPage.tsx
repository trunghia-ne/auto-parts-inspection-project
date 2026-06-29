import React, { useState, useEffect, useRef, type MouseEvent } from 'react';
import { partService, type Part } from '../api/partService';
import { inspectionApi, type BoundingBox } from '../api/inspectionApi';

export const InspectionPage: React.FC = () => {
    // --- Quản lý State hệ thống ---
    const [parts, setParts] = useState<Part[]>([]);
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Data của phiên hiện tại
    const [lotCode, setLotCode] = useState('');
    const [selectedPartId, setSelectedPartId] = useState<number>(0);
    const [sessionId, setSessionId] = useState<number | null>(null);
    const [imageUrl, setImageUrl] = useState('');

    // State phục vụ việc khoanh vùng lỗi (Human-in-the-loop)
    const [boxes, setBoxes] = useState<BoundingBox[]>([]);
    const [currentLabel, setCurrentLabel] = useState<'scratch' | 'crack'>('scratch');
    const [defectDescription, setDefectDescription] = useState('');
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [activeBox, setActiveBox] = useState<BoundingBox | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);

    // Tải danh mục phụ tùng khi mở trang
    useEffect(() => {
        partService.getAllParts()
            .then(data => {
                setParts(data);
                if (data.length > 0) setSelectedPartId(data[0].id);
            })
            .catch(() => setErrorMessage('Không thể tải danh mục phụ tùng từ máy chủ!'));
    }, []);

    // --- HÀM XỬ LÝ API ---

    // Bấm nút Tạo Phiên Kiểm Định
    const handleCreateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!lotCode.trim()) return;
        setIsLoading(true);
        setErrorMessage('');
        try {
            const session = await inspectionApi.createSession({ lotCode, partId: selectedPartId });
            setSessionId(session.id);
            setCurrentStep(2); // Chuyển sang bước upload ảnh
        } catch (err: any) {
            setErrorMessage('Lỗi khởi tạo phiên kiểm định!');
        } finally {
            setIsLoading(false);
        }
    };

    // Chọn ảnh và bắn lên Cloudinary + AI Python
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !sessionId) return;

        setIsLoading(true);
        setErrorMessage('');
        try {
            const res = await inspectionApi.uploadAndInspect(sessionId, file);

            // Nhận link ảnh Cloudinary từ backend
            setImageUrl(res.detail.imageUrl);

            // Kiểm tra xem AI có báo FAILED ngay lập tức không (Lỗi sai linh kiện)
            if (res.sessionStatus === 'FAILED') {
                setDefectDescription(res.defectType);
                setCurrentStep(4); // Nhảy thẳng đến màn hình kết quả thất bại
            } else {
                setCurrentStep(3); // Đúng linh kiện -> Chuyển sang bước con người vẽ lỗi
            }
        } catch (err: any) {
            setErrorMessage('Quá trình phân tích ảnh bị lỗi. Vui lòng thử lại!');
        } finally {
            setIsLoading(false);
        }
    };

    // Chốt kết quả kiểm định cuối cùng
    const handleFinalSubmit = async (status: 'PASSED' | 'FAILED') => {
        if (!sessionId) return;
        if (status === 'FAILED' && boxes.length === 0) {
            alert('Vui lòng khoanh vùng ít nhất 1 vị trí lỗi hoặc bấm Chốt đạt!');
            return;
        }

        setIsLoading(true);
        try {
            const finalDesc = status === 'PASSED' ? 'Sản phẩm đạt tiêu chuẩn chất lượng' : defectDescription || 'Phát hiện lỗi bề mặt';
            await inspectionApi.updateSessionStatus(sessionId, {
                status,
                defectType: finalDesc,
                boundingBoxes: status === 'PASSED' ? [] : boxes
            });
            setCurrentStep(4); // Hoàn thành quy trình
        } catch (err) {
            setErrorMessage('Không thể cập nhật kết quả kiểm định!');
        } finally {
            setIsLoading(false);
        }
    };

    // Hủy phiên làm lại từ đầu
    const handleReset = () => {
        setLotCode('');
        setSessionId(null);
        setImageUrl('');
        setBoxes([]);
        setDefectDescription('');
        setCurrentStep(1);
    };

    // Hàm hoàn tác: cắt bỏ phần tử cuối cùng trong mảng các ô lỗi
    const handleUndo = () => {
        if (boxes.length === 0) return;
        setBoxes((prevBoxes) => prevBoxes.slice(0, -1));
    };

    // --- LOGIC VẼ KHUNG LỖI (MOUSE EVENTS) ---
    const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current || currentStep !== 3) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setIsDrawing(true);
        setStartPos({ x, y });
        setActiveBox({ label: currentLabel, x, y, width: 0, height: 0 });
    };

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!isDrawing || !activeBox) return;
        const rect = containerRef.current!.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        setActiveBox({
            ...activeBox,
            x: Math.min(startPos.x, currentX),
            y: Math.min(startPos.y, currentY),
            width: Math.abs(startPos.x - currentX),
            height: Math.abs(startPos.y - currentY),
        });
    };

    const handleMouseUp = () => {
        if (isDrawing && activeBox) {
            // Nếu người dùng kéo chuột tạo ra khung đủ lớn -> Lưu khung lỗi
            if (activeBox.width > 5 && activeBox.height > 5) {
                setBoxes([...boxes, activeBox]);
            } else {
                // Nếu người dùng chỉ click (không kéo chuột, khung < 5px) -> Mở Modal phóng to ảnh
                setIsModalOpen(true);
            }
            setIsDrawing(false);
            setActiveBox(null);
        }
    };

    return (
        <div className="w-full max-w-4xl bg-white shadow-xl rounded-xl p-8 border">
            {/* Tiến trình thanh trạng thái (Steps Indicator) */}
            <div className="flex justify-between items-center mb-8 border-b pb-4">
                {[
                    { step: 1, label: 'Khởi tạo phiên' },
                    { step: 2, label: 'Quét AI linh kiện' },
                    { step: 3, label: 'Nhân viên vẽ lỗi' },
                    { step: 4, label: 'Hoàn tất' }
                ].map((s) => (
                    <div key={s.step} className="flex items-center gap-2">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${currentStep >= s.step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                            {s.step}
                        </span>
                        <span className={`text-sm font-medium ${currentStep === s.step ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>{s.label}</span>
                    </div>
                ))}
            </div>

            {errorMessage && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
                    {errorMessage}
                </div>
            )}

            {/* BƯỚC 1: KHỞI TẠO PHIÊN */}
            {currentStep === 1 && (
                <form onSubmit={handleCreateSession} className="space-y-6 max-w-md mx-auto py-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Mã số Lô hàng (Lot Code):</label>
                        <input
                            type="text"
                            required
                            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Ví dụ: LÔ-ẮC-QUY-2026"
                            value={lotCode}
                            onChange={(e) => setLotCode(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Chọn loại phụ tùng kiểm định:</label>
                        <select
                            className="w-full border rounded-lg p-2.5 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedPartId}
                            onChange={(e) => setSelectedPartId(Number(e.target.value))}
                        >
                            {parts.map(p => (
                                <option key={p.id} value={p.id}>{p.partName} ({p.partCode})</option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 transition"
                    >
                        {isLoading ? 'Đang tạo...' : 'Bắt đầu phiên kiểm định'}
                    </button>
                </form>
            )}

            {/* BƯỚC 2: TẢI ẢNH VÀ QUÉT AI */}
            {currentStep === 2 && (
                <div className="text-center py-10 space-y-4">
                    <div className="text-gray-600 font-medium">Phiên đã mở thành công (ID: {sessionId}). Vui lòng nạp ảnh chụp phụ tùng:</div>
                    <label className={`inline-block px-6 py-3 bg-purple-600 text-white font-bold rounded-lg cursor-pointer hover:bg-purple-700 transition ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                        {isLoading ? 'Hệ thống AI đang phân tích ảnh...' : 'Chọn ảnh hoặc Chụp hình'}
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                </div>
            )}

            {/* BƯỚC 3: CON NGƯỜI VẼ LỖI (HUMAN-IN-THE-LOOP) */}
            {currentStep === 3 && (
                <div className="space-y-6">
                    {/* Thanh công cụ điều khiển thông minh */}
                    <div className="flex flex-wrap gap-4 items-center justify-between bg-green-50 text-green-800 p-4 rounded-xl text-sm font-semibold border border-green-200 shadow-sm">
                        <span>✓ AI xác nhận: Đúng linh kiện. Tiến hành khoanh vùng lỗi.</span>

                        <div className="flex items-center gap-3">
                            {/* Chọn nhãn vẽ */}
                            <div className="flex bg-white rounded-lg p-1 border shadow-sm">
                                <button
                                    type="button" onClick={() => setCurrentLabel('scratch')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${currentLabel === 'scratch' ? 'bg-amber-500 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}>Vết Xước</button>
                                <button type="button" onClick={() => setCurrentLabel('crack')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${currentLabel === 'crack' ? 'bg-red-500 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}> Vết Nứt</button>
                            </div>

                            {/* Lớp điều khiển tác vụ (Hoàn tác / Xóa sạch) */}
                            <div className="flex gap-2 border-l pl-3 border-green-300">
                                <button
                                    type="button"
                                    onClick={handleUndo}
                                    disabled={boxes.length === 0}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1 transition-all border ${boxes.length === 0
                                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 active:scale-95'
                                        }`}
                                    title="Xóa khung vừa vẽ gần nhất"
                                >
                                    <span>↩</span> Hoàn tác
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setBoxes([])}
                                    disabled={boxes.length === 0}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1 transition-all border ${boxes.length === 0
                                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                        : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 active:scale-95'
                                        }`}
                                >
                                    <span>🗑️</span> Xóa hết
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* CỬA SỔ MODAL FULL MÀN HÌNH (Chỉ dùng để SOI) */}
                    {isModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-5 right-5 text-white bg-red-600 px-4 py-2 rounded-full font-bold hover:bg-red-700"
                            >
                                X
                            </button>
                            <img
                                src={imageUrl}
                                alt="Phóng to"
                                className="max-w-[95vw] max-h-[95vh] object-contain cursor-zoom-out"
                                onClick={() => setIsModalOpen(false)}
                            />
                        </div>
                        
                    )}

                    {/* ẢNH GỐC ĐỂ VẼ (Nhỏ hơn, thao tác vẽ tại đây) */}
                    <div className="relative border border-gray-300 rounded-xl bg-gray-100 w-full flex justify-center p-4">
                        <img
                            src={imageUrl}
                            alt="Click để phóng to"
                            className="max-h-[400px] cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setIsModalOpen(true)}
                            title="Click để phóng to ảnh"
                        />
                        {/* Vẫn giữ nguyên logic vẽ bounding box chồng lên trên ảnh nhỏ này... */}
                        <div
                            ref={containerRef}
                            className="absolute inset-0 z-10 cursor-crosshair"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                        >
                            {boxes.map((b, idx) => (
                                <div key={idx} className={`absolute border-2 ${b.label === 'scratch' ? 'border-amber-500 bg-amber-500/10' : 'border-red-500 bg-red-500/10'}`} style={{ left: b.x, top: b.y, width: b.width, height: b.height }}>
                                    <span className={`absolute -top-5 left-0 text-white text-[10px] px-1 rounded font-bold ${b.label === 'scratch' ? 'bg-amber-500' : 'bg-red-500'}`}>
                                        {b.label === 'scratch' ? 'Xước' : 'Nứt'}
                                    </span>
                                </div>
                            ))}
                            {isDrawing && activeBox && (
                                <div className={`absolute border-2 border-dashed ${currentLabel === 'scratch' ? 'border-amber-400 bg-amber-400/20' : 'border-red-400 bg-red-400/20'}`} style={{ left: activeBox.x, top: activeBox.y, width: activeBox.width, height: activeBox.height }} />
                            )}
                        </div>
                    </div>

                    {/* Nhập thông tin chi tiết báo cáo lỗi */}
                    {boxes.length > 0 && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Mô tả tổng quát khuyết tật (In phiếu kiểm định):</label>
                            <input
                                type="text"
                                className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Ví dụ: Phát hiện nứt chân van và xước sâu vỏ kim loại..."
                                value={defectDescription}
                                onChange={(e) => setDefectDescription(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Thanh chốt nút bấm điều hướng */}
                    <div className="flex justify-end gap-4 border-t pt-4">
                        <button onClick={() => handleFinalSubmit('PASSED')} disabled={boxes.length > 0} className={`px-5 py-2 rounded-lg font-bold text-sm text-white ${boxes.length > 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}>Chốt Đạt (PASSED)</button>
                        <button onClick={() => handleFinalSubmit('FAILED')} disabled={boxes.length === 0} className={`px-5 py-2 rounded-lg font-bold text-sm text-white ${boxes.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700'}`}>Chốt Lỗi (FAILED)</button>
                    </div>
                </div>
            )}

            {/* BƯỚC 4: HOÀN TẤT VÀ IN BÁO CÁO KẾT QUẢ */}
            {currentStep === 4 && (
                <div className="text-center py-8 space-y-6">
                    <div className="text-2xl font-extrabold text-blue-900">Quy Trình Kiểm Định Kết Thúc!</div>
                    <div className="p-4 bg-gray-50 rounded-lg max-w-md mx-auto text-left text-sm space-y-2 border">
                        <div><strong>Mã phiên:</strong> #{sessionId}</div>
                        <div><strong>Lô hàng:</strong> {lotCode}</div>
                        <div><strong>Kết luận:</strong> {boxes.length > 0 || defectDescription.includes('sai linh kiện') ? <span className="text-red-600 font-bold">KHÔNG ĐẠT TIÊU CHUẨN (FAILED)</span> : <span className="text-green-600 font-bold">ĐẠT TIÊU CHUẨN (PASSED)</span>}</div>
                        {defectDescription && <div><strong>Chi tiết lỗi:</strong> {defectDescription}</div>}
                        {boxes.length > 0 && <div><strong>Số điểm lỗi khoanh vùng:</strong> {boxes.length} vị trí</div>}
                    </div>
                    <button onClick={handleReset} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition">Thực hiện lượt kiểm định mới</button>
                </div>
            )}
        </div>
    );
};