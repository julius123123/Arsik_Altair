import { useState, useRef, useEffect } from 'react';
import BottomNav from '../components/BottomNav';
import './AddData.css';

function AddData() {
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [humanLib, setHumanLib] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  const [patientId] = useState('patient_001');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });

  // Initialize Human library
  useEffect(() => {
    const initHuman = async () => {
      try {
        const Human = (await import('@vladmandic/human')).default;
        const config = {
          backend: 'webgl',
          modelBasePath: 'https://cdn.jsdelivr.net/npm/@vladmandic/human/models/',
          face: {
            enabled: true,
            detector: { enabled: true, maxDetected: 1 },
            description: { enabled: true },
            mesh: { enabled: false },
            iris: { enabled: false },
            emotion: { enabled: false }
          },
          body: { enabled: false },
          hand: { enabled: false }
        };
        
        const human = new Human(config);
        await human.load();
        await human.warmup();
        setHumanLib(human);
        console.log('✅ Human library loaded');
      } catch (error) {
        console.error('Error loading Human:', error);
        alert('Error loading face detection. Please refresh.');
      }
    };
    initHuman();
  }, []);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar');
      return;
    }

    setIsProcessing(true);

    try {
      // Read file as data URL
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target.result;
        
        // Create image element to load the file
        const img = new Image();
        img.onload = async () => {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');

          // Set canvas size to match image
          canvas.width = img.width;
          canvas.height = img.height;

          // Draw image to canvas
          ctx.drawImage(img, 0, 0);

          // Detect face using Human
          const result = await humanLib.detect(canvas);
          
          if (result.face && result.face.length > 0) {
            const face = result.face[0];
            const box = face.box;
            const descriptor = face.embedding;

            if (!descriptor || descriptor.length === 0) {
              alert('Tidak dapat mengekstrak fitur wajah. Coba gambar lain.');
              setIsProcessing(false);
              return;
            }

            // Draw box on detected face
            ctx.strokeStyle = '#44ff44';
            ctx.lineWidth = 3;
            ctx.strokeRect(box[0], box[1], box[2], box[3]);

            // Convert canvas to base64 image
            const processedImageData = canvas.toDataURL('image/jpeg', 0.8);
            
            setCapturedImage(processedImageData);
            
            console.log('✅ Face detected with descriptor:', descriptor.length, 'features');
          } else {
            alert('Tidak ada wajah terdeteksi. Pastikan wajah terlihat jelas di foto.');
          }
          
          setIsProcessing(false);
        };
        
        img.onerror = () => {
          alert('Error memuat gambar');
          setIsProcessing(false);
        };
        
        img.src = imageData;
      };
      
      reader.onerror = () => {
        alert('Error membaca file');
        setIsProcessing(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error memproses file. Coba lagi.');
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Mohon masukkan nama');
      return;
    }
    if (!relation.trim()) {
      alert('Mohon masukkan hubungan');
      return;
    }
    if (!capturedImage) {
      alert('Mohon ambil foto terlebih dahulu');
      return;
    }

    setIsProcessing(true);

    try {
      // Re-detect face to get descriptor
      const canvas = canvasRef.current;
      const result = await humanLib.detect(canvas);
      
      if (!result.face || result.face.length === 0) {
        alert('Error: Tidak dapat memproses wajah');
        setIsProcessing(false);
        return;
      }

      const descriptor = result.face[0].embedding;

      // Send to backend to approve directly (caregiver adds it)
      const response = await fetch('http://localhost:3001/api/approved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          relation: relation.trim(),
          descriptor: Array.from(descriptor),
          imageData: capturedImage,
          patientId: patientId
        })
      });

      if (response.ok) {
        setSaveStatus('✅ Berhasil menyimpan!');
        setTimeout(() => {
          setName('');
          setRelation('');
          setCapturedImage(null);
          setSaveStatus('');
        }, 2000);
      } else {
        setSaveStatus('❌ Gagal menyimpan');
      }
    } catch (error) {
      console.error('Error saving:', error);
      setSaveStatus('❌ Terjadi kesalahan');
    }

    setIsProcessing(false);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  return (
    <div className="page">
      <div className="header safe-top">
        <div className="header-time">{currentTime}</div>
        <div className="header-title">ARSIK Caregiver Portal</div>
      </div>

      <div className="content">
        <h2 className="page-title">➕ Tambah Wajah</h2>
        <p className="subtitle">Daftarkan wajah orang yang dikenal pasien</p>

        {saveStatus && (
          <div className={`alert ${saveStatus.includes('✅') ? 'alert-success' : 'alert-error'}`}>
            {saveStatus}
          </div>
        )}

        <form className="add-data-form">
          <div className="form-group">
            <label className="form-label">Nama</label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Budi"
              disabled={isProcessing}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Hubungan</label>
            <input
              type="text"
              className="input"
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              placeholder="Contoh: Anak"
              disabled={isProcessing}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Foto Wajah</label>
            
            <div className="camera-container">
              {!capturedImage && (
                <div className="file-upload-area">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={!humanLib || isProcessing}
                    className="file-input"
                    id="fileInput"
                  />
                  <label htmlFor="fileInput" className="file-label">
                    {isProcessing ? (
                      <div className="upload-content">
                        <span className="upload-icon">⏳</span>
                        <span className="upload-text">Memproses...</span>
                      </div>
                    ) : (
                      <div className="upload-content">
                        <span className="upload-icon">📁</span>
                        <span className="upload-text">Pilih Foto dari Galeri</span>
                        <span className="upload-hint">JPG, PNG, atau JPEG</span>
                      </div>
                    )}
                  </label>
                </div>
              )}

              {capturedImage && (
                <div className="captured-view">
                  <img src={capturedImage} alt="Captured" className="captured-image" />
                  <button
                    type="button"
                    onClick={retakePhoto}
                    className="btn btn-secondary btn-block"
                    disabled={isProcessing}
                  >
                    🔄 Pilih Foto Lain
                  </button>
                </div>
              )}

              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="btn btn-primary btn-block"
            disabled={!name || !relation || !capturedImage || isProcessing}
          >
            {isProcessing ? '⏳ Menyimpan...' : '💾 Simpan Data'}
          </button>
        </form>

        <div className="info-box" style={{ marginBottom: '100px' }}>
          <h4>ℹ️ Petunjuk:</h4>
          <ul>
            <li>Pilih foto dengan wajah yang terlihat jelas</li>
            <li>Pastikan pencahayaan cukup dan wajah menghadap depan</li>
            <li>Sistem akan otomatis mengenali wajah di masa depan</li>
            <li>Satu foto dapat mendeteksi satu wajah</li>
          </ul>
        </div>
      </div>

      <BottomNav activeTab="add-data" />
    </div>
  );
}

export default AddData;
