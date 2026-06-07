import React, { useState, useEffect, Component } from 'react';
import { inspectionService } from '../api/inspectionService';
import { partService } from '../api/partService';

// ==========================================
// 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU
// ==========================================
interface Part {
    id: number;
    partName: string;
    partCode?: string;
}

interface InspectionSession {
    id: number;
    lotCode: string;
    partId: number;
    partName: string;
    status: 'PENDING' | 'PROCESSING' | 'PASSED' | 'FAILED' | 'CANCELLED';
    createdAt: string;
}

interface AIResult {
    defectType: string;
    boundingBoxes: any[];
}

// ==========================================
// 2. ERROR BOUNDARY
// ==========================================
class PosErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; errorMsg: string }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, errorMsg: '' };
    }

    static getDerivedStateFromError(error: any) {
        return { hasError: true, errorMsg: error.toString() };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 m-4 bg-red-900 border-2 border-red-500 rounded text-white">
                    <h2 className="text-xl font-bold mb-2">⚠ Giao diện gặp sự cố dữ liệu!</h2>
                    <p className="font-mono text-sm text-red-200">{this.state.errorMsg}</p>
                    <p className="mt-4 text-sm">
                        Vui lòng ấn F12, mở tab Console chụp ảnh gửi lại để trị dứt điểm lỗi này.
                    </p>
                </div>
            );
        }
        return this.props.children;
    }
}

