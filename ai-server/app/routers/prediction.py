from fastapi import APIRouter, UploadFile, File
import tensorflow as tf
from keras.layers import DepthwiseConv2D
import numpy as np
from PIL import Image
import io

router = APIRouter()

# 1. Định nghĩa lại các object tùy chỉnh
class FixedDepthwiseConv2D(DepthwiseConv2D):
    def __init__(self, **kwargs):
        if 'groups' in kwargs:
            kwargs.pop('groups')
        super().__init__(**kwargs)

# 2. Định nghĩa một hàm rỗng cho F1_score để "lừa" Keras
def f1_score(y_true, y_pred):
    return 0.0 

# 3. Load model 
model_path = r'E:/data set/EfficientNetB2-40-(224 X 224)- 96.90.h5'
print("Đang nạp model AI, vui lòng đợi...")
model = tf.keras.models.load_model(
    model_path, 
    custom_objects={
        'DepthwiseConv2D': FixedDepthwiseConv2D,
        'F1_score': f1_score 
    }
)
print("Model đã nạp xong!")

# 4. Hàm nhận ảnh từ Java và dự đoán
@router.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        # Đọc dữ liệu ảnh từ request gửi tới
        contents = await file.read()
        
        # Mở ảnh bằng thư viện PIL và chuyển về hệ màu RGB
        image = Image.open(io.BytesIO(contents)).convert('RGB')
        
        # Resize ảnh về đúng kích thước
        image = image.resize((224, 224))

        # 🔥 DEBUG: Lưu lại ảnh xem AI thực sự nhìn thấy gì
        image.save("debug_ai_vision.jpg")
        
        # 🔥 FIX LỖI: EfficientNet tự động chuẩn hóa ảnh bên trong model rồi. 
        # Tuyệt đối KHÔNG chia 255 ở bước này. Chỉ cần ép kiểu về float32.
        img_array = np.array(image, dtype=np.float32)
        
        # Thêm 1 chiều (batch dimension)
        img_array = np.expand_dims(img_array, axis=0)
        
        # Chạy model dự đoán
        predictions = model.predict(img_array)
        
        # Lấy class_id có tỷ lệ cao nhất và độ tin cậy tương ứng
        class_id = int(np.argmax(predictions[0]))
        confidence = float(np.max(predictions[0]))
        
        print(f"AI đã nhận diện: Class ID = {class_id}, Confidence = {confidence}")
        
        # Trả về chuỗi JSON cho Java đọc
        return {"class_id": class_id, "confidence": confidence}
        
    except Exception as e:
        return {"error": str(e)}