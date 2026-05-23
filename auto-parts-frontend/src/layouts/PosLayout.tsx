import React, { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle, XCircle, Loader2, ScanLine, Cpu, Layers, Trash2 } from 'lucide-react';
import { inspectionService, partService } from '../api/inspectionService'; // Nhớ import thêm partService

const InspectionPOS = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [lotCode, setLotCode] = useState<string>('');
  
  // State mới cho Parts
  const [parts, setParts] = useState<any[]>([]); 
  const [partId, setPartId] = useState<number | ''>(''); 
  const [isLoadingParts, setIsLoadingParts] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Chạy khi Component Mount: Tạo mã lô và Tải danh sách phụ tùng
  useEffect(() => {
    generateNewLotCode();
    fetchParts();
  }, []);

  const generateNewLotCode = () => {
    setLotCode('LOT-' + new Date().getTime().toString().slice(-6));
  };

  const fetchParts = async () => {
    setIsLoadingParts(true);
    try {
      const data: any = await partService.getAllParts();
      setParts(data);
      
      // Mặc định chọn part đầu tiên nếu danh sách không rỗng
      if (data && data.length > 0) {
        setPartId(data[0].id);
      }
    } catch (error) {
      console.error("Lỗi khi load danh sách phụ tùng:", error);
      alert("Không thể tải danh sách phụ tùng. Vui lòng thử lại!");
    } finally {
      setIsLoadingParts(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setResult(null); 
    }
  };

  const clearSelection = () => {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
  };

  const handleInspect = async () => {
    if (!file || !partId) return;
    setIsLoading(true);
    setResult(null);

    try {
      // 1. Tạo Session mới
      const sessionResponse: any = await inspectionService.createSession({ lotCode, partId: Number(partId) });
      const sessionId = sessionResponse.id; // Điều chỉnh theo cấu trúc thực tế nếu cần

      if (!sessionId) {
        throw new Error("Không lấy được Session ID từ server");
      }

      // 2. Gửi ảnh lên API
      await inspectionService.addDetailImage(sessionId, file);

      // 3. Lấy kết quả
      const resultResponse: any = await inspectionService.getSession(sessionId);
      
      // 4. Cập nhật UI
      setResult(resultResponse);

      // 5. Tạo mã lô mới
      generateNewLotCode();
    } catch (error) {
      alert("Có lỗi xảy ra trong quá trình kiểm định. Vui lòng kiểm tra lại kết nối.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* CỘT TRÁI: BẢNG ĐIỀU KHIỂN */}
      <div className="lg:col-span-5 bg-white p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-32 h-32 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-3xl -z-10"></div>
        
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Cấu hình quét AI</h2>
            <p className="text-sm text-slate-500 font-medium mt-0.5">Thiết lập thông số đầu vào</p>
          </div>
        </div>
        
        <div className="space-y-5 mb-8">
          {/* Lô kiểm định */}
          <div className="group">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
              <Layers className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              Mã Lô (Lot Code)
            </label>
            <input 
              type="text" 
              value={lotCode}
              onChange={(e) => setLotCode(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all outline-none font-medium text-slate-700"
            />
          </div>
          
          {/* Loại phụ tùng (Load động từ API) */}
          <div className="group">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
              <ScanLine className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              Mẫu phụ tùng (Target Class)
            </label>
            <div className="relative">
              <select 
                value={partId}
                onChange={(e) => setPartId(Number(e.target.value))}
                disabled={isLoadingParts}
                className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all outline-none font-medium text-slate-700 appearance-none ${isLoadingParts ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoadingParts ? (
                  <option value="">Đang tải danh sách phụ tùng...</option>
                ) : parts.length === 0 ? (
                  <option value="">Không có dữ liệu phụ tùng</option>
                ) : (
                  parts.map((part) => (
                    <option key={part.id} value={part.id}>
                      {/* LƯU Ý: Đổi `part.name` thành tên thuộc tính thực tế trong Java model của bạn (vd: part.partName, part.title...) */}
                      [ID: {part.id}] {part.name || part.partName || 'Phụ tùng chưa có tên'}
                    </option>
                  ))
                )}
              </select>
              {isLoadingParts && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Khung upload ảnh */}
        <div className="relative group">
          <div className={`absolute -inset-0.5 rounded-2xl blur opacity-0 transition duration-500 group-hover:opacity-100 ${file ? 'bg-blue-400' : 'bg-slate-300'}`}></div>
          <div className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl transition-all duration-300 bg-white
            ${file ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 hover:border-blue-400'}`}>
            
            <input 
              type="file" 
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              title=""
            />
            
            {file ? (
              <div className="text-center z-0">
                <CheckCircle className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                <p className="text-blue-700 font-bold text-lg">Đã nạp ảnh thành công</p>
                <p className="text-blue-500/80 text-sm mt-1 font-medium">{file.name}</p>
              </div>
            ) : (
              <div className="text-center z-0">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <p className="text-slate-600 font-bold">Nhấn hoặc kéo thả ảnh vào đây</p>
                <p className="text-slate-400 text-sm mt-1 font-medium">Hỗ trợ JPG, PNG (Max 5MB)</p>
              </div>
            )}
          </div>
        </div>

        {/* Nút Thực thi */}
        <button
          onClick={handleInspect}
          disabled={!file || isLoading || isLoadingParts || !partId}
          className={`w-full mt-8 py-4 px-4 rounded-xl font-bold text-white shadow-lg transition-all duration-300 flex items-center justify-center gap-3 text-lg relative overflow-hidden
            ${(!file || isLoadingParts || !partId)
              ? 'bg-slate-300 shadow-none cursor-not-allowed text-slate-500' 
              : isLoading 
                ? 'bg-indigo-500 shadow-indigo-500/30 cursor-wait' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/40 hover:-translate-y-1'
            }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>AI ĐANG PHÂN TÍCH...</span>
              <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 animate-[shimmer_1.5s_infinite]"></div>
            </>
          ) : (
            <>
              <ScanLine className="w-6 h-6" />
              <span>BẮT ĐẦU KIỂM ĐỊNH</span>
            </>
          )}
        </button>
      </div>

      {/* CỘT PHẢI: MÀN HÌNH QUÉT */}
      <div className="lg:col-span-7 bg-slate-900 p-2 rounded-3xl shadow-2xl relative min-h-[500px] lg:min-h-[650px] flex flex-col ring-1 ring-slate-800">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            <span className="text-slate-400 text-sm font-medium tracking-wider ml-2">VISION SYSTEM TND-V1</span>
          </div>
          
          {file && !isLoading && !result && (
            <button onClick={clearSelection} className="text-slate-400 hover:text-red-400 flex items-center gap-2 text-sm font-medium transition-colors">
              <Trash2 className="w-4 h-4" /> Hủy ảnh
            </button>
          )}
        </div>

        <div className="flex-1 relative flex items-center justify-center p-6 overflow-hidden">
          {previewUrl ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-500/50 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-500/50 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-500/50 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-500/50 rounded-br-lg"></div>
              
              <img 
                src={previewUrl} 
                alt="Part Preview" 
                className={`max-h-full max-w-full object-contain drop-shadow-2xl transition-all duration-700 ${isLoading ? 'scale-105 opacity-80 blur-[2px]' : 'scale-100 opacity-100'}`} 
              />
              
              {isLoading && (
                <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center">
                  <div className="w-full h-full relative">
                     <div className="absolute top-1/2 left-0 w-full h-0.5 bg-blue-400 shadow-[0_0_15px_3px_rgba(59,130,246,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
                     <div className="absolute inset-0 bg-blue-500/10 animate-pulse"></div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-600">
              <ScanLine className="w-20 h-20 mb-4 opacity-20" />
              <p className="font-medium text-lg tracking-wide opacity-50">NO IMAGE SIGNAL</p>
            </div>
          )}
        </div>

        <div className="h-32 p-4 mt-auto">
          {result ? (
            <div className={`h-full rounded-2xl flex items-center justify-between px-8 backdrop-blur-md border ${
              result.status === 'PASSED' 
                ? 'bg-green-500/10 border-green-500/30' 
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="flex items-center gap-6">
                <div className={`p-4 rounded-full ${result.status === 'PASSED' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {result.status === 'PASSED' ? <CheckCircle className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
                </div>
                <div>
                  <h3 className={`text-3xl font-black tracking-widest ${result.status === 'PASSED' ? 'text-green-400' : 'text-red-400'}`}>
                    {result.status}
                  </h3>
                  <p className="text-slate-300 font-medium mt-1">Phiên: #{result.id} | Hệ thống tự động đánh giá</p>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-slate-400 text-sm mb-1">Mã tham chiếu Lô</p>
                <p className="text-white font-mono font-bold bg-slate-800/80 px-3 py-1 rounded-lg">{result.lotCode}</p>
              </div>
            </div>
          ) : (
            <div className="h-full rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-slate-500 font-medium">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-slate-600 animate-pulse"></div>
                HỆ THỐNG ĐANG CHỜ DỮ LIỆU
              </div>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default InspectionPOS;