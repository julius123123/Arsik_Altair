import { useRef, useEffect, useState } from 'react';
import Human from '@vladmandic/human';
import { savePerson, getPeople, updateLastSeen } from '../utils/faceStorage';
import { SpeechListener } from '../utils/speechRecognition';
import { submitForApproval, syncApprovedPeople } from '../utils/apiClient';
import { getTTSService } from '../utils/textToSpeech';
import './FaceRecognition.css';

const FaceRecognition = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [knownFaces, setKnownFaces] = useState([]);
  const [detectedFaces, setDetectedFaces] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [pendingFace, setPendingFace] = useState(null);
  const [transcript, setTranscript] = useState('');
  const speechListener = useRef(null);
  const detectionInterval = useRef(null);
  const pendingFaceRef = useRef(null); // Store pending face in ref for immediate access
  const ttsService = useRef(null); // TTS service for announcing detected faces
  const faceHistoryRef = useRef(new Map()); // Track face recognition history for stability
  const matchedFacesRef = useRef(new Set()); // Track which faces have been matched in current frame
  const humanRef = useRef(null); // Human library instance

  // Initialize Human with MediaPipe BlazeFace
  useEffect(() => {
    const initHuman = async () => {
      try {
        const config = {
          backend: 'webgl',
          modelBasePath: 'https://cdn.jsdelivr.net/npm/@vladmandic/human/models/',
          face: {
            enabled: true,
            detector: { 
              enabled: true,
              rotation: false,
              maxDetected: 10,
              minConfidence: 0.5,
              iouThreshold: 0.3
            },
            mesh: { enabled: false },
            iris: { enabled: false },
            description: { 
              enabled: true
            },
            emotion: { enabled: false },
            antispoof: { enabled: false },
            liveness: { enabled: false }
          },
          body: { enabled: false },
          hand: { enabled: false },
          object: { enabled: false },
          gesture: { enabled: false },
          filter: { enabled: false }
        };
        
        console.log('🔄 Initializing Human library...');
        humanRef.current = new Human(config);
        
        console.log('📦 Loading models...');
        await humanRef.current.load();
        
        console.log('🔥 Warming up...');
        await humanRef.current.warmup();
        
        setModelsLoaded(true);
        console.log('✅ Human library ready!');
        console.log('Backend:', humanRef.current.config.backend);
        console.log('Face detector:', humanRef.current.config.face.detector.enabled);
        console.log('Face description:', humanRef.current.config.face.description.enabled);
      } catch (error) {
        console.error('❌ Error loading Human models:', error);
        console.error('Error details:', error.message);
        alert('Error loading face detection models. Check console for details.');
      }
    };
    initHuman();
  }, []);

  // Load known faces from storage
  useEffect(() => {
    loadKnownFaces();
  }, []);

  // Initialize TTS service
  useEffect(() => {
    ttsService.current = getTTSService();
    return () => {
      if (ttsService.current) {
        ttsService.current.stop();
      }
    };
  }, []);

  // Debug pendingFace state changes
  useEffect(() => {
    console.log('🔍 pendingFace state changed:', {
      hasPendingFace: !!pendingFace,
      hasImageData: !!pendingFace?.imageData,
      imageDataLength: pendingFace?.imageData?.length,
      imageDataPreview: pendingFace?.imageData?.substring(0, 50)
    });
  }, [pendingFace]);

  const loadKnownFaces = () => {
    console.log('loadKnownFaces called');
    const people = getPeople();
    console.log('Loaded people from storage:', people.length, 'people');
    console.log('People data:', people);
    
    const faces = people.map(person => ({
      ...person,
      descriptor: person.descriptor ? new Float32Array(person.descriptor) : null,
    }));
    setKnownFaces(faces);
    console.log('knownFaces updated with', faces.length, 'faces');
    
    // Log faces without descriptors (uploaded by caregiver)
    const facesWithoutDescriptors = faces.filter(f => !f.descriptor);
    if (facesWithoutDescriptors.length > 0) {
      console.log(`Found ${facesWithoutDescriptors.length} faces without descriptors (will generate on detection):`, 
        facesWithoutDescriptors.map(f => f.name));
    }
  };

  // Start camera with optimized settings for mobile
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user' // Use front camera by default
        },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please check permissions.');
    }
  };

  // Start face detection
  const startDetection = () => {
    if (!modelsLoaded) {
      alert('Models are still loading. Please wait.');
      return;
    }

    setIsDetecting(true);
    detectFaces();
  };

  const stopDetection = () => {
    setIsDetecting(false);
    if (detectionInterval.current) {
      clearTimeout(detectionInterval.current);
    }
    if (speechListener.current) {
      speechListener.current.stop();
      setIsListening(false);
    }
    // Reset TTS announcements when detection stops
    if (ttsService.current) {
      ttsService.current.reset();
    }
    // Clear face history
    faceHistoryRef.current.clear();
    matchedFacesRef.current.clear();
  };

  const detectFaces = async () => {
    if (!isDetecting || !videoRef.current || !humanRef.current) {
      console.log('Detection skipped:', { isDetecting, hasVideo: !!videoRef.current, hasHuman: !!humanRef.current });
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState === 4) {
      try {
        // Detect faces using Human (MediaPipe BlazeFace + MobileFaceNet)
        const result = await humanRef.current.detect(video);
        
        console.log('Detection result:', { 
          hasFaces: result.face && result.face.length > 0,
          faceCount: result.face ? result.face.length : 0,
          performance: result.performance
        });
        
        if (canvas && result.face && result.face.length > 0) {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);

        const currentFaces = [];
        
        // Reset matched faces for current frame
        matchedFacesRef.current.clear();

        for (let index = 0; index < result.face.length; index++) {
          const detection = result.face[index];
          
          console.log(`Face ${index}:`, {
            hasBox: !!detection.box,
            hasEmbedding: !!detection.embedding,
            embeddingLength: detection.embedding ? detection.embedding.length : 0,
            confidence: detection.score
          });
          
          // Get bounding box
          const box = detection.box;
          let label = 'Unknown';
          let color = '#ff4444';
          let bestMatch = null;
          
          // Get face descriptor (embedding)
          const descriptor = detection.embedding;
          if (descriptor && descriptor.length > 0) {
            // Try to match with known faces
            bestMatch = findBestMatch(descriptor, index);
            
            // If no match found, try matching against uploaded faces
            if (!bestMatch) {
              const uploadedMatch = await tryMatchUploadedFaces(descriptor);
              if (uploadedMatch) {
                bestMatch = uploadedMatch;
              }
            }
          } else {
            console.warn(`Face ${index} has no embedding, showing as Unknown`);
          }

          if (bestMatch) {
            label = `${bestMatch.name}\n(${bestMatch.relation})`;
            color = '#44ff44';
            updateLastSeen(bestMatch.id);
            
            // Announce detected person via TTS
            if (ttsService.current) {
              ttsService.current.announceDetectedPerson(bestMatch.name, bestMatch.relation);
            }
          } else {
            // Unknown face detected - capture for manual entry
            if (!pendingFace) {
              capturePendingFace(detection, box);
            }
          }

          currentFaces.push({ label, box, isKnown: !!bestMatch });

          // Draw box - box is array [x, y, width, height]
          const [boxX, boxY, boxWidth, boxHeight] = box;
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

          // Draw label background
          ctx.fillStyle = color;
          const lines = label.split('\n');
          const lineHeight = 25;
          const padding = 5;
          ctx.font = 'bold 20px Arial';
          const textWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
          
          ctx.fillRect(
            boxX,
            boxY - (lineHeight * lines.length) - padding * 2,
            textWidth + padding * 2,
            (lineHeight * lines.length) + padding * 2
          );

          // Draw label text
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 20px Arial';
          lines.forEach((line, i) => {
            ctx.fillText(line, boxX + padding, boxY - (lineHeight * (lines.length - i - 1)) - padding);
          });
        }

        setDetectedFaces(currentFaces);
        } else {
          console.log('No faces detected or canvas not ready');
        }
      } catch (error) {
        console.error('❌ Error during face detection:', error);
        console.error('Error details:', error.message);
      }
    }

    detectionInterval.current = setTimeout(detectFaces, 500); // Detect every 500ms (optimized for mobile)
  };

  // Calculate cosine similarity between two vectors
  const cosineSimilarity = (a, b) => {
    if (!a || !b || a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  };

  const findBestMatch = (descriptor, faceIndex) => {
    if (knownFaces.length === 0) return null;

    let bestMatch = null;
    let maxSimilarity = 0.6; // Threshold for cosine similarity (0-1, higher is better)

    // Filter out faces that have already been matched in this frame
    const availableFaces = knownFaces.filter(known => 
      !matchedFacesRef.current.has(known.id) && 
      known.descriptor && 
      known.descriptor.length > 0
    );

    availableFaces.forEach((known) => {
      try {
        const similarity = cosineSimilarity(descriptor, known.descriptor);
        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
          bestMatch = known;
        }
      } catch (error) {
        console.warn(`Error comparing with ${known.name}:`, error);
      }
    });

    // Use face history for stability (prevent flickering)
    if (bestMatch) {
      const historyKey = `face_${faceIndex}`;
      const history = faceHistoryRef.current.get(historyKey) || { matches: [], timestamps: [] };
      
      // Add current match to history
      history.matches.push(bestMatch.id);
      history.timestamps.push(Date.now());
      
      // Keep only last 5 detections (1.5 seconds at 300ms intervals)
      if (history.matches.length > 5) {
        history.matches.shift();
        history.timestamps.shift();
      }
      
      faceHistoryRef.current.set(historyKey, history);
      
      // Count occurrences in history
      const matchCounts = {};
      history.matches.forEach(id => {
        matchCounts[id] = (matchCounts[id] || 0) + 1;
      });
      
      // Find most frequent match
      let maxCount = 0;
      let stableMatchId = bestMatch.id;
      Object.entries(matchCounts).forEach(([id, count]) => {
        if (count > maxCount) {
          maxCount = count;
          stableMatchId = id;
        }
      });
      
      // Return stable match (most frequent in recent history)
      const stableMatch = knownFaces.find(f => f.id === stableMatchId);
      if (stableMatch) {
        matchedFacesRef.current.add(stableMatch.id); // Mark as matched
        return stableMatch;
      }
    } else {
      // Clear history if no match found
      const historyKey = `face_${faceIndex}`;
      faceHistoryRef.current.delete(historyKey);
    }

    return bestMatch;
  };

  // Try to match against uploaded faces by generating descriptor from their images
  const tryMatchUploadedFaces = async (detectedDescriptor) => {
    const uploadedFaces = knownFaces.filter(f => !f.descriptor && f.imageData);
    
    for (const uploadedFace of uploadedFaces) {
      try {
        // Create image element from stored image data
        const img = new Image();
        img.src = uploadedFace.imageData;
        await new Promise((resolve) => { img.onload = resolve; });
        
        // Detect face in the uploaded image using Human
        const result = await humanRef.current.detect(img);
        
        if (result.face && result.face.length > 0 && result.face[0].embedding) {
          const descriptor = result.face[0].embedding;
          
          // Calculate similarity
          const similarity = cosineSimilarity(detectedDescriptor, descriptor);
          
          if (similarity > 0.6) {
            // Match found! Update the stored face with the new descriptor
            const updatedFace = {
              ...uploadedFace,
              descriptor: Array.from(descriptor)
            };
            
            // Update in localStorage
            const people = getPeople();
            const index = people.findIndex(p => p.id === uploadedFace.id);
            if (index !== -1) {
              people[index] = updatedFace;
              localStorage.setItem('dementia_app_faces', JSON.stringify(people));
              console.log(`✅ Generated descriptor for uploaded face: ${uploadedFace.name}`);
            }
            
            // Reload faces to include the new descriptor
            loadKnownFaces();
            
            return uploadedFace; // Return the match
          }
        }
      } catch (error) {
        console.warn(`Failed to process uploaded face ${uploadedFace.name}:`, error);
      }
    }
    
    return null;
  };

  const capturePendingFace = (detection, box) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || !box) {
      console.error('❌ Cannot capture face: missing elements', { 
        hasVideo: !!video, 
        hasCanvas: !!canvas,
        hasBox: !!box 
      });
      return;
    }

    try {
      const padding = 20;
      
      // Human library returns box as array: [x, y, width, height]
      const boxX = box[0];
      const boxY = box[1];
      const boxWidth = box[2];
      const boxHeight = box[3];
      
      // Calculate capture bounds - ensure all values are integers
      const x = Math.max(0, Math.floor(boxX - padding));
      const y = Math.max(0, Math.floor(boxY - padding));
      const width = Math.floor(Math.min(
        boxWidth + padding * 2, 
        canvas.width - x
      ));
      const height = Math.floor(Math.min(
        boxHeight + padding * 2, 
        canvas.height - y
      ));
      
      // Validate dimensions
      if (width <= 0 || height <= 0 || !Number.isInteger(width) || !Number.isInteger(height)) {
        console.error('❌ Invalid capture dimensions:', { 
          x, y, width, height,
          isWidthInteger: Number.isInteger(width),
          isHeightInteger: Number.isInteger(height)
        });
        return;
      }
      
      console.log('📸 Capturing face with bounds:', {
        canvasSize: { width: canvas.width, height: canvas.height },
        videoSize: { width: video.videoWidth, height: video.videoHeight },
        boxOriginal: { x: boxX, y: boxY, width: boxWidth, height: boxHeight },
        captureArea: { x, y, width, height }
      });
      
      // Create a temporary canvas for the face crop
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d');
      
      // Check video readyState before drawing
      console.log('Video state:', {
        readyState: video.readyState,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        paused: video.paused,
        ended: video.ended
      });
      
      // Draw the face region from the video
      tempCtx.drawImage(
        video,
        x, y, width, height,  // Source rectangle from video
        0, 0, width, height   // Destination on temp canvas
      );

      // Check what was actually drawn
      const imageDataObj = tempCtx.getImageData(0, 0, width, height);
      const hasNonZeroPixels = imageDataObj.data.some(byte => byte !== 0);
      
      console.log('Canvas state after drawing:', {
        hasNonZeroPixels,
        totalPixels: imageDataObj.data.length,
        firstFewBytes: Array.from(imageDataObj.data.slice(0, 20))
      });

      // Convert to data URL
      const imageData = tempCanvas.toDataURL('image/jpeg', 0.9);
      
      console.log('✅ Image data generated:', {
        length: imageData.length,
        startsWithData: imageData.startsWith('data:image/jpeg'),
        preview: imageData.substring(0, 100)
      });
      
      // Validate the image data
      if (imageData === 'data:,' || imageData.length < 100) {
        console.error('❌ Invalid image data generated (too short)', {
          actualData: imageData,
          canvasWidth: tempCanvas.width,
          canvasHeight: tempCanvas.height
        });
        return;
      }
      
      const faceData = {
        descriptor: detection.embedding ? Array.from(detection.embedding) : null,
        imageData,
      };
      
      // Store in both state and ref
      setPendingFace(faceData);
      pendingFaceRef.current = faceData;
      
      console.log('📸 Captured unknown face:', {
        hasDescriptor: !!faceData.descriptor,
        descriptorLength: faceData.descriptor ? faceData.descriptor.length : 0,
        imageSize: imageData.length
      });
    } catch (error) {
      console.error('❌ Error capturing face image:', error);
    }

    // Try to start listening, but don't block if it fails
    try {
      startListening();
    } catch (error) {
      console.error('Could not start speech recognition:', error);
      setTranscript('Please use manual entry below');
    }
  };

  const startListening = () => {
    // console.log('startListening() called');
    
    if (!speechListener.current) {
      console.log('Creating new SpeechListener...');
      speechListener.current = new SpeechListener();
    }

    const success = speechListener.current.start((result) => {
      console.log('Speech result received:', result);
      console.log('pendingFaceRef.current exists?', !!pendingFaceRef.current);
      console.log('pendingFaceRef.current data:', pendingFaceRef.current);
      
      setTranscript(`Detected: ${result.name} (${result.relation})`);
      
      // Use ref instead of state to avoid closure issues
      if (pendingFaceRef.current) {
        console.log('Calling savePendingPerson with:', result.name, result.relation);
        savePendingPerson(result.name, result.relation);
      } else {
        console.warn('No pendingFaceRef.current! Cannot save.');
      }
    });

    if (success) {
    //   console.log('Speech recognition started successfully');
      setIsListening(true);
      setTranscript('Minta orang tersebut memperkenalkan diri. Contoh: "Nama saya Budi, anak Anda" (or use manual entry below)');
    } else {
      console.error('Speech recognition failed to start');
      console.log('User Agent:', navigator.userAgent);
      console.log('Platform:', navigator.platform);
      // Don't show alert, just inform user
      setTranscript('Speech recognition not available - please use manual entry below');
    }
  };

  const savePendingPerson = async (name, relation) => {
    console.log('savePendingPerson called with:', name, relation);
    console.log('pendingFaceRef.current in savePendingPerson:', pendingFaceRef.current);
    
    // Use ref instead of state
    if (!pendingFaceRef.current) {
      console.error('No pendingFaceRef.current to save!');
      return;
    }

    // Submit to backend for caregiver approval
    console.log('Submitting to caregiver for approval...');
    setTranscript(`Sending ${name} for caregiver approval...`);
    
    const result = await submitForApproval({
      name,
      relation,
      descriptor: pendingFaceRef.current.descriptor,
      imageData: pendingFaceRef.current.imageData,
    });

    console.log('Approval submission result:', result);

    if (result.success) {
      console.log('Submitted successfully! Awaiting caregiver approval...');
      setPendingFace(null);
      pendingFaceRef.current = null;
      setTranscript(`✅ ${name} submitted! Waiting for caregiver approval...`);
      
      if (speechListener.current) {
        speechListener.current.stop();
        setIsListening(false);
      }

      setTimeout(() => setTranscript(''), 5000);
      
      // Trigger a sync to check for approvals
      setTimeout(() => {
        syncApprovedPeople().then(() => loadKnownFaces());
      }, 2000);
    } else {
      console.error('Failed to submit for approval:', result.error);
      setTranscript(`❌ Failed to submit. Try manual entry.`);
    }
  };

  const handleManualSave = (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value.trim();
    const relation = form.relation.value.trim();

    if (name && relation && (pendingFace || pendingFaceRef.current)) {
      savePendingPerson(name, relation);
      form.reset();
    }
  };

  useEffect(() => {
    startCamera();
    
    // Initial sync of approved people from server
    syncApprovedPeople().then(() => loadKnownFaces());
    
    // Periodic sync every 10 seconds
    const syncInterval = setInterval(() => {
      syncApprovedPeople().then((result) => {
        if (result.success && result.count > 0) {
          console.log(`Auto-synced ${result.count} newly approved people`);
          loadKnownFaces();
        }
      });
    }, 10000);
    
    return () => {
      clearInterval(syncInterval);
      stopDetection();
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (isDetecting) {
      detectFaces();
    }
    return () => {
      if (detectionInterval.current) {
        clearTimeout(detectionInterval.current);
      }
    };
  }, [isDetecting, knownFaces]);

  return (
    <div className="face-recognition">
      <div className="video-container">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onLoadedMetadata={() => {
            if (canvasRef.current && videoRef.current) {
              canvasRef.current.width = videoRef.current.videoWidth;
              canvasRef.current.height = videoRef.current.videoHeight;
              console.log('📹 Video ready:', {
                width: videoRef.current.videoWidth,
                height: videoRef.current.videoHeight,
                readyState: videoRef.current.readyState
              });
            }
          }}
        />
        <canvas ref={canvasRef} className="overlay-canvas" />
      </div>

      <div className="controls">
        <div className="button-group">
          {!isDetecting ? (
            <button onClick={startDetection} className="btn btn-primary" disabled={!modelsLoaded}>
              {modelsLoaded ? 'Start Detection' : 'Loading Models...'}
            </button>
          ) : (
            <button onClick={stopDetection} className="btn btn-danger">
              Stop Detection
            </button>
          )}
        </div>

        {isListening && (
          <div className="listening-indicator">
            <div className="pulse"></div>
            <span>Listening...</span>
          </div>
        )}

        {transcript && (
          <div className="transcript">
            <p>{transcript}</p>
          </div>
        )}

        {pendingFace && (
          <div className="manual-entry">
            <h3>Unknown Person Detected</h3>
            {pendingFace.imageData ? (
              <img 
                src={pendingFace.imageData} 
                alt="Detected face" 
                style={{
                  maxWidth: '200px',
                  maxHeight: '200px',
                  border: '3px solid #ff4444',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  display: 'block'
                }}
                onError={(e) => {
                  console.error('❌ Failed to load face image:', e);
                  console.log('Image src length:', pendingFace.imageData?.length);
                  console.log('Image src preview:', pendingFace.imageData?.substring(0, 100));
                }}
                onLoad={() => {
                  console.log('✅ Face image loaded successfully');
                }}
              />
            ) : (
              <div style={{ 
                width: '200px', 
                height: '200px', 
                border: '3px solid #ff4444',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                backgroundColor: '#f0f0f0'
              }}>
                <p>No image data</p>
              </div>
            )}
            <form onSubmit={handleManualSave}>
              <input
                type="text"
                name="name"
                placeholder="Enter name"
                required
              />
              <input
                type="text"
                name="relation"
                placeholder="Enter relation (e.g., son, friend)"
                required
              />
              <button type="submit" className="btn btn-success">Save Person</button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setPendingFace(null);
                  if (speechListener.current) {
                    speechListener.current.stop();
                    setIsListening(false);
                  }
                }}
              >
                Cancel
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="stats">
        <p>Known People: {knownFaces.length}</p>
        <p>Detected Faces: {detectedFaces.length}</p>
      </div>
    </div>
  );
};

export default FaceRecognition;
