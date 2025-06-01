# Network Speed Test

A high-performance network speed testing application with real-time results, designed for local network testing. Built with Python 3.13 (FastAPI backend) and modern web technologies (frontend).

## Features

- **Download Speed Test**: Measures download throughput with configurable test sizes
- **Upload Speed Test**: Measures upload throughput with real data transfer
- **Network Latency Test**: Comprehensive latency analysis with jitter and packet loss detection
- **Real-time Progress**: Live updates during testing via WebSocket
- **Multiple Test Sizes**: 10MB, 100MB, and 1000MB (1GB) options
- **Cross-platform**: Works on Windows 11 and Linux
- **Local Network Optimized**: Designed for maximum performance on local networks
- **Modern UI**: Responsive web interface with real-time charts and progress indicators

## Quick Start

### Windows
1. Double-click `start.bat`
2. The script will automatically set up the environment and start the server
3. Open the displayed URL in your web browser

### Linux/macOS
1. Make the script executable: `chmod +x start.sh`
2. Run: `./start.sh`
3. Open the displayed URL in your web browser

## Manual Setup

### Prerequisites
- Python 3.13 (recommended) or Python 3.8+
- pip (Python package installer)

### Installation

1. **Clone or download this repository**
2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment:**
   - Windows: `venv\Scripts\activate`
   - Linux/macOS: `source venv/bin/activate`

4. **Install dependencies:**
   ```bash
   pip install -r backend/requirements.txt
   ```

5. **Start the server:**
   ```bash
   cd backend
   python main.py
   ```

6. **Access the application:**
   - Local access: http://127.0.0.1:8000
   - Network access: Check the server output for your local IP

## Usage

1. **Open the web interface** in your browser
2. **Select test size** (10MB, 100MB, or 1000MB)
3. **Click "Start Speed Test"** to begin
4. **Watch real-time progress** for each test:
   - Download speed test (measures download throughput)
   - Upload speed test (measures upload throughput)  
   - Latency test (measures round-trip time, jitter, packet loss)
5. **Review results** in the summary section

## Architecture

### Backend (FastAPI + Python 3.13)
- **FastAPI**: High-performance async web framework
- **WebSocket**: Real-time communication for progress updates
- **Efficient Data Generation**: Uses `secrets` module for cryptographically secure random data
- **Memory Optimization**: Streaming data without disk I/O
- **Cross-platform Networking**: Auto-detection of local IP addresses

### Frontend (Modern Web)
- **Vanilla JavaScript**: No framework dependencies for maximum performance
- **Fetch API with Streams**: Efficient data transfer measurement
- **WebSocket Client**: Real-time progress updates
- **Responsive Design**: Works on desktop and mobile devices
- **Modern CSS**: Gradient backgrounds, animations, and responsive grid layout

### Test Methodologies

#### Download Speed Test
- Streams random data from server to client
- Measures transfer rate in real-time
- Uses chunked encoding for memory efficiency
- Calculates Mbps based on actual bytes transferred and elapsed time

#### Upload Speed Test
- Generates random data on client side
- Uploads data to server using POST request
- Server measures receive rate and reports back
- Handles large uploads efficiently with chunked transfer

#### Latency Test
- Performs 10 lightweight HTTP requests
- Measures round-trip time for each request
- Calculates min, max, average latency and jitter
- Detects packet loss percentage

## Performance Optimizations

- **Async/Await**: All I/O operations are asynchronous
- **Memory Streaming**: No large file buffering in memory
- **Efficient Data Generation**: Uses optimized random data generation
- **WebSocket Communication**: Reduces HTTP overhead for progress updates
- **Browser Optimization**: Uses modern web APIs for maximum performance

## Network Configuration

The application automatically detects and displays:
- Local IP addresses (192.168.x.x, 10.x.x.x, 172.x.x.x)
- Accessible URLs for network testing
- Server hostname information

## Troubleshooting

### Common Issues

1. **Port 8000 already in use**
   - Change the port in `backend/main.py` (line with `port=8000`)
   
2. **Cannot access from other devices**
   - Ensure firewall allows connections on port 8000
   - Check that devices are on the same network
   - Use the network URL displayed in the server output

3. **Slow test results**
   - Ensure you're testing on a local network (not internet)
   - Try different test sizes
   - Check for other network activity

4. **WebSocket connection failed**
   - Refresh the browser page
   - Check browser console for errors
   - Ensure server is running

### System Requirements

- **RAM**: 512MB minimum (1GB recommended for 1000MB tests)
- **Network**: Ethernet connection recommended for best results
- **Browser**: Chrome, Firefox, Safari, or Edge (modern versions)

## Development

### Project Structure
```
net_speed_test/
├── backend/
│   ├── main.py              # FastAPI application entry point
│   ├── speed_tests.py       # Core speed test engine
│   ├── websocket_handler.py # WebSocket connection management
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── index.html          # Main web interface
│   ├── style.css           # Styling and responsive design
│   └── script.js           # Test logic and WebSocket handling
├── start.bat               # Windows startup script
├── start.sh                # Linux/macOS startup script
└── README.md              # This file
```

### Adding New Features

1. **Backend**: Add new endpoints in `main.py`
2. **Speed Tests**: Extend `speed_tests.py` for new test types
3. **Frontend**: Modify `script.js` for new UI features
4. **Styling**: Update `style.css` for design changes

## License

This project is open source. Feel free to modify and distribute according to your needs.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the server console output for error messages
3. Check browser developer console for client-side errors
