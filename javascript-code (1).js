




        const { jsPDF } = window.jspdf;
        
        let currentStep = 1;
        let agentSession = null;
        let customerSignaturePad = null;
        let agentSignaturePad = null;
        let cameraStream = null;
        let scannerStream = null;
        let barcodeScannerActive = false;
        let qrScannerActive = false;
        let currentScanMode = 'barcode';
        let locationWatchId = null;
        let currentLocation = null;
        let capturedImages = [];
        let uploadedImages = [];
        
        const loginScreen = document.getElementById('login-screen');
        const appContainer = document.getElementById('app-container');
        const loginBtn = document.getElementById('login-btn');
        const loginBtnText = document.getElementById('login-btn-text');
        const loginSpinner = document.getElementById('login-spinner');
        const logoutBtn = document.getElementById('logout-btn');
        
        const step1 = document.getElementById('step1');
        const step2 = document.getElementById('step2');
        const step3 = document.getElementById('step3');
        const step4 = document.getElementById('step4');
        const step5 = document.getElementById('step5');
        
        const step1Indicator = document.getElementById('step1-indicator');
        const step2Indicator = document.getElementById('step2-indicator');
        const step3Indicator = document.getElementById('step3-indicator');
        const step4Indicator = document.getElementById('step4-indicator');
        const step5Indicator = document.getElementById('step5-indicator');
        
        const barcodeTabBtn = document.getElementById('barcode-tab-btn');
        const qrTabBtn = document.getElementById('qr-tab-btn');
        const barcodeTab = document.getElementById('barcode-tab');
        const qrTab = document.getElementById('qr-tab');
        const startScanBtn = document.getElementById('start-scan');
        const stopScanBtn = document.getElementById('stop-scan');
        const manualBarcodeBtn = document.getElementById('manual-barcode');
        const scannerVideo = document.getElementById('scanner-video');
        const qrVideo = document.getElementById('qr-video');
        const scannerResult = document.getElementById('scanner-result');
        const qrResult = document.getElementById('qr-result');
        const scannedBarcodeInput = document.getElementById('scanned-barcode');
        
        const customerSignatureCanvas = document.getElementById('customer-signature');
        const agentSignatureCanvas = document.getElementById('agent-signature');
        const clearCustomerSigBtn = document.getElementById('clear-customer-sig');
        const clearAgentSigBtn = document.getElementById('clear-agent-sig');
        
        const cameraTabBtn = document.getElementById('camera-tab-btn');
        const uploadTabBtn = document.getElementById('upload-tab-btn');
        const cameraTab = document.getElementById('camera-tab');
        const uploadTab = document.getElementById('upload-tab');
        const cameraVideo = document.getElementById('camera-video');
        const capturedImage = document.getElementById('captured-image');
        const takePhotoBtn = document.getElementById('take-photo');
        const retakePhotoBtn = document.getElementById('retake-photo');
        const addCapturedPhotoBtn = document.getElementById('add-captured-photo');
        const capturedImagesGrid = document.getElementById('captured-images-grid');
        const addCaptureBtn = document.getElementById('add-capture-btn');
        
        const imageUpload = document.getElementById('image-upload');
        const uploadedImagesGrid = document.getElementById('uploaded-images-grid');
        const addUploadBtn = document.getElementById('add-upload-btn');
        
        const captureLocationBtn = document.getElementById('capture-location');
        const refreshLocationBtn = document.getElementById('refresh-location');
        const latitudeSpan = document.getElementById('latitude');
        const longitudeSpan = document.getElementById('longitude');
        const accuracySpan = document.getElementById('accuracy');
        const locationStatusSpan = document.getElementById('location-status');
        const locationTimestampSpan = document.getElementById('location-timestamp');
        
        const generateReceiptBtn = document.getElementById('generate-receipt');
        const toast = document.getElementById('toast');
        
        const nextToScanBtn = document.getElementById('next-to-scan');
        const backToDetailsBtn = document.getElementById('back-to-details');
        const nextToSignatureBtn = document.getElementById('next-to-signature');
        const backToScanBtn = document.getElementById('back-to-scan');
        const nextToPhotoBtn = document.getElementById('next-to-photo');
        const backToSignatureBtn = document.getElementById('back-to-signature');
        const nextToRatingBtn = document.getElementById('next-to-rating');
        const backToPhotoBtn = document.getElementById('back-to-photo');
        
        function initApp() {
            setupEventListeners();
            checkGeolocationSupport();
        }
        
        function setupEventListeners() {
            loginBtn.addEventListener('click', handleLogin);
            logoutBtn.addEventListener('click', handleLogout);
            
            nextToScanBtn.addEventListener('click', () => navigateToStep(2));
            backToDetailsBtn.addEventListener('click', () => navigateToStep(1));
            nextToSignatureBtn.addEventListener('click', () => navigateToStep(3));
            backToScanBtn.addEventListener('click', () => navigateToStep(2));
            nextToPhotoBtn.addEventListener('click', () => navigateToStep(4));
            backToSignatureBtn.addEventListener('click', () => navigateToStep(3));
            nextToRatingBtn.addEventListener('click', () => navigateToStep(5));
            backToPhotoBtn.addEventListener('click', () => navigateToStep(4));
            
            barcodeTabBtn.addEventListener('click', () => switchScanMode('barcode'));
            qrTabBtn.addEventListener('click', () => switchScanMode('qr'));
            startScanBtn.addEventListener('click', startBarcodeScanner);
            stopScanBtn.addEventListener('click', stopBarcodeScanner);
            manualBarcodeBtn.addEventListener('click', promptManualBarcode);
            
            clearCustomerSigBtn.addEventListener('click', () => clearSignature('customer'));
            clearAgentSigBtn.addEventListener('click', () => clearSignature('agent'));
            
            cameraTabBtn.addEventListener('click', () => switchTab('camera'));
            uploadTabBtn.addEventListener('click', () => switchTab('upload'));
            takePhotoBtn.addEventListener('click', takePhoto);
            retakePhotoBtn.addEventListener('click', retakePhoto);
            addCapturedPhotoBtn.addEventListener('click', addCapturedPhotoToGrid);
            addCaptureBtn.addEventListener('click', () => {
                capturedImage.style.display = 'none';
                cameraVideo.style.display = 'block';
                takePhotoBtn.classList.remove('hidden');
                retakePhotoBtn.classList.add('hidden');
                addCapturedPhotoBtn.classList.add('hidden');
            });
            
            imageUpload.addEventListener('change', handleImageUpload);
            addUploadBtn.addEventListener('click', () => imageUpload.click());
            
            captureLocationBtn.addEventListener('click', captureCurrentLocation);
            refreshLocationBtn.addEventListener('click', refreshLocation);
            
            generateReceiptBtn.addEventListener('click', generateReceipt);
            
            window.addEventListener('resize', resizeSignatureCanvases);
        }
        
        function handleLogin() {
            const agentId = document.getElementById('agent-id').value.trim();
            const agentPin = document.getElementById('agent-pin').value.trim();
            
            if (!agentId || !agentPin) {
                showToast('Please enter both Agent ID and PIN', 'error');
                return;
            }
            
            loginBtn.disabled = true;
            loginBtnText.textContent = 'Authenticating...';
            loginSpinner.classList.remove('hidden');
            
            setTimeout(() => {
                if (agentId === 'demo' && agentPin === '1234') {
                    agentSession = { id: agentId, name: 'Demo Agent', timestamp: new Date() };
                    loginScreen.classList.add('hidden');
                    appContainer.classList.remove('hidden');
                    showToast('Login successful', 'success');
                    startLocationTracking();
                } else {
                    showToast('Invalid Agent ID or PIN', 'error');
                }
                
                loginBtn.disabled = false;
                loginBtnText.textContent = 'Login';
                loginSpinner.classList.add('hidden');
            }, 1500);
        }
        
        function handleLogout() {
            stopCamera();
            stopBarcodeScanner();
            stopLocationTracking();
            agentSession = null;
            resetForm();
            appContainer.classList.add('hidden');
            loginScreen.classList.remove('hidden');
            document.getElementById('agent-id').value = '';
            document.getElementById('agent-pin').value = '';
            showToast('Logged out successfully', 'success');
        }
        
        function navigateToStep(stepNumber) {
            if (!validateCurrentStep(currentStep)) return;
            
            step1.classList.add('hidden');
            step2.classList.add('hidden');
            step3.classList.add('hidden');
            step4.classList.add('hidden');
            step5.classList.add('hidden');
            
            step1Indicator.classList.remove('active-step', 'completed-step');
            step2Indicator.classList.remove('active-step', 'completed-step');
            step3Indicator.classList.remove('active-step', 'completed-step');
            step4Indicator.classList.remove('active-step', 'completed-step');
            step5Indicator.classList.remove('active-step', 'completed-step');
            
            switch(stepNumber) {
                case 1:
                    step1.classList.remove('hidden');
                    step1Indicator.classList.add('active-step');
                    break;
                case 2:
                    step2.classList.remove('hidden');
                    step1Indicator.classList.add('completed-step');
                    step2Indicator.classList.add('active-step');
                    break;
                case 3:
                    step3.classList.remove('hidden');
                    step1Indicator.classList.add('completed-step');
                    step2Indicator.classList.add('completed-step');
                    step3Indicator.classList.add('active-step');
                    initSignaturePads();
                    break;
                case 4:
                    step4.classList.remove('hidden');
                    step1Indicator.classList.add('completed-step');
                    step2Indicator.classList.add('completed-step');
                    step3Indicator.classList.add('completed-step');
                    step4Indicator.classList.add('active-step');
                    if (cameraTab.classList.contains('active')) startCamera();
                    break;
                case 5:
                    step5.classList.remove('hidden');
                    step1Indicator.classList.add('completed-step');
                    step2Indicator.classList.add('completed-step');
                    step3Indicator.classList.add('completed-step');
                    step4Indicator.classList.add('completed-step');
                    step5Indicator.classList.add('active-step');
                    stopCamera();
                    break;
            }
            
            currentStep = stepNumber;
            window.scrollTo(0, 0);
        }
        
        function validateCurrentStep(step) {
            switch(step) {
                case 1: return validateStep1();
                case 2: return validateStep2();
                case 3: return validateStep3();
                case 4: return validateStep4();
                default: return true;
            }
        }
        
        function validateStep1() {
            const customerName = document.getElementById('customer-name').value.trim();
            const deliveryAddress = document.getElementById('delivery-address').value.trim();
            const packageId = document.getElementById('package-id').value.trim();
            const productName = document.getElementById('product-name').value.trim();
            
            if (!customerName || !deliveryAddress || !packageId || !productName) {
                showToast('Please fill in all required fields', 'error');
                return false;
            }
            return true;
        }
        
        function validateStep2() {
            const barcode = scannedBarcodeInput.value.trim();
            if (!barcode) {
                showToast('Please scan or enter the package code', 'error');
                return false;
            }
            return true;
        }
        
        function validateStep3() {
            if (!customerSignaturePad || customerSignaturePad.isEmpty()) {
                showToast('Customer signature is required', 'error');
                return false;
            }
            if (!agentSignaturePad || agentSignaturePad.isEmpty()) {
                showToast('Agent signature is required', 'error');
                return false;
            }
            return true;
        }
        
        function validateStep4() {
            if (capturedImages.length + uploadedImages.length === 0) {
                showToast('At least one product image is required', 'error');
                return false;
            }
            if (!currentLocation) {
                showToast('Please capture the delivery location', 'error');
                return false;
            }
            return true;
        }
        
        function initSignaturePads() {
            // Destroy existing instances if they exist
            if (customerSignaturePad) {
                customerSignaturePad.off();
                customerSignaturePad = null;
            }
            if (agentSignaturePad) {
                agentSignaturePad.off();
                agentSignaturePad = null;
            }

            // Set canvas dimensions explicitly
            const pixelRatio = window.devicePixelRatio || 1;
            
            customerSignatureCanvas.width = customerSignatureCanvas.offsetWidth * pixelRatio;
            customerSignatureCanvas.height = customerSignatureCanvas.offsetHeight * pixelRatio;
            customerSignatureCanvas.getContext('2d').scale(pixelRatio, pixelRatio);
            
            agentSignatureCanvas.width = agentSignatureCanvas.offsetWidth * pixelRatio;
            agentSignatureCanvas.height = agentSignatureCanvas.offsetHeight * pixelRatio;
            agentSignatureCanvas.getContext('2d').scale(pixelRatio, pixelRatio);

            // Initialize signature pads
            customerSignaturePad = new SignaturePad(customerSignatureCanvas, {
                backgroundColor: 'rgb(255, 255, 255)',
                penColor: 'rgb(0, 0, 0)',
                minWidth: 1,
                maxWidth: 2.5
            });

            agentSignaturePad = new SignaturePad(agentSignatureCanvas, {
                backgroundColor: 'rgb(255, 255, 255)',
                penColor: 'rgb(0, 0, 0)',
                minWidth: 1,
                maxWidth: 2.5
            });

            // Prevent scrolling on touch devices
            const preventTouch = (e) => e.preventDefault();
            customerSignatureCanvas.addEventListener('touchstart', preventTouch, { passive: false });
            customerSignatureCanvas.addEventListener('touchmove', preventTouch, { passive: false });
            agentSignatureCanvas.addEventListener('touchstart', preventTouch, { passive: false });
            agentSignatureCanvas.addEventListener('touchmove', preventTouch, { passive: false });
        }
        
        function resizeSignatureCanvases() {
            if (!customerSignaturePad || !agentSignaturePad) return;

            const pixelRatio = window.devicePixelRatio || 1;
            const customerData = customerSignaturePad.toData();
            const agentData = agentSignaturePad.toData();

            customerSignatureCanvas.width = customerSignatureCanvas.offsetWidth * pixelRatio;
            customerSignatureCanvas.height = customerSignatureCanvas.offsetHeight * pixelRatio;
            customerSignatureCanvas.getContext('2d').scale(pixelRatio, pixelRatio);
            customerSignaturePad.fromData(customerData);

            agentSignatureCanvas.width = agentSignatureCanvas.offsetWidth * pixelRatio;
            agentSignatureCanvas.height = agentSignatureCanvas.offsetHeight * pixelRatio;
            agentSignatureCanvas.getContext('2d').scale(pixelRatio, pixelRatio);
            agentSignaturePad.fromData(agentData);
        }
        
        function clearSignature(type) {
            if (type === 'customer' && customerSignaturePad) {
                customerSignaturePad.clear();
            } else if (type === 'agent' && agentSignaturePad) {
                agentSignaturePad.clear();
            }
        }
        
        function switchScanMode(mode) {
            stopBarcodeScanner();
            barcodeTabBtn.classList.remove('active');
            qrTabBtn.classList.remove('active');
            barcodeTab.classList.remove('active');
            qrTab.classList.remove('active');

            if (mode === 'barcode') {
                barcodeTabBtn.classList.add('active');
                barcodeTab.classList.add('active');
                currentScanMode = 'barcode';
            } else {
                qrTabBtn.classList.add('active');
                qrTab.classList.add('active');
                currentScanMode = 'qr';
            }
        }
        
        function startBarcodeScanner() {
            stopBarcodeScanner();

            if (currentScanMode === 'barcode') {
                Quagga.init({
                    inputStream: {
                        name: "Live",
                        type: "LiveStream",
                        target: scannerVideo,
                        constraints: {
                            width: 640,
                            height: 480,
                            facingMode: "environment"
                        },
                    },
                    decoder: {
                        readers: [
                            "ean_reader",
                            "ean_8_reader",
                            "code_128_reader",
                            "code_39_reader",
                            "codabar_reader",
                            "upc_reader",
                            "upc_e_reader"
                        ]
                    },
                    locate: true
                }, function(err) {
                    if (err) {
                        showToast('Failed to initialize barcode scanner', 'error');
                        return;
                    }
                    Quagga.start();
                    barcodeScannerActive = true;
                    startScanBtn.classList.add('hidden');
                    stopScanBtn.classList.remove('hidden');
                    
                    Quagga.onDetected(function(result) {
                        const code = result.codeResult.code;
                        scannedBarcodeInput.value = code;
                        scannerResult.textContent = `Scanned: ${code}`;
                        scannerResult.classList.remove('hidden');
                        setTimeout(stopBarcodeScanner, 1000);
                    });
                });
            } else {
                navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment" }
                }).then(stream => {
                    qrVideo.srcObject = stream;
                    scannerStream = stream;
                    qrScannerActive = true;
                    startScanBtn.classList.add('hidden');
                    stopScanBtn.classList.remove('hidden');

                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    function scanQR() {
                        if (!qrScannerActive) return;

                        canvas.width = qrVideo.videoWidth;
                        canvas.height = qrVideo.videoHeight;
                        ctx.drawImage(qrVideo, 0, 0, canvas.width, canvas.height);
                        
                        try {
                            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                            const code = jsQR(imageData.data, imageData.width, imageData.height);
                            
                            if (code) {
                                scannedBarcodeInput.value = code.data;
                                qrResult.textContent = `Scanned: ${code.data}`;
                                qrResult.classList.remove('hidden');
                                setTimeout(stopBarcodeScanner, 1000);
                                return;
                            }
                        } catch (e) {
                            console.log('QR scan error:', e);
                        }
                        
                        requestAnimationFrame(scanQR);
                    }
                    
                    scanQR();
                }).catch(err => {
                    showToast('Failed to initialize QR scanner', 'error');
                });
            }
        }
        
        function stopBarcodeScanner() {
            if (barcodeScannerActive) {
                Quagga.stop();
                barcodeScannerActive = false;
            }
            if (qrScannerActive) {
                if (scannerStream) {
                    scannerStream.getTracks().forEach(track => track.stop());
                }
                qrScannerActive = false;
            }
            startScanBtn.classList.remove('hidden');
            stopScanBtn.classList.add('hidden');
            scannerResult.classList.add('hidden');
            qrResult.classList.add('hidden');
        }
        
        function promptManualBarcode() {
            const barcode = prompt('Please enter the package code:');
            if (barcode) {
                scannedBarcodeInput.value = barcode;
            }
        }
        
        async function startCamera() {
            try {
                stopCamera();
                cameraStream = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        facingMode: 'environment',
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                });
                cameraVideo.srcObject = cameraStream;
                cameraVideo.style.display = 'block';
                capturedImage.style.display = 'none';
                takePhotoBtn.classList.remove('hidden');
                retakePhotoBtn.classList.add('hidden');
                addCapturedPhotoBtn.classList.add('hidden');
            } catch (err) {
                showToast('Unable to access camera. Please use upload option instead.', 'error');
                switchTab('upload');
            }
        }
        
        function stopCamera() {
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
                cameraStream = null;
            }
        }
        
        function takePhoto() {
            const canvas = document.createElement('canvas');
            canvas.width = cameraVideo.videoWidth;
            canvas.height = cameraVideo.videoHeight;
            canvas.getContext('2d').drawImage(cameraVideo, 0, 0);
            capturedImage.src = canvas.toDataURL('image/jpeg', 0.8);
            capturedImage.style.display = 'block';
            cameraVideo.style.display = 'none';
            takePhotoBtn.classList.add('hidden');
            retakePhotoBtn.classList.remove('hidden');
            addCapturedPhotoBtn.classList.remove('hidden');
        }
        
        function retakePhoto() {
            capturedImage.style.display = 'none';
            cameraVideo.style.display = 'block';
            takePhotoBtn.classList.remove('hidden');
            retakePhotoBtn.classList.add('hidden');
            addCapturedPhotoBtn.classList.add('hidden');
        }
        
        function addCapturedPhotoToGrid() {
            if (!capturedImage.src) return;
            const timestamp = new Date().toISOString();
            capturedImages.push({
                id: `capture-${Date.now()}`,
                src: capturedImage.src,
                timestamp: timestamp
            });
            updateCapturedImagesGrid();
            retakePhoto();
            showToast('Photo added to delivery', 'success');
        }
        
        function updateCapturedImagesGrid() {
            capturedImagesGrid.innerHTML = '';
            capturedImages.forEach((image, index) => {
                const imageCard = document.createElement('div');
                imageCard.className = 'image-card';
                const img = document.createElement('img');
                img.src = image.src;
                img.alt = `Product image ${index + 1}`;
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-btn';
                removeBtn.innerHTML = '×';
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    capturedImages = capturedImages.filter(img => img.id !== image.id);
                    updateCapturedImagesGrid();
                });
                imageCard.appendChild(img);
                imageCard.appendChild(removeBtn);
                capturedImagesGrid.appendChild(imageCard);
            });
            capturedImagesGrid.appendChild(addCaptureBtn);
        }
        
        function handleImageUpload(e) {
            const files = e.target.files;
            if (!files || files.length === 0) return;
            
            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const timestamp = new Date().toISOString();
                    uploadedImages.push({
                        id: `upload-${Date.now()}`,
                        src: event.target.result,
                        filename: file.name,
                        timestamp: timestamp
                    });
                    updateUploadedImagesGrid();
                };
                reader.readAsDataURL(file);
            });
            showToast(`${files.length} image(s) uploaded`, 'success');
        }
        
        function updateUploadedImagesGrid() {
            uploadedImagesGrid.innerHTML = '';
            uploadedImages.forEach((image, index) => {
                const imageCard = document.createElement('div');
                imageCard.className = 'image-card';
                const img = document.createElement('img');
                img.src = image.src;
                img.alt = `Uploaded image ${index + 1}`;
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-btn';
                removeBtn.innerHTML = '×';
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    uploadedImages = uploadedImages.filter(img => img.id !== image.id);
                    updateUploadedImagesGrid();
                });
                imageCard.appendChild(img);
                imageCard.appendChild(removeBtn);
                uploadedImagesGrid.appendChild(imageCard);
            });
            uploadedImagesGrid.appendChild(addUploadBtn);
        }
        
        function switchTab(tab) {
            if (tab === 'camera') {
                cameraTabBtn.classList.add('active');
                uploadTabBtn.classList.remove('active');
                cameraTab.classList.add('active');
                uploadTab.classList.remove('active');
                if (!step4.classList.contains('hidden')) startCamera();
            } else {
                uploadTabBtn.classList.add('active');
                cameraTabBtn.classList.remove('active');
                uploadTab.classList.add('active');
                cameraTab.classList.remove('active');
                stopCamera();
            }
        }
        
        function checkGeolocationSupport() {
            if (!navigator.geolocation) {
                showToast('Geolocation is not supported by your browser', 'error');
                captureLocationBtn.disabled = true;
                refreshLocationBtn.disabled = true;
                locationStatusSpan.textContent = 'Not supported';
                locationStatusSpan.className = 'location-status status-error';
            }
        }
        
        function startLocationTracking() {
            if (locationWatchId) return;
            locationWatchId = navigator.geolocation.watchPosition(
                position => updateLocationInfo(position),
                error => handleLocationError(error),
                { enableHighAccuracy: true, maximumAge: 30000, timeout: 27000 }
            );
        }
        
        function stopLocationTracking() {
            if (locationWatchId) {
                navigator.geolocation.clearWatch(locationWatchId);
                locationWatchId = null;
            }
        }
        
        function captureCurrentLocation() {
            captureLocationBtn.disabled = true;
            captureLocationBtn.innerHTML = '<span class="loading-spinner"></span> Locating...';
            navigator.geolocation.getCurrentPosition(
                position => {
                    updateLocationInfo(position);
                    currentLocation = position;
                    captureLocationBtn.disabled = false;
                    captureLocationBtn.textContent = 'Capture Current Location';
                    showToast('Location captured successfully', 'success');
                },
                error => {
                    handleLocationError(error);
                    captureLocationBtn.disabled = false;
                    captureLocationBtn.textContent = 'Capture Current Location';
                },
                { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
            );
        }
        
        function refreshLocation() {
            if (!currentLocation) {
                captureCurrentLocation();
                return;
            }
            refreshLocationBtn.disabled = true;
            refreshLocationBtn.innerHTML = '<span class="loading-spinner"></span> Refreshing...';
            navigator.geolocation.getCurrentPosition(
                position => {
                    updateLocationInfo(position);
                    currentLocation = position;
                    refreshLocationBtn.disabled = false;
                    refreshLocationBtn.textContent = 'Refresh Location';
                    showToast('Location refreshed', 'success');
                },
                error => {
                    handleLocationError(error);
                    refreshLocationBtn.disabled = false;
                    refreshLocationBtn.textContent = 'Refresh Location';
                },
                { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
            );
        }
        
        function updateLocationInfo(position) {
            const { latitude, longitude, accuracy } = position.coords;
            const timestamp = new Date(position.timestamp).toLocaleString();
            latitudeSpan.textContent = latitude.toFixed(6);
            longitudeSpan.textContent = longitude.toFixed(6);
            accuracySpan.textContent = Math.round(accuracy);
            locationTimestampSpan.textContent = timestamp;
            locationStatusSpan.textContent = 'Location acquired';
            locationStatusSpan.className = 'location-status status-success';
        }
        
        function handleLocationError(error) {
            let errorMessage = '';
            switch(error.code) {
                case error.PERMISSION_DENIED: errorMessage = 'Location access denied by user'; break;
                case error.POSITION_UNAVAILABLE: errorMessage = 'Location information unavailable'; break;
                case error.TIMEOUT: errorMessage = 'Location request timed out'; break;
                case error.UNKNOWN_ERROR: errorMessage = 'Unknown error occurred'; break;
            }
            locationStatusSpan.textContent = errorMessage;
            locationStatusSpan.className = 'location-status status-error';
            showToast(errorMessage, 'error');
        }
        
        function generateReceipt() {
            let rating = 0;
            const ratingInputs = document.querySelectorAll('input[name="rating"]');
            for (const input of ratingInputs) {
                if (input.checked) {
                    rating = input.value;
                    break;
                }
            }
            if (rating === 0) {
                showToast('Please select a rating for the delivery', 'error');
                return;
            }
            
            const originalBtnText = generateReceiptBtn.innerHTML;
            generateReceiptBtn.disabled = true;
            generateReceiptBtn.innerHTML = '<span class="loading-spinner"></span> Generating...';
            
            setTimeout(() => {
                try {
                    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                    doc.setFillColor(0, 153, 51);
                    doc.rect(0, 0, 210, 25, 'F');
                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(18);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Cenz - Proof of Delivery', 105, 15, { align: 'center' });
                    doc.setTextColor(0, 0, 0);
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');

                    const currentDate = new Date();
                    doc.text(`Generated: ${currentDate.toLocaleString()}`, 10, 35);
                    doc.text(`Agent: ${agentSession ? agentSession.id : 'Unknown'}`, 10, 40);

                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Delivery Details', 10, 50);
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    
                    let detailsY = 57;
                    doc.text(`Customer: ${document.getElementById('customer-name').value}`, 10, detailsY);
                    detailsY += 7;
                    doc.text(`Address: ${document.getElementById('delivery-address').value}`, 10, detailsY);
                    detailsY += 7;
                    doc.text(`Package ID: ${document.getElementById('package-id').value}`, 10, detailsY);
                    detailsY += 7;
                    doc.text(`Product: ${document.getElementById('product-name').value}`, 10, detailsY);
                    detailsY += 7;
                    doc.text(`Barcode: ${scannedBarcodeInput.value}`, 10, detailsY);
                    detailsY += 7;
                    
                    const notes = document.getElementById('delivery-notes').value;
                    if (notes) {
                        const splitNotes = doc.splitTextToSize(`Notes: ${notes}`, 180);
                        doc.text(splitNotes, 10, detailsY);
                        detailsY += splitNotes.length * 7;
                    }

                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Delivery Location', 10, detailsY + 5);
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    
                    if (currentLocation) {
                        const { latitude, longitude, accuracy } = currentLocation.coords;
                        doc.text(`Latitude: ${latitude.toFixed(6)}`, 10, detailsY + 12);
                        doc.text(`Longitude: ${longitude.toFixed(6)}`, 10, detailsY + 19);
                        doc.text(`Accuracy: ${Math.round(accuracy)} meters`, 10, detailsY + 26);
                        doc.text(`Timestamp: ${new Date(currentLocation.timestamp).toLocaleString()}`, 10, detailsY + 33);
                        doc.setFillColor(220, 220, 220);
                        doc.rect(120, detailsY + 10, 80, 30, 'F');
                        doc.setTextColor(100, 100, 100);
                        doc.text('Map location would appear here', 160, detailsY + 25, { align: 'center' });
                        doc.setTextColor(0, 0, 0);
                        detailsY += 40;
                    } else {
                        doc.text('Location not captured', 10, detailsY + 12);
                        detailsY += 15;
                    }

                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Signatures', 10, detailsY + 5);
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    
                    if (customerSignaturePad && !customerSignaturePad.isEmpty()) {
                        const signatureImage = customerSignaturePad.toDataURL();
                        doc.text('Customer Signature:', 10, detailsY + 12);
                        doc.addImage(signatureImage, 'PNG', 10, detailsY + 15, 80, 30);
                    }
                    if (agentSignaturePad && !agentSignaturePad.isEmpty()) {
                        const signatureImage = agentSignaturePad.toDataURL();
                        doc.text('Agent Signature:', 110, detailsY + 12);
                        doc.addImage(signatureImage, 'PNG', 110, detailsY + 15, 80, 30);
                    }
                    detailsY += 50;

                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Product Images', 10, detailsY + 5);
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    
                    const allImages = [...capturedImages, ...uploadedImages];
                    if (allImages.length > 0) {
                        let imgX = 10;
                        let imgY = detailsY + 12;
                        const imgWidth = 90;
                        const imgHeight = 60;
                        
                        allImages.forEach((image, index) => {
                            doc.addImage(image.src, 'JPEG', imgX, imgY, imgWidth, imgHeight);
                            const timestamp = new Date(image.timestamp).toLocaleTimeString();
                            doc.text(`Image ${index + 1} (${timestamp})`, imgX + imgWidth/2, imgY + imgHeight + 5, { align: 'center' });
                            if (index % 2 === 0) {
                                imgX = 110;
                            } else {
                                imgX = 10;
                                imgY += imgHeight + 15;
                            }
                            if (imgY + imgHeight > 270 && index < allImages.length - 1) {
                                doc.addPage();
                                imgY = 20;
                            }
                        });
                        detailsY = imgY + imgHeight + 10;
                    } else {
                        doc.text('No product images captured', 10, detailsY + 12);
                        detailsY += 15;
                    }

                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Delivery Rating', 10, detailsY + 5);
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    
                    const starX = 10;
                    const starY = detailsY + 12;
                    const starSize = 3;
                    const starSpacing = 5;
                    
                    for (let i = 0; i < 5; i++) {
                        doc.setFillColor(i < rating ? 255 : 220, i < rating ? 199 : 220, i < rating ? 0 : 220);
                        doc.circle(starX + i * starSpacing, starY, starSize / 2, 'F');
                    }
                    doc.text(`${rating} out of 5 stars`, starX + 30, starY + 1);
                    
                    const comments = document.getElementById('delivery-comments').value;
                    if (comments) {
                        const splitComments = doc.splitTextToSize(`Comments: ${comments}`, 180);
                        doc.text(splitComments, 10, starY + 10);
                    }

                    doc.setFontSize(8);
                    doc.setTextColor(100, 100, 100);
                    doc.text('This document serves as proof of delivery. Thank you for choosing Cenz.', 105, 290, { align: 'center' });

                    const filename = `Cenz_Delivery_${document.getElementById('package-id').value}_${currentDate.toISOString().slice(0,10)}.pdf`;
                    if (/Mobi|Android/i.test(navigator.userAgent)) {
                        const pdfData = doc.output('datauristring');
                        const newWindow = window.open();
                        newWindow.document.write(`<iframe width="100%" height="100%" src="${pdfData}"></iframe>`);
                    } else {
                        doc.save(filename);
                    }
                    
                    showToast('Delivery receipt generated successfully!', 'success');
                    resetForm();
                } catch (error) {
                    console.error('Error generating PDF:', error);
                    showToast('Error generating receipt. Please check console for details.', 'error');
                } finally {
                    generateReceiptBtn.disabled = false;
                    generateReceiptBtn.innerHTML = originalBtnText;
                }
            }, 100);
        }
        
        function resetForm() {
            document.getElementById('customer-name').value = '';
            document.getElementById('delivery-address').value = '';
            document.getElementById('package-id').value = '';
            document.getElementById('product-name').value = '';
            document.getElementById('delivery-notes').value = '';
            document.getElementById('delivery-comments').value = '';
            document.getElementById('scanned-barcode').value = '';
            document.getElementById('image-upload').value = '';
            
            if (customerSignaturePad) customerSignaturePad.clear();
            if (agentSignaturePad) agentSignaturePad.clear();
            
            const ratingInputs = document.querySelectorAll('input[name="rating"]');
            for (const input of ratingInputs) input.checked = false;
            
            capturedImages = [];
            uploadedImages = [];
            updateCapturedImagesGrid();
            updateUploadedImagesGrid();
            
            currentLocation = null;
            latitudeSpan.textContent = 'Not captured';
            longitudeSpan.textContent = 'Not captured';
            accuracySpan.textContent = 'Not available';
            locationStatusSpan.textContent = 'Waiting for location';
            locationStatusSpan.className = 'location-status status-pending';
            locationTimestampSpan.textContent = 'Never';
            
            navigateToStep(1);
            switchTab('camera');
            stopCamera();
        }
        
        function showToast(message, type = 'info') {
            toast.textContent = message;
            toast.className = `toast show ${type}`;
            setTimeout(() => toast.className = 'toast', 3000);
        }
        
        document.addEventListener('DOMContentLoaded', initApp);
    