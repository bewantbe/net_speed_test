class SpeedTest {
    constructor() {
        this.websocket = null;
        this.clientId = this.generateClientId();
        this.testResults = {
            download: null,
            upload: null,
            latency: null
        };
        this.isTestRunning = false;
        this.currentTestSize = 100;
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadServerInfo();
        this.connectWebSocket();
    }
    
    generateClientId() {
        return 'client_' + Math.random().toString(36).substr(2, 9);
    }
    
    initializeElements() {
        this.elements = {
            startButton: document.getElementById('startTest'),
            testSizeSelect: document.getElementById('testSize'),
            
            // Progress elements
            downloadProgress: document.getElementById('downloadProgress'),
            uploadProgress: document.getElementById('uploadProgress'),
            latencyProgress: document.getElementById('latencyProgress'),
            
            downloadProgressText: document.getElementById('downloadProgressText'),
            uploadProgressText: document.getElementById('uploadProgressText'),
            latencyProgressText: document.getElementById('latencyProgressText'),
            
            // Status elements
            downloadStatus: document.getElementById('downloadStatus'),
            uploadStatus: document.getElementById('uploadStatus'),
            latencyStatus: document.getElementById('latencyStatus'),
            
            // Result elements
            downloadResult: document.getElementById('downloadResult'),
            uploadResult: document.getElementById('uploadResult'),
            latencyResult: document.getElementById('latencyResult'),
            
            // Cards
            downloadCard: document.getElementById('downloadCard'),
            uploadCard: document.getElementById('uploadCard'),
            latencyCard: document.getElementById('latencyCard'),
            
            // Summary
            summaryCard: document.getElementById('summaryCard'),
            summaryDownload: document.getElementById('summaryDownload'),
            summaryUpload: document.getElementById('summaryUpload'),
            summaryLatency: document.getElementById('summaryLatency'),
            ratingValue: document.getElementById('ratingValue'),
            ratingDescription: document.getElementById('ratingDescription'),
            
            // Server info
            serverInfo: document.getElementById('serverInfo'),
            
            // Button states
            buttonText: document.querySelector('.button-text'),
            buttonLoader: document.querySelector('.button-loader')
        };
    }
    
    setupEventListeners() {
        this.elements.startButton.addEventListener('click', () => this.startSpeedTest());
        this.elements.testSizeSelect.addEventListener('change', (e) => {
            this.currentTestSize = parseInt(e.target.value);
        });
    }
    
    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/${this.clientId}`;
        
        this.websocket = new WebSocket(wsUrl);
        
        this.websocket.onopen = () => {
            console.log('WebSocket connected');
        };
        
        this.websocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleWebSocketMessage(data);
        };
        
        this.websocket.onclose = () => {
            console.log('WebSocket disconnected');
            setTimeout(() => this.connectWebSocket(), 3000);
        };
        
        this.websocket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }
    
    handleWebSocketMessage(data) {
        if (data.type === 'progress') {
            this.updateProgress(data.data);
        } else if (data.test_type === 'latency' && data.status === 'completed') {
            this.handleLatencyResults(data.results);
        }
    }
    
    updateProgress(progressData) {
        const testType = progressData.test_type;
        const progress = Math.round(progressData.progress || 0);
        
        if (testType === 'download') {
            this.elements.downloadProgress.style.width = `${progress}%`;
            this.elements.downloadProgressText.textContent = `${progress}%`;
            
            if (progressData.speed_mbps) {
                const speedText = `${progressData.speed_mbps.toFixed(1)} Mbps`;
                this.elements.downloadResult.querySelector('.speed-value').textContent = speedText;
            }
        } else if (testType === 'upload') {
            this.elements.uploadProgress.style.width = `${progress}%`;
            this.elements.uploadProgressText.textContent = `${progress}%`;
            
            if (progressData.speed_mbps) {
                const speedText = `${progressData.speed_mbps.toFixed(1)} Mbps`;
                this.elements.uploadResult.querySelector('.speed-value').textContent = speedText;
            }
        } else if (testType === 'latency') {
            this.elements.latencyProgress.style.width = `${progress}%`;
            this.elements.latencyProgressText.textContent = `${progress}%`;
            
            if (progressData.current_ping) {
                const latencyText = `${progressData.current_ping.toFixed(1)} ms`;
                this.elements.latencyResult.querySelector('.speed-value').textContent = latencyText;
            }
        }
    }
    
    async loadServerInfo() {
        try {
            const response = await fetch('/info');
            const serverInfo = await response.json();
            
            let infoHtml = `<p><strong>Server:</strong> ${serverInfo.hostname}</p>`;
            if (serverInfo.access_urls && serverInfo.access_urls.length > 0) {
                infoHtml += `<p><strong>Network Access:</strong></p>`;
                serverInfo.access_urls.forEach(url => {
                    infoHtml += `<p><a href="${url}" target="_blank">${url}</a></p>`;
                });
            }
            
            this.elements.serverInfo.innerHTML = infoHtml;
        } catch (error) {
            this.elements.serverInfo.innerHTML = '<p>Server info unavailable</p>';
        }
    }
    
    async startSpeedTest() {
        if (this.isTestRunning) return;
        
        this.isTestRunning = true;
        this.updateButtonState(true);
        this.resetTestResults();
        this.elements.summaryCard.style.display = 'none';
        
        try {
            // Run tests sequentially
            await this.runDownloadTest();
            await this.runUploadTest();
            await this.runLatencyTest();
            
            this.showSummary();
        } catch (error) {
            console.error('Speed test error:', error);
            this.showError('Test failed. Please try again.');
        } finally {
            this.isTestRunning = false;
            this.updateButtonState(false);
        }
    }
    
    updateButtonState(isRunning) {
        this.elements.startButton.disabled = isRunning;
        
        if (isRunning) {
            this.elements.buttonText.style.display = 'none';
            this.elements.buttonLoader.style.display = 'flex';
        } else {
            this.elements.buttonText.style.display = 'block';
            this.elements.buttonLoader.style.display = 'none';
        }
    }
    
    resetTestResults() {
        // Reset progress bars
        this.elements.downloadProgress.style.width = '0%';
        this.elements.uploadProgress.style.width = '0%';
        this.elements.latencyProgress.style.width = '0%';
        
        // Reset progress text
        this.elements.downloadProgressText.textContent = '0%';
        this.elements.uploadProgressText.textContent = '0%';
        this.elements.latencyProgressText.textContent = '0%';
        
        // Reset status
        this.updateTestStatus('download', 'ready', 'Ready');
        this.updateTestStatus('upload', 'ready', 'Ready');
        this.updateTestStatus('latency', 'ready', 'Ready');
        
        // Reset results
        this.elements.downloadResult.querySelector('.speed-value').textContent = '-- Mbps';
        this.elements.uploadResult.querySelector('.speed-value').textContent = '-- Mbps';
        this.elements.latencyResult.querySelector('.speed-value').textContent = '-- ms';
        
        // Reset card styles
        this.elements.downloadCard.className = 'test-card';
        this.elements.uploadCard.className = 'test-card';
        this.elements.latencyCard.className = 'test-card';
        
        // Clear details
        this.elements.downloadResult.querySelector('.speed-details').textContent = '';
        this.elements.uploadResult.querySelector('.speed-details').textContent = '';
        this.elements.latencyResult.querySelector('.speed-details').textContent = '';
    }
    
    updateTestStatus(testType, status, text) {
        const statusElement = this.elements[`${testType}Status`];
        const cardElement = this.elements[`${testType}Card`];
        
        statusElement.textContent = text;
        statusElement.className = `test-status ${status}`;
        
        if (status === 'testing') {
            cardElement.className = 'test-card active';
        } else if (status === 'completed') {
            cardElement.className = 'test-card completed';
        } else if (status === 'error') {
            cardElement.className = 'test-card error';
        } else {
            cardElement.className = 'test-card';
        }
    }
    
    async runDownloadTest() {
        this.updateTestStatus('download', 'testing', 'Testing...');
        
        const startTime = performance.now();
        
        try {
            const response = await fetch(`/test/download/${this.currentTestSize}?websocket_id=${this.clientId}`, {
                method: 'POST',
                cache: 'no-cache'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const reader = response.body.getReader();
            let receivedBytes = 0;
            
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;
                
                receivedBytes += value.length;
                
                // Calculate progress and speed
                const expectedBytes = this.currentTestSize * 1024 * 1024;
                const progress = (receivedBytes / expectedBytes) * 100;
                const elapsed = (performance.now() - startTime) / 1000;
                const speedMbps = (receivedBytes * 8) / (elapsed * 1_000_000);
                
                // Update UI
                this.elements.downloadProgress.style.width = `${Math.min(progress, 100)}%`;
                this.elements.downloadProgressText.textContent = `${Math.round(progress)}%`;
                this.elements.downloadResult.querySelector('.speed-value').textContent = `${speedMbps.toFixed(1)} Mbps`;
            }
            
            const totalTime = (performance.now() - startTime) / 1000;
            const finalSpeed = (receivedBytes * 8) / (totalTime * 1_000_000);
            
            this.testResults.download = {
                speed_mbps: finalSpeed,
                bytes_transferred: receivedBytes,
                duration: totalTime
            };
            
            this.updateTestStatus('download', 'completed', 'Completed');
            this.elements.downloadResult.querySelector('.speed-value').textContent = `${finalSpeed.toFixed(1)} Mbps`;
            this.elements.downloadResult.querySelector('.speed-details').textContent = 
                `${this.formatBytes(receivedBytes)} in ${totalTime.toFixed(1)}s`;
                
        } catch (error) {
            console.error('Download test error:', error);
            this.updateTestStatus('download', 'error', 'Error');
            this.elements.downloadResult.querySelector('.speed-details').textContent = 'Test failed';
        }
    }
    
    async runUploadTest() {
        this.updateTestStatus('upload', 'testing', 'Testing...');
        
        const startTime = performance.now();
        const uploadSize = this.currentTestSize * 1024 * 1024;
        
        try {
            // Generate test data
            const chunkSize = 1024 * 1024; // 1MB chunks
            const chunks = [];
            for (let i = 0; i < this.currentTestSize; i++) {
                chunks.push(new Uint8Array(chunkSize).fill(Math.floor(Math.random() * 256)));
            }
            
            const uploadData = new Blob(chunks);
            
            const response = await fetch(`/test/upload/${this.currentTestSize}?websocket_id=${this.clientId}`, {
                method: 'POST',
                body: uploadData,
                headers: {
                    'Content-Type': 'application/octet-stream'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            const totalTime = (performance.now() - startTime) / 1000;
            const finalSpeed = result.speed_mbps || (uploadSize * 8) / (totalTime * 1_000_000);
            
            this.testResults.upload = {
                speed_mbps: finalSpeed,
                bytes_transferred: uploadSize,
                duration: totalTime
            };
            
            this.updateTestStatus('upload', 'completed', 'Completed');
            this.elements.uploadResult.querySelector('.speed-value').textContent = `${finalSpeed.toFixed(1)} Mbps`;
            this.elements.uploadResult.querySelector('.speed-details').textContent = 
                `${this.formatBytes(uploadSize)} in ${totalTime.toFixed(1)}s`;
                
        } catch (error) {
            console.error('Upload test error:', error);
            this.updateTestStatus('upload', 'error', 'Error');
            this.elements.uploadResult.querySelector('.speed-details').textContent = 'Test failed';
        }
    }
    
    async runLatencyTest() {
        this.updateTestStatus('latency', 'testing', 'Testing...');
        
        try {
            // Send start latency test message via WebSocket
            if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
                this.websocket.send(JSON.stringify({
                    type: 'start_test',
                    test_type: 'latency'
                }));
            } else {
                throw new Error('WebSocket not connected');
            }
            
            // Wait for latency test to complete (handled by WebSocket message)
            await this.waitForLatencyTest();
            
        } catch (error) {
            console.error('Latency test error:', error);
            this.updateTestStatus('latency', 'error', 'Error');
            this.elements.latencyResult.querySelector('.speed-details').textContent = 'Test failed';
        }
    }
    
    waitForLatencyTest() {
        return new Promise((resolve) => {
            const checkLatencyComplete = () => {
                if (this.testResults.latency) {
                    resolve();
                } else {
                    setTimeout(checkLatencyComplete, 100);
                }
            };
            checkLatencyComplete();
        });
    }
    
    handleLatencyResults(results) {
        this.testResults.latency = results;
        
        this.updateTestStatus('latency', 'completed', 'Completed');
        this.elements.latencyResult.querySelector('.speed-value').textContent = `${results.avg_latency_ms} ms`;
        
        const details = `Min: ${results.min_latency_ms}ms, Max: ${results.max_latency_ms}ms, Jitter: ${results.jitter_ms}ms`;
        if (results.packet_loss_percent > 0) {
            details += `, Loss: ${results.packet_loss_percent.toFixed(1)}%`;
        }
        this.elements.latencyResult.querySelector('.speed-details').textContent = details;
    }
    
    showSummary() {
        // Update summary values
        if (this.testResults.download) {
            this.elements.summaryDownload.textContent = `${this.testResults.download.speed_mbps.toFixed(1)} Mbps`;
        }
        if (this.testResults.upload) {
            this.elements.summaryUpload.textContent = `${this.testResults.upload.speed_mbps.toFixed(1)} Mbps`;
        }
        if (this.testResults.latency) {
            this.elements.summaryLatency.textContent = `${this.testResults.latency.avg_latency_ms} ms`;
        }
        
        // Calculate overall rating
        const rating = this.calculateOverallRating();
        this.elements.ratingValue.textContent = rating.rating;
        this.elements.ratingDescription.textContent = rating.description;
        
        // Show summary card
        this.elements.summaryCard.style.display = 'block';
    }
    
    calculateOverallRating() {
        let score = 0;
        let factors = 0;
        
        if (this.testResults.download) {
            const downloadSpeed = this.testResults.download.speed_mbps;
            if (downloadSpeed >= 100) score += 5;
            else if (downloadSpeed >= 25) score += 4;
            else if (downloadSpeed >= 5) score += 3;
            else if (downloadSpeed >= 1) score += 2;
            else score += 1;
            factors++;
        }
        
        if (this.testResults.upload) {
            const uploadSpeed = this.testResults.upload.speed_mbps;
            if (uploadSpeed >= 50) score += 5;
            else if (uploadSpeed >= 10) score += 4;
            else if (uploadSpeed >= 2) score += 3;
            else if (uploadSpeed >= 0.5) score += 2;
            else score += 1;
            factors++;
        }
        
        if (this.testResults.latency) {
            const latency = this.testResults.latency.avg_latency_ms;
            if (latency <= 20) score += 5;
            else if (latency <= 50) score += 4;
            else if (latency <= 100) score += 3;
            else if (latency <= 200) score += 2;
            else score += 1;
            factors++;
        }
        
        if (factors === 0) {
            return { rating: 'Unknown', description: 'No test data available' };
        }
        
        const averageScore = score / factors;
        
        if (averageScore >= 4.5) {
            return { rating: 'Excellent', description: 'Your connection is performing exceptionally well' };
        } else if (averageScore >= 3.5) {
            return { rating: 'Very Good', description: 'Your connection is performing very well' };
        } else if (averageScore >= 2.5) {
            return { rating: 'Good', description: 'Your connection is performing adequately' };
        } else if (averageScore >= 1.5) {
            return { rating: 'Fair', description: 'Your connection may have some limitations' };
        } else {
            return { rating: 'Poor', description: 'Your connection may need improvement' };
        }
    }
    
    formatBytes(bytes) {
        const sizes = ['B', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
    }
    
    showError(message) {
        // You can implement a more sophisticated error display here
        alert(message);
    }
}

// Initialize the speed test when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SpeedTest();
});
