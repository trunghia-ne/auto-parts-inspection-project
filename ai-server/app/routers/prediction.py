from fastapi import APIRouter, UploadFile, File
import tensorflow as tf
from keras.layers import DepthwiseConv2D
import numpy as np
from PIL import Image
import io

router = APIRouter()

class FixedDepthwiseConv2D(DepthwiseConv2D):
    def __init__(self, **kwargs):
        if 'groups' in kwargs:
            kwargs.pop('groups')
        super().__init__(**kwargs)

def f1_score(y_true, y_pred):
    return 0.0 

# ==========================================
# NẠP MODEL PHÂN LOẠI (EFFICIENTNET)
# ==========================================
model_path = r'E:/data set/EfficientNetB2-40-(224 X 224)- 96.90.h5'
print("Đang nạp model phân loại, vui lòng đợi...")
try:
    model = tf.keras.models.load_model(
        model_path, 
        custom_objects={'DepthwiseConv2D': FixedDepthwiseConv2D, 'F1_score': f1_score}
    )
    print("Model đã nạp xong!")
except Exception as e:
    print(f"Lỗi khi nạp model: {e}")
    model = None

@router.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        
        class_id = -1
        confidence = 0.0
        
        if model is not None:
            image_pil = Image.open(io.BytesIO(contents)).convert('RGB')
            image_resized = image_pil.resize((224, 224))
            img_array = np.array(image_resized, dtype=np.float32)
            img_array = np.expand_dims(img_array, axis=0)
            
            predictions = model.predict(img_array)
            class_id = int(np.argmax(predictions[0]))
            confidence = float(np.max(predictions[0]))

        print(f"Nhận diện xong: {file.filename} -> Class ID: {class_id} ({confidence:.2f})")

        # Trả về thuần túy kết quả phân loại cho Java
        return {
            "class_id": class_id, 
            "confidence": confidence,
            "status": "PENDING", # Chờ con người quyết định
            "part_name": "Tham chiếu từ DB",
            "defect_type": "", # Rỗng (Chờ người nhập)
            "bounding_boxes": [] # Rỗng (Chờ người vẽ)
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}