import React, { useState, useEffect, useRef } from 'react';
import { qcApi, type QcSessionResponse, type BoundingBox } from '../api/qcApi';

export const InspectionPage: React.FC = () => {
    // --- State quản lý luồng ---
    const [pendingSessions, setPendingSessions] = useState<QcSessionResponse[]>([]);
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // --- State của phiên hiện tại ---
    const [activeSession, setActiveSession] = useState<QcSessionResponse | null>(null);
    const [imageUrl, setImageUrl] = useState('');
    const [currentImgIndex, setCurrentImgIndex] = useState(0);
    const [defectDescription, setDefectDescription] = useState('');

    // --- State Vẽ khung lỗi ---
    const [boxes, setBoxes] = useState<BoundingBox[]>([]);
    const [currentLabel, setCurrentLabel] = useState<'scratch' | 'crack'>('scratch');
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [activeBox, setActiveBox] = useState<BoundingBox | null>(null);



    const containerRef = useRef<HTMLDivElement>(null);

    // Load hàng chờ khi mở trang
    useEffect(() => {
        fetchPending();
    }, []);

    const fetchPending = () => {
        setIsLoading(true);
        qcApi.getPendingSessions()
            .then(setPendingSessions)
            .catch(() => setErrorMessage('Không thể tải danh sách hàng chờ!'))
            .finally(() => setIsLoading(false));
    };

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_roles');
        window.location.href = '/login';
    };

    const handleSelectSession = (session: QcSessionResponse) => {
        setActiveSession(session);
        setErrorMessage('');
        setBoxes([]);
        setDefectDescription('');
        setCurrentImgIndex(0); // 🔥 THÊM DÒNG NÀY: Reset chỉ mục ảnh về 0

        const hasAtLeastOneImage = session.scannedCount > 0;

        if (session.status === 'PENDING_EXPERT' && hasAtLeastOneImage) {
            setDefectDescription('Chờ thẩm định tổng quan từ Chuyên gia');

            // Lấy tấm ảnh đầu tiên lên trước
            if (session.imageUrls && session.imageUrls.length > 0) {
                setImageUrl(session.imageUrls[0]);
            } else {
                setImageUrl('');
            }

            setCurrentStep(3);
        } else {
            setImageUrl('');
            setCurrentStep(2);
        }
    };

    // 2. Tải ảnh từng tấm, gửi phân tích AI và tự động điều hướng luồng
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeSession) return;

        // Hiển thị ảnh xem trước tạm thời tại client ngay lập tức
        const localUrl = URL.createObjectURL(file);
        setImageUrl(localUrl);

        setIsLoading(true);
        setErrorMessage('');
        try {
            // 1. Bắn dữ liệu lên server phân tích ảnh
            const successMessage = await qcApi.analyzeImage(activeSession.id, file);
            alert(successMessage);

            // 2. Đồng bộ lại danh sách mới nhất từ server sau khi up ảnh
            const updatedList = await qcApi.getPendingSessions();
            setPendingSessions(updatedList);

            // Tìm thông tin đơn hiện tại trong danh sách mới cập nhật
            const currentUpdatedSession = updatedList.find(s => s.id === activeSession.id);

            // 🔥 KIỂM TRA ĐIỀU KIỆN LUỒNG TỰ ĐỘNG:
            if (!currentUpdatedSession || ['PASSED', 'FAILED'].includes(currentUpdatedSession.status)) {
                // Nếu thuộc luồng BASIC_AI và hệ thống đã tự động chốt kết quả xong
                const finalStatus = currentUpdatedSession ? currentUpdatedSession.status : 'ĐÃ HOÀN THÀNH';
                setDefectDescription(`Hệ thống tự động chốt kết quả cấu kiện thành công! Trạng thái: ${finalStatus}`);

                // Đẩy THẲNG sang bước 4 hoàn tất hồ sơ, không qua duyệt tay chuyên gia
                setCurrentStep(4);
            } else {
                // Nếu đơn vẫn đang đợi xử lý tiếp (Chưa đủ ảnh hoặc thuộc gói PREMIUM)
                setActiveSession(currentUpdatedSession);

                if (currentUpdatedSession.status === 'PENDING_EXPERT') {
                    // Đúng quy trình PREMIUM: Đủ ảnh -> Cập nhật URL ảnh thật từ server (nếu có) và qua Bước 3
                    if ((currentUpdatedSession as any).imageUrl) {
                        setImageUrl((currentUpdatedSession as any).imageUrl);
                    }
                    setDefectDescription('Đã quét đủ số lượng. Chờ thẩm định tổng quan từ Chuyên gia');
                    setCurrentStep(3);
                } else {
                    // Chưa đủ ảnh: Giữ nguyên bước 2 để tiếp tục nạp ảnh tiếp theo
                    setCurrentStep(2);
                }
            }
        } catch (err: any) {
            const serverError = err.response?.data || 'Lỗi hệ thống khi phân tích ảnh AI!';
            setErrorMessage(typeof serverError === 'string' ? serverError : 'Lỗi hệ thống khi xử lý ảnh!');
        } finally {
            setIsLoading(false);
            if (e.target) e.target.value = '';
        }
    };

    // 3. Chốt kết quả thủ công tổng quan đơn hàng
    const handleFinalSubmit = async (status: 'PASSED' | 'FAILED') => {
        if (!activeSession) return;

        setIsLoading(true);
        try {
            const note = defectDescription.trim() || (status === 'PASSED' ? 'Đạt chuẩn xuất xưởng' : 'Phát hiện khuyết tật bề mặt');

            await qcApi.manualInspect(activeSession.id, {
                status,
                overallNote: note
            });

            setDefectDescription(`Chuyên gia đã kết luận: ${status === 'PASSED' ? 'ĐẠT CHUẨN' : 'BỊ LỖI'} (${note})`);
            setCurrentStep(4);
        } catch (err: any) {
            setErrorMessage(err.response?.data || 'Lỗi khi chốt kết quả kiểm định thủ công!');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setActiveSession(null);
        setImageUrl('');
        setBoxes([]);
        setDefectDescription('');
        setCurrentStep(1);
        fetchPending();
    };

    const handleUndo = () => {
        if (boxes.length > 0) setBoxes((prev) => prev.slice(0, -1));
    };

    const getQueueBadge = (status: string) => {
        if (status === 'PENDING_EXPERT') {
            return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/10">Chuyên Gia Xét Duyệt</span>;
        }
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/10">Đang Quét AI</span>;
    };

    // --- CÁC HÀM XỬ LÝ VẼ KHUNG LỖI (BƯỚC 3) ---
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setStartPos({ x, y });
        setIsDrawing(true);
        setActiveBox({ label: currentLabel, x, y, width: 0, height: 0 });
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDrawing || !activeBox || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const currentX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const currentY = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

        setActiveBox({
            ...activeBox,
            x: Math.min(startPos.x, currentX),
            y: Math.min(startPos.y, currentY),
            width: Math.abs(currentX - startPos.x),
            height: Math.abs(currentY - startPos.y),
        });
    };

    const handleMouseUp = () => {
        if (activeBox && activeBox.width > 5 && activeBox.height > 5) {
            setBoxes([...boxes, activeBox]);
        }
        setIsDrawing(false);
        setActiveBox(null);
    };

    return (
        <div className="min-h-screen bg-slate-50/50 py-10 antialiased font-sans">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">

                {/* --- TOP BAR HEADER --- */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Không Gian Làm Việc QC</h1>
                        </div>
                        <p className="text-slate-500 text-xs mt-0.5">Hệ thống trạm phân tích khuyết tật và chẩn đoán linh kiện thông minh</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 hover:text-red-600 transition-colors duration-200"
                    >
                        Đăng xuất hệ thống
                    </button>
                </div>

                {/* --- STEPS COMPONENT --- */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
                        {[
                            { step: 1, label: 'Hàng chờ nhận ca' },
                            { step: 2, label: 'Tải ảnh & Quét AI' },
                            { step: 3, label: 'Chuyên gia phê duyệt' },
                            { step: 4, label: 'Hoàn tất hồ sơ' }
                        ].map((s) => (
                            <div key={s.step} className="flex flex-col gap-2 relative">
                                <div className="flex items-center gap-2.5">
                                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-xs font-bold transition-all duration-300 ${currentStep >= s.step ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100' : 'bg-slate-100 text-slate-400'}`}>
                                        {s.step}
                                    </span>
                                    <span className={`text-xs font-semibold tracking-wide transition-colors duration-200 ${currentStep === s.step ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
                                        {s.label}
                                    </span>
                                </div>
                                <div className={`h-1 w-full rounded-full transition-all duration-500 mt-1 ${currentStep >= s.step ? 'bg-indigo-600' : 'bg-slate-100'}`} />
                            </div>
                        ))}
                    </div>
                </div>

                {errorMessage && (
                    <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-xs font-semibold shadow-sm flex items-center gap-2">
                        <span>⚠️ {errorMessage}</span>
                    </div>
                )}

                {/* --- WORKSPACE CORE --- */}
                <div className="transition-all duration-300">

                    {/* BƯỚC 1: HÀNG CHỜ LINH KIỆN */}
                    {currentStep === 1 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h2 className="text-sm font-bold text-slate-900">Danh sách chờ kiểm định</h2>
                                    <p className="text-xs text-slate-400 mt-0.5">Các lô hàng đã thanh toán, sẵn sàng đưa vào luồng phân tích</p>
                                </div>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                    Đang đợi: {pendingSessions.length} đơn
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                                            <th className="p-4">Mã Đơn / Lô</th>
                                            <th className="p-4">Tên cấu kiện / Quy cách</th>
                                            <th className="p-4">Tiến độ nạp ảnh</th>
                                            <th className="p-4">Phân luồng hiện tại</th>
                                            <th className="p-4 text-right">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs">
                                        {pendingSessions.filter(session => session.paymentStatus === 'PAID' && ['PENDING', 'PENDING_EXPERT'].includes(session.status)).length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="p-12 text-center text-slate-400 bg-white font-medium">
                                                    <div className="max-w-xs mx-auto space-y-2">
                                                        <p className="text-sm font-semibold text-slate-700">Trống danh sách hàng đợi</p>
                                                        <p className="text-xs text-slate-400">Hiện tại không có đơn hàng nào cần tiếp nhận xử lý bổ sung. Xin vui lòng nghỉ ngơi! ☕</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            pendingSessions
                                                .filter(session => session.paymentStatus === 'PAID' && ['PENDING', 'PENDING_EXPERT'].includes(session.status))
                                                .map(session => (
                                                    <tr key={session.id} className="hover:bg-slate-50/80 transition-colors duration-150">
                                                        <td className="p-4 font-bold text-slate-800">
                                                            <span className="text-slate-400 font-mono font-medium">#{session.id}</span> — {session.lotCode}
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="font-semibold text-slate-700">{session.partName}</div>
                                                            <div className="text-[10px] text-slate-400 mt-0.5">Số lượng: {session.quantity} mẫu</div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono font-bold text-indigo-600 bg-indigo-50/50 px-2 py-0.5 rounded border border-indigo-100/50">
                                                                    {session.scannedCount} / {session.quantity}
                                                                </span>
                                                                <span className="text-slate-400 text-[10px]">ảnh</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex flex-col gap-1.5 items-start">
                                                                {getQueueBadge(session.status)}
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">💰 PAID</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <button
                                                                onClick={() => handleSelectSession(session)}
                                                                className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-sm shadow-indigo-100 transition duration-150"
                                                            >
                                                                Tiếp nhận ca
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* BƯỚC 2: TẢI ẢNH TỪNG TẤM */}
                    {currentStep === 2 && (
                        <div className="bg-white p-8 rounded-2xl shadow-sm text-center border border-slate-100 max-w-lg mx-auto space-y-6">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">Bước 2: Tải ảnh linh kiện & Trích xuất AI</h3>
                                <p className="text-xs text-slate-400 mt-1">Vui lòng nạp hình ảnh sắc nét của cấu kiện cơ khí để chạy quét khuyết tật bằng AI</p>
                            </div>

                            <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition flex flex-col items-center justify-center gap-3">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload} // ◄ Đã bind chuẩn hàm tải ảnh kèm quét AI tự động chuyển bước
                                    className="text-xs font-medium text-slate-600 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
                                    disabled={isLoading}
                                />
                            </div>

                            {imageUrl && (
                                <div className="space-y-2">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-left">Ảnh vừa nạp thành công:</span>
                                    <img src={imageUrl} alt="Preview" className="max-h-48 object-contain rounded-xl mx-auto border border-slate-100 shadow-sm" />
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button onClick={handleReset} className="px-4 py-2 rounded-xl font-bold text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 transition">
                                    Quay lại trạm chờ
                                </button>
                                <button
                                    disabled={!imageUrl || isLoading}
                                    onClick={() => setCurrentStep(3)}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold disabled:opacity-50 hover:bg-indigo-700 transition"
                                >
                                    Tiến sang Chuyên Gia Phê Duyệt ➔
                                </button>
                            </div>
                        </div>
                    )}

                    {/* BƯỚC 3: PHÊ DUYỆT TỪ CHUYÊN GIA */}
                    {currentStep === 3 && activeSession && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden max-w-4xl mx-auto">
                            {/* ... giữ nguyên phần header của bước 3 ... */}

                            <div className="p-6 space-y-6">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Đánh dấu vùng khuyết tật trên linh kiện</label>
                                        {/* ... giữ nguyên thanh chọn loại lỗi scratch / crack ... */}
                                    </div>

                                    {/* 🔥 THÊM ĐOẠN NÀY: THANH CHUYỂN ĐỔI QUA LẠI GIỮA CÁC ẢNH */}
                                    {activeSession.imageUrls && activeSession.imageUrls.length > 1 && (
                                        <div className="flex items-center justify-between bg-slate-100 p-2 rounded-xl border border-slate-200/60">
                                            <button
                                                type="button"
                                                disabled={currentImgIndex === 0}
                                                onClick={() => {
                                                    const newIdx = currentImgIndex - 1;
                                                    setCurrentImgIndex(newIdx);
                                                    setImageUrl(activeSession.imageUrls![newIdx]);
                                                    setBoxes([]); // Clear vết vẽ cũ khi chuyển ảnh
                                                }}
                                                className="px-3 py-1.5 text-xs font-bold bg-white text-slate-700 rounded-lg shadow-sm disabled:opacity-40 hover:bg-slate-50 transition"
                                            >
                                                ◀ Ảnh trước
                                            </button>

                                            <span className="text-xs font-bold text-indigo-600 font-mono bg-indigo-50 px-3 py-1 rounded-md border border-indigo-100">
                                                Hiển thị: Ảnh {currentImgIndex + 1} / {activeSession.imageUrls.length}
                                            </span>

                                            <button
                                                type="button"
                                                disabled={currentImgIndex === activeSession.imageUrls.length - 1}
                                                onClick={() => {
                                                    const newIdx = currentImgIndex + 1;
                                                    setCurrentImgIndex(newIdx);
                                                    setImageUrl(activeSession.imageUrls![newIdx]);
                                                    setBoxes([]); // Clear vết vẽ cũ khi chuyển ảnh
                                                }}
                                                className="px-3 py-1.5 text-xs font-bold bg-white text-slate-700 rounded-lg shadow-sm disabled:opacity-40 hover:bg-slate-50 transition"
                                            >
                                                Ảnh sau ▶
                                            </button>
                                        </div>
                                    )}

                                    {/* Màn hình Canvas chứa ảnh nền để vẽ (Giữ nguyên) */}
                                    <div
                                        ref={containerRef}
                                        className="relative w-full h-[450px] bg-slate-900 rounded-xl overflow-hidden cursor-crosshair border-2 border-slate-200 shadow-inner"
                                        onMouseDown={handleMouseDown}
                                        onMouseMove={handleMouseMove}
                                        onMouseUp={handleMouseUp}
                                        onMouseLeave={handleMouseUp}
                                        style={{
                                            backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
                                            backgroundSize: 'contain',
                                            backgroundRepeat: 'no-repeat',
                                            backgroundPosition: 'center'
                                        }}
                                    >
                                        {!imageUrl && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-xs font-medium gap-2">
                                                <span>⚠️ Chưa load được hình ảnh linh kiện từ phiên làm việc này</span>
                                                <span className="text-[10px] text-slate-500">(Hãy chắc chắn rằng ca đã được nạp hình ảnh trước đó hoặc từ Bước 2)</span>
                                            </div>
                                        )}

                                        {/* Hiển thị các hộp đã vẽ */}
                                        {boxes.map((box, idx) => (
                                            <div
                                                key={idx}
                                                className={`absolute border-2 ${box.label === 'scratch' ? 'border-indigo-500 bg-indigo-500/20' : 'border-rose-500 bg-rose-500/20'}`}
                                                style={{ left: box.x, top: box.y, width: box.width, height: box.height }}
                                            >
                                                <span className={`absolute -top-5 left-0 px-1.5 py-0.5 text-[10px] text-white font-bold rounded-t-md ${box.label === 'scratch' ? 'bg-indigo-500' : 'bg-rose-500'}`}>
                                                    {box.label === 'scratch' ? 'Xước' : 'Nứt'}
                                                </span>
                                            </div>
                                        ))}

                                        {/* Hộp nét đứt đang trong quá trình kéo chuột */}
                                        {activeBox && (
                                            <div
                                                className={`absolute border-2 border-dashed ${activeBox.label === 'scratch' ? 'border-indigo-400 bg-indigo-400/30' : 'border-rose-400 bg-rose-400/30'}`}
                                                style={{ left: activeBox.x, top: activeBox.y, width: activeBox.width, height: activeBox.height }}
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Nhận xét & Kết luận kỹ thuật tổng hợp</label>
                                    <textarea
                                        className="w-full border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 font-medium text-slate-700 transition"
                                        rows={3}
                                        placeholder="Nhập ghi chú vận hành tổng quan cho lô phụ tùng này..."
                                        value={defectDescription}
                                        onChange={(e) => setDefectDescription(e.target.value)}
                                    />
                                </div>

                                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-100">
                                    <button onClick={handleReset} className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 transition">
                                        Hủy ca làm việc
                                    </button>
                                    <button onClick={() => handleFinalSubmit('PASSED')} disabled={isLoading} className="px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-sm shadow-emerald-100 bg-emerald-600 hover:bg-emerald-700 transition">
                                        ✅ Ký duyệt ĐẠT (PASSED)
                                    </button>
                                    <button onClick={() => handleFinalSubmit('FAILED')} disabled={isLoading} className="px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-sm shadow-rose-100 bg-rose-600 hover:bg-rose-700 transition">
                                        🚨 Ký huỷ LÔ LỖI (FAILED)
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* BƯỚC 4: HOÀN TẤT HỒ SƠ CHỐT KẾT QUẢ */}
                    {currentStep === 4 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 max-w-md mx-auto text-center space-y-6">
                            <div className="space-y-2">
                                <div className="mx-auto h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl">
                                    ✓
                                </div>
                                <h3 className="text-base font-bold text-slate-900">Hồ sơ đã ký chốt thành công!</h3>
                                <p className="text-xs text-slate-400">Dữ liệu kiểm định của lô linh kiện đã được đóng băng gửi về máy chủ</p>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-xl text-left text-xs space-y-2.5 border border-slate-100 font-medium">
                                <div className="flex justify-between border-b border-slate-200/60 pb-1.5"><span className="text-slate-400">Mã vận đơn lô:</span> <span className="font-bold text-slate-800">{activeSession?.lotCode}</span></div>
                                <div className="flex justify-between border-b border-slate-200/60 pb-1.5"><span className="text-slate-400">Cấu kiện cơ khí:</span> <span className="font-bold text-slate-800">{activeSession?.partName}</span></div>
                                <div className="space-y-1">
                                    <span className="text-slate-400 block">Biên bản chốt vận hành:</span>
                                    <div className="p-2 bg-white rounded border border-slate-100 font-semibold text-indigo-700 leading-relaxed text-[11px]">
                                        {defectDescription}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleReset}
                                className="w-full py-3 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-100 transition duration-150"
                            >
                                Tiếp tục tiếp nhận đơn tiếp theo
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};