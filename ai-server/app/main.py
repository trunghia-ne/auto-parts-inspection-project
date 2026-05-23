from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import prediction

app = FastAPI(title="TND Auto-QC System")

# Cấu hình CORS để frontend React gọi được
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Nạp router AI
app.include_router(prediction.router, prefix="/api")

@app.get("/")
def home():
    return {"status": "Server AI Auto-QC đang chạy tốt!"}