// ==========================================
// 3. COMPONENT CHÍNH
// ==========================================
function InspectionPOSContent() {
    // --- STATE ---
    const [parts, setParts] = useState<Part[]>([]);
    const [selectedPartId, setSelectedPartId] = useState<number | string>('');
    const [lotCode, setLotCode] = useState<string>('');
    const [currentSession, setCurrentSession] = useState<InspectionSession | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [aiResult, setAiResult] = useState<AIResult | null>(null);

    // --- EFFECT: TẢI DANH MỤC PHỤ TÙNG ---
    useEffect(() => {
        const fetchParts = async () => {
            try {
                const response: any = await partService.getAllParts();
                let actualParts: Part[] = [];

                if (response?.data && Array.isArray(response.data)) {
                    actualParts = response.data;
                } else if (Array.isArray(response)) {
                    actualParts = response;
                } else if (response?.data?.content && Array.isArray(response.data.content)) {
                    actualParts = response.data.content;
                }

                setParts(actualParts);
            } catch (err) {
                console.error("Lỗi tải phụ tùng:", err);
                setParts([]);
            }
        };

        fetchParts();
    }, []);

    // --- HANDLERS ---
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setAiResult(null);
        }
    };

    const handleCreateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPartId || !lotCode.trim()) {
            alert("Vui lòng chọn loại phụ tùng và nhập mã lô hàng!");
            return;
        }

        setLoading(true);
        try {
            const response: any = await inspectionService.createSession({
                partId: Number(selectedPartId),
                lotCode: lotCode.trim(),
            });
            setCurrentSession(response?.data || response);
        } catch (err) {
            alert("Khởi tạo lượt kiểm thất bại.");
        } finally {
            setLoading(false);
        }
    };

    const handleUploadImage = async () => {
        if (!currentSession || !selectedFile) {
            alert("Vui lòng tạo lượt kiểm và chọn ảnh trước!");
            return;
        }

        setLoading(true);
        try {
            await inspectionService.updateStatus(currentSession.id, 'PROCESSING');
            setCurrentSession(prev => prev ? { ...prev, status: 'PROCESSING' } : null);

            await inspectionService.addDetailImage(currentSession.id, selectedFile);

            const response: any = await inspectionService.getSession(currentSession.id);
            const finalData = response?.data || response;

            setCurrentSession(finalData);

            // Xử lý bounding boxes an toàn
            let safeBoxes: any[] = [];
            if (finalData?.boundingBoxes) {
                if (Array.isArray(finalData.boundingBoxes)) {
                    safeBoxes = finalData.boundingBoxes;
                } else if (typeof finalData.boundingBoxes === 'string') {
                    try {
                        safeBoxes = JSON.parse(finalData.boundingBoxes);
                    } catch (e) {
                        console.error("Không parse được boundingBoxes");
                    }
                }
            }

            setAiResult({
                defectType: finalData?.defectType || 'Lỗi bề mặt',
                boundingBoxes: safeBoxes,
            });
        } catch (err) {
            alert("Lỗi phân tích ảnh.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelSession = async () => {
        if (!currentSession) return;

        if (window.confirm("Bạn có chắc chắn muốn hủy lượt kiểm định này không?")) {
            setLoading(true);
            try {
                const response = await fetch(
                    `http://localhost:8080/api/inspections/sessions/${currentSession.id}/cancel`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
                        },
                    }
                );

                if (response.ok) {
                    setCurrentSession(prev => prev ? { ...prev, status: 'CANCELLED' } : null);
                    alert("Đã hủy lượt kiểm định.");
                    setSelectedFile(null);
                    setPreviewUrl('');
                    setAiResult(null);
                }
            } catch (err) {
                alert("Lỗi khi hủy.");
            } finally {
                setLoading(false);
            }
        }
    };

    // Render options an toàn
    const renderPartOptions = Array.isArray(parts)
        ? parts.map((p, idx) => (
              <option key={p?.id || `fallback-${idx}`} value={p?.id || ''}>
                  {p?.partName || 'Lỗi tên'} {p?.partCode ? `(${p.partCode})` : ''}
              </option>
          ))
        : null;

    // Render bounding boxes
    const renderErrorBoxes =
        currentSession?.status === 'FAILED' &&
        aiResult &&
        Array.isArray(aiResult.boundingBoxes)
            ? aiResult.boundingBoxes.map((box, index) => (
                  <div
                      key={`box-${index}`}
                      className="absolute border-2 border-red-500 bg-red-500/20 animate-pulse flex items-start justify-end"
                      style={{
                          top: box?.top || '0%',
                          left: box?.left || '0%',
                          width: box?.width || '0%',
                          height: box?.height || '0%',
                      }}
                  >
                      <span className="absolute -top-6 left-0 bg-red-500 text-white text-xs font-bold px-2 py-1 whitespace-nowrap shadow-lg">
                          {aiResult?.defectType || 'Lỗi'}
                      </span>
                  </div>
              ))
            : null;

    return (
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Phần hiển thị ảnh */}
            <div className="lg:col-span-2 flex flex-col gap-4">
                <div className="bg-slate-950 rounded-xl border border-slate-800 relative p-4 flex flex-col items-center justify-center min-h-[450px] overflow-hidden">
                    {previewUrl ? (
                        <div className="relative inline-block max-h-full max-w-full">
                            <img
                                src={previewUrl}
                                alt="Phụ tùng"
                                className="max-h-[400px] rounded border border-slate-700 object-contain"
                            />

                            {/* Bounding boxes */}
                            {renderErrorBoxes}

                            {/* Loading effect */}
                            {currentSession?.status === 'PROCESSING' && (
                                <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center">
                                    <div className="w-full h-full relative">
                                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-blue-400 shadow-[0_0_15px_3px_rgba(59,130,246,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
                                        <div className="absolute inset-0 bg-blue-500/10 animate-pulse"></div>
                                    </div>
                                </div>
                            )}

                            {/* Status badges */}
                            {currentSession?.status === 'PASSED' && (
                                <div className="absolute top-4 left-4 bg-emerald-500 text-white font-bold px-4 py-2 rounded shadow z-20">
                                    ✓ ĐẠT CHẤT LƯỢNG
                                </div>
                            )}
                            {currentSession?.status === 'FAILED' && (
                                <div className="absolute top-4 left-4 bg-red-500 text-white font-bold px-4 py-2 rounded shadow z-20">
                                    ⚠ PHÁT HIỆN LỖI
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-slate-400">
                            Trạm kiểm định đang chờ nhận ảnh bề mặt
                        </div>
                    )}

                    {/* Chọn file */}
                    {currentSession && currentSession.status === 'PENDING' && (
                        <div className="mt-4">
                            <input
                                type="file"
                                accept="image/*"
                                id="part-image"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            <label
                                htmlFor="part-image"
                                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm cursor-pointer transition"
                            >
                                {selectedFile ? "Thay đổi ảnh khác" : "Chọn ảnh từ thiết bị/bảng kiểm"}
                            </label>
                        </div>
                    )}
                </div>
            </div>

            {/* Bảng điều khiển */}
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-6 flex flex-col justify-between">
                <div>
                    <h2 className="text-lg font-semibold border-b border-slate-800 pb-2 mb-4 text-blue-400">
                        ĐIỀU KHIỂN TÁC VỤ
                    </h2>

                    {!currentSession ? (
                        <form onSubmit={handleCreateSession} className="space-y-4">
                            <div>
                                <label className="block text-xs uppercase font-bold text-slate-500 mb-1">
                                    Chọn Phụ Tùng
                                </label>
                                <select
                                    className="bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm w-full text-slate-100"
                                    value={selectedPartId}
                                    onChange={(e) => setSelectedPartId(e.target.value)}
                                >
                                    <option value="">-- Chọn phụ tùng --</option>
                                    {renderPartOptions}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs uppercase font-bold text-slate-500 mb-1">
                                    Mã Lô Hàng
                                </label>
                                <input
                                    type="text"
                                    className="bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm w-full text-slate-100"
                                    value={lotCode}
                                    onChange={(e) => setLotCode(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-500 font-bold py-2 rounded text-sm transition"
                            >
                                Bắt Đầu Lượt Kiểm
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-medium text-slate-300">
                                    ID Lượt: <span className="text-blue-400">#{currentSession.id}</span>
                                </h3>
                                <span className="text-xs px-2 py-0.5 rounded font-bold bg-slate-800 text-slate-100">
                                    {currentSession.status}
                                </span>
                            </div>

                            <div className="bg-slate-900 p-4 rounded border border-slate-800 text-xs space-y-2 text-slate-300">
                                <p>
                                    <span className="text-slate-500">Loại sản phẩm:</span> {currentSession.partName}
                                </p>
                                <p>
                                    <span className="text-slate-500">Mã Lô:</span> {currentSession.lotCode}
                                </p>
                            </div>

                            {currentSession.status === 'PENDING' && (
                                <button
                                    onClick={handleUploadImage}
                                    disabled={!selectedFile || loading}
                                    className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 font-bold py-3 rounded text-sm transition"
                                >
                                    {loading ? "ĐANG XỬ LÝ..." : "✓ GỬI ẢNH LÊN SERVER"}
                                </button>
                            )}

                            {(currentSession.status !== 'PENDING' && currentSession.status !== 'PROCESSING') && (
                                <button
                                    onClick={() => {
                                        setCurrentSession(null);
                                        setSelectedFile(null);
                                        setPreviewUrl('');
                                        setLotCode('');
                                        setAiResult(null);
                                    }}
                                    className="w-full mt-2 bg-slate-800 hover:bg-slate-700 font-bold py-2 rounded text-sm transition"
                                >
                                    + Tiếp Tục Lượt Mới
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Nút hủy */}
                {currentSession &&
                    (currentSession.status === 'PENDING' || currentSession.status === 'PROCESSING') && (
                        <div className="pt-4 border-t border-slate-800">
                            <button
                                onClick={handleCancelSession}
                                disabled={loading}
                                className="w-full text-xs text-red-400 hover:text-red-300 cursor-pointer"
                            >
                                Hủy bỏ lượt kiểm
                            </button>
                        </div>
                    )}
            </div>
        </div>
    );
}

// ==========================================
// 4. XUẤT COMPONENT
// ==========================================
export default function InspectionPOS() {
    return (
        <PosErrorBoundary>
            <InspectionPOSContent />
        </PosErrorBoundary>
    );
}