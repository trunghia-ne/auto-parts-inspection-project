import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // File chứa cấu hình Tailwind CSS mà chúng ta đã làm lúc đầu

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);