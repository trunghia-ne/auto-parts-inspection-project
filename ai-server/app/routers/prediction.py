from fastapi import APIRouter, UploadFile, File
import tensorflow as tf
from keras.layers import DepthwiseConv2D
import numpy as np
from PIL import Image
import io
import os # THÊM DÒNG NÀY ĐỂ XỬ LÝ TÊN FILE

router = APIRouter()

class FixedDepthwiseConv2D(DepthwiseConv2D):
    def __init__(self, **kwargs):
        if 'groups' in kwargs:
            kwargs.pop('groups')
        super().__init__(**kwargs)

def f1_score(y_true, y_pred):
    return 0.0 

model_path = r'D:/EfficientNetB2-40-(224 X 224)- 96.90/EfficientNetB2-40-(224 X 224)- 96.90.h5'
print("Đang nạp model AI, vui lòng đợi...")
model = tf.keras.models.load_model(
    model_path, 
    custom_objects={'DepthwiseConv2D': FixedDepthwiseConv2D, 'F1_score': f1_score}
)
print("Model đã nạp xong!")

@router.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        # Lấy tên file và tách phần đuôi mở rộng (VD: .jpg, .png)
        filename = file.filename.lower()
        base_name, ext = os.path.splitext(filename) 
        
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert('RGB')
        image = image.resize((224, 224))

        img_array = np.array(image, dtype=np.float32)
        img_array = np.expand_dims(img_array, axis=0)
        predictions = model.predict(img_array)
        class_id = int(np.argmax(predictions[0]))
        confidence = float(np.max(predictions[0]))
        
        part_names = {27: "Máy nén khí", 28: "Máy phát điện"}
        part_name = part_names.get(class_id, f"Phụ tùng ID {class_id}")

        # ---------------------------------------------------------
        # 3. KỊCH BẢN DEMO (DỰA VÀO ĐUÔI SỐ CỦA TÊN FILE)
        # ---------------------------------------------------------
        status = "PASSED"
        defect_type = "Không có lỗi"
        bounding_boxes = [] 

        # Kiểm tra Hậu tố của tên file (không tính đuôi .jpg, .png)
        if base_name.endswith("_1"):
            status = "FAILED"
            defect_type = "Xước bề mặt kim loại"
            bounding_boxes = [{"top": "35%", "left": "40%", "width": "20%", "height": "10%"}]
            confidence = 0.92

        elif base_name.endswith("_2"):
            status = "FAILED"
            defect_type = "Nứt vỡ vỏ bọc"
            bounding_boxes = [
                {"top": "20%", "left": "60%", "width": "15%", "height": "25%"},
                {"top": "70%", "left": "30%", "width": "10%", "height": "10%"}
            ]
            confidence = 0.88

        elif base_name.endswith("_3"):
            status = "FAILED"
            defect_type = "Rỉ sét nghiêm trọng"
            bounding_boxes = [{"top": "50%", "left": "45%", "width": "30%", "height": "30%"}]
            confidence = 0.95
            
        print(f"Demo Mode: {filename} -> {status} | Lỗi: {defect_type}")

        # 4. Trả về cho Java và React
        return {
            "class_id": class_id, 
            "confidence": confidence,
            "status": status,
            "part_name": part_name,
            "defect_type": defect_type,
            "bounding_boxes": bounding_boxes
        }
        
    except Exception as e:
        return {"error": str(e)}