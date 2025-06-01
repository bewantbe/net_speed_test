import json
import asyncio
from typing import Dict, Any
from fastapi import WebSocket

class ConnectionManager:
    """Manages WebSocket connections for real-time communication"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str):
        """Accept a new WebSocket connection"""
        await websocket.accept()
        self.active_connections[client_id] = websocket
        print(f"Client {client_id} connected via WebSocket")
    
    def disconnect(self, client_id: str):
        """Remove a WebSocket connection"""
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            print(f"Client {client_id} disconnected")
    
    async def send_message(self, client_id: str, message: Dict[str, Any]):
        """Send a message to a specific client"""
        if client_id in self.active_connections:
            try:
                websocket = self.active_connections[client_id]
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                print(f"Error sending message to {client_id}: {e}")
                self.disconnect(client_id)
    
    async def send_progress(self, client_id: str, progress_data: Dict[str, Any]):
        """Send progress update to a specific client"""
        message = {
            "type": "progress",
            "data": progress_data
        }
        await self.send_message(client_id, message)
    
    async def broadcast(self, message: Dict[str, Any]):
        """Broadcast a message to all connected clients"""
        disconnected_clients = []
        
        for client_id, websocket in self.active_connections.items():
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                print(f"Error broadcasting to {client_id}: {e}")
                disconnected_clients.append(client_id)
        
        # Clean up disconnected clients
        for client_id in disconnected_clients:
            self.disconnect(client_id)
    
    def get_connection_count(self) -> int:
        """Get the number of active connections"""
        return len(self.active_connections)
    
    def is_connected(self, client_id: str) -> bool:
        """Check if a client is connected"""
        return client_id in self.active_connections
