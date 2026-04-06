import { useEffect, useState } from 'react';

// Khai báo kiểu dữ liệu TypeScript cho Phụ tùng
interface Part {
  id: number;
  partCode: string;
  partName: string;
  specifications: string;
}

function App() {
  const [parts, setParts] = useState<Part[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Gọi API lấy danh sách phụ tùng
    fetch('http://localhost:8080/api/parts', {
      method: 'GET',
      headers: {
        // Mã hóa Basic Auth (admin:123456) thành base64 để đi qua rào bảo mật
        'Authorization': 'Basic ' + btoa('admin:123456'),
        'Content-Type': 'application/json'
      }
    })
        .then(response => {
          if (!response.ok) throw new Error('Không thể kết nối đến server');
          return response.json();
        })
        .then(data => setParts(data))
        .catch(err => setError(err.message));
  }, []);

  return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-blue-600 mb-4">Hệ Thống Kiểm Định Phụ Tùng</h1>

          {error && <p className="text-red-500 mb-4">{error}</p>}

          <div className="border border-gray-200 rounded">
            {parts.length === 0 ? (
                <p className="p-4 text-gray-500 text-center">Chưa có dữ liệu phụ tùng nào trong hệ thống.</p>
            ) : (
                <ul className="divide-y divide-gray-200">
                  {parts.map(part => (
                      <li key={part.id} className="p-4 hover:bg-gray-50">
                        <span className="font-bold text-gray-700">{part.partCode}</span> - {part.partName}
                      </li>
                  ))}
                </ul>
            )}
          </div>
        </div>
      </div>
  );
}

export default App;