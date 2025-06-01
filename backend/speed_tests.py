import asyncio
import time
import aiohttp
from typing import Dict, Any, List

class SpeedTestEngine:
    """Core engine for running network speed tests"""
    
    def __init__(self):
        self.ping_samples = 10
        self.ping_timeout = 5.0
    
    async def run_latency_test(self, client_id: str, connection_manager):
        """Run latency test with multiple ping samples"""
        latencies = []
        failed_pings = 0
        
        for i in range(self.ping_samples):
            try:
                start_time = time.time_ns()
                
                # Make a lightweight HTTP request to our own ping endpoint
                async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.ping_timeout)) as session:
                    async with session.get('http://localhost:8000/test/ping') as response:
                        if response.status == 200:
                            end_time = time.time_ns()
                            latency_ms = (end_time - start_time) / 1_000_000  # Convert to milliseconds
                            latencies.append(latency_ms)
                        else:
                            failed_pings += 1
                
                # Send progress update
                progress = ((i + 1) / self.ping_samples) * 100
                await connection_manager.send_progress(client_id, {
                    "test_type": "latency",
                    "progress": progress,
                    "current_ping": latencies[-1] if latencies else None,
                    "sample": i + 1,
                    "total_samples": self.ping_samples
                })
                
                # Small delay between pings
                await asyncio.sleep(0.1)
                
            except Exception as e:
                failed_pings += 1
                await connection_manager.send_progress(client_id, {
                    "test_type": "latency",
                    "progress": ((i + 1) / self.ping_samples) * 100,
                    "error": f"Ping {i+1} failed: {str(e)}",
                    "sample": i + 1,
                    "total_samples": self.ping_samples
                })
        
        # Calculate statistics
        if latencies:
            min_latency = min(latencies)
            max_latency = max(latencies)
            avg_latency = sum(latencies) / len(latencies)
            
            # Calculate jitter (standard deviation)
            variance = sum((x - avg_latency) ** 2 for x in latencies) / len(latencies)
            jitter = variance ** 0.5
        else:
            min_latency = max_latency = avg_latency = jitter = 0
        
        # Send final results
        results = {
            "test_type": "latency",
            "status": "completed",
            "results": {
                "min_latency_ms": round(min_latency, 2) if latencies else 0,
                "max_latency_ms": round(max_latency, 2) if latencies else 0,
                "avg_latency_ms": round(avg_latency, 2) if latencies else 0,
                "jitter_ms": round(jitter, 2) if latencies else 0,
                "packet_loss_percent": (failed_pings / self.ping_samples) * 100,
                "successful_pings": len(latencies),
                "failed_pings": failed_pings,
                "total_samples": self.ping_samples,
                "all_latencies": [round(l, 2) for l in latencies]
            }
        }
        
        await connection_manager.send_message(client_id, results)
        return results

    def calculate_speed_mbps(self, bytes_transferred: int, elapsed_seconds: float) -> float:
        """Calculate speed in Mbps"""
        if elapsed_seconds <= 0:
            return 0.0
        bits_transferred = bytes_transferred * 8
        mbps = bits_transferred / (elapsed_seconds * 1_000_000)
        return round(mbps, 2)
    
    def format_bytes(self, bytes_count: int) -> str:
        """Format bytes in human readable format"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if bytes_count < 1024.0:
                return f"{bytes_count:.2f} {unit}"
            bytes_count /= 1024.0
        return f"{bytes_count:.2f} TB"
    
    def get_performance_rating(self, speed_mbps: float, test_type: str) -> Dict[str, Any]:
        """Get performance rating and recommendations"""
        if test_type in ["download", "upload"]:
            if speed_mbps >= 1000:
                rating = "Excellent"
                color = "#00ff00"
                description = "Gigabit+ speed - Perfect for all activities"
            elif speed_mbps >= 500:
                rating = "Very Good"
                color = "#80ff00"
                description = "Great for 4K streaming, large downloads"
            elif speed_mbps >= 100:
                rating = "Good"
                color = "#ffff00"
                description = "Good for HD streaming, video calls"
            elif speed_mbps >= 25:
                rating = "Fair"
                color = "#ff8000"
                description = "Adequate for basic streaming, browsing"
            elif speed_mbps >= 5:
                rating = "Poor"
                color = "#ff4000"
                description = "Limited to basic web browsing"
            else:
                rating = "Very Poor"
                color = "#ff0000"
                description = "May have connectivity issues"
        else:  # latency
            if speed_mbps <= 20:  # speed_mbps is actually latency_ms here
                rating = "Excellent"
                color = "#00ff00"
                description = "Perfect for gaming and real-time apps"
            elif speed_mbps <= 50:
                rating = "Very Good"
                color = "#80ff00"
                description = "Great for most online activities"
            elif speed_mbps <= 100:
                rating = "Good"
                color = "#ffff00"
                description = "Good for general use"
            elif speed_mbps <= 200:
                rating = "Fair"
                color = "#ff8000"
                description = "Noticeable delay in interactive apps"
            else:
                rating = "Poor"
                color = "#ff0000"
                description = "High latency may affect performance"
        
        return {
            "rating": rating,
            "color": color,
            "description": description
        }
