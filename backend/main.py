# Network Speed Test Server

#TODO:
#Add more tests:
#  IOPS
#
#Add history log:
#  Show log of last 10 tests.
#
#Add curve show:

import asyncio
import json
import time
import secrets
import socket
from typing import Dict, Any, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from speed_tests import SpeedTestEngine
from websocket_handler import ConnectionManager

app = FastAPI(title="Network Speed Test", version="1.0.0")

# Add CORS middleware for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
speed_test_engine = SpeedTestEngine()
connection_manager = ConnectionManager()

# Mount static files
app.mount("/static", StaticFiles(directory="../frontend"), name="static")

@app.get("/")
async def serve_frontend():
    """Serve the main frontend page"""
    return FileResponse("../frontend/index.html")

@app.get("/test/ping")
async def ping_test():
    """Lightweight ping endpoint for latency testing"""
    return {"timestamp": time.time_ns(), "status": "pong"}

@app.post("/test/download/{size_mb}")
async def download_test(size_mb: int, websocket_id: Optional[str] = None):
    """Stream random data for download speed testing"""
    
    async def generate_test_data():
        chunk_size = 1024 * 1024  # 1MB chunks
        total_bytes = size_mb * 1024 * 1024
        sent_bytes = 0
        start_time = time.time()
        
        while sent_bytes < total_bytes:
            remaining = total_bytes - sent_bytes
            current_chunk_size = min(chunk_size, remaining)
            
            # Generate random data efficiently
            chunk = secrets.token_bytes(current_chunk_size)
            sent_bytes += len(chunk)
            
            # Send progress update via WebSocket if available
            if websocket_id:
                progress = (sent_bytes / total_bytes) * 100
                elapsed = time.time() - start_time
                speed_mbps = (sent_bytes * 8) / (elapsed * 1_000_000) if elapsed > 0 else 0
                
                await connection_manager.send_progress(websocket_id, {
                    "test_type": "download",
                    "progress": progress,
                    "speed_mbps": speed_mbps,
                    "bytes_transferred": sent_bytes,
                    "elapsed_time": elapsed
                })
            
            yield chunk
    
    return StreamingResponse(
        generate_test_data(),
        media_type="application/octet-stream",
        headers={
            "Content-Length": str(size_mb * 1024 * 1024),
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    )

@app.post("/test/upload/{size_mb}")
async def upload_test(size_mb: int, request: Request, websocket_id: Optional[str] = None):
    """Handle upload data for upload speed testing"""
    start_time = time.time()
    total_bytes = 0
    expected_bytes = size_mb * 1024 * 1024
    
    async for chunk in request.stream():
        total_bytes += len(chunk)
        
        # Send progress update via WebSocket if available
        if websocket_id:
            progress = min((total_bytes / expected_bytes) * 100, 100)
            elapsed = time.time() - start_time
            speed_mbps = (total_bytes * 8) / (elapsed * 1_000_000) if elapsed > 0 else 0
            
            await connection_manager.send_progress(websocket_id, {
                "test_type": "upload",
                "progress": progress,
                "speed_mbps": speed_mbps,
                "bytes_transferred": total_bytes,
                "elapsed_time": elapsed
            })
    
    elapsed_time = time.time() - start_time
    speed_mbps = (total_bytes * 8) / (elapsed_time * 1_000_000) if elapsed_time > 0 else 0
    
    return {
        "bytes_received": total_bytes,
        "elapsed_time": elapsed_time,
        "speed_mbps": speed_mbps,
        "status": "completed"
    }

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket endpoint for real-time communication"""
    await connection_manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "start_test":
                test_type = message.get("test_type")
                size_mb = message.get("size_mb", 10)
                
                if test_type == "latency":
                    await speed_test_engine.run_latency_test(client_id, connection_manager)
                    
    except WebSocketDisconnect:
        connection_manager.disconnect(client_id)

@app.get("/info")
async def get_server_info():
    """Get server information including local IP addresses"""
    hostname = socket.gethostname()
    local_ips = []
    
    try:
        # Get all network interfaces
        for info in socket.getaddrinfo(hostname, None):
            ip = info[4][0]
            if ip.startswith('192.168.') or ip.startswith('10.') or ip.startswith('172.'):
                if ip not in local_ips:
                    local_ips.append(ip)
    except:
        # Fallback method
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            s.connect(("8.8.8.8", 80))
            local_ips.append(s.getsockname()[0])
        except:
            local_ips.append("127.0.0.1")
        finally:
            s.close()
    
    return {
        "hostname": hostname,
        "local_ips": local_ips,
        "port": 8000,
        "access_urls": [f"http://{ip}:8000" for ip in local_ips]
    }

def get_local_ip():
    """Get the local IP address for display"""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip

if __name__ == "__main__":
    local_ip = get_local_ip()
    print(f"\n🚀 Network Speed Test Server Starting...")
    print(f"📍 Local access: http://127.0.0.1:8000")
    print(f"🌐 Network access: http://{local_ip}:8000")
    print(f"📱 Access from other devices on your network using the network URL above")
    print(f"🔧 Server will auto-reload on code changes\n")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        access_log=False  # Disable access logs for better performance during tests
    )
