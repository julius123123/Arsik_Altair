import { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
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

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL), // Better for distance detection
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
        console.log('Face detection models loaded (SSD MobileNet V1)');
      } catch (error) {
        console.error('Error loading models:', error);
        alert('Error loading face detection models. Please check the console.');
      }
    };
    loadModels();
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

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
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
    if (!isDetecting || !videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState === 4) {
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (canvas) {
        const displaySize = { width: video.videoWidth, height: video.videoHeight };
        faceapi.matchDimensions(canvas, displaySize);
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        const currentFaces = [];
        
        // Reset matched faces for current frame
        matchedFacesRef.current.clear();

        resizedDetections.forEach(async (detection, index) => {
          let bestMatch = findBestMatch(detection.descriptor, index);
          
          // If no match found, try matching against uploaded faces (without descriptors)
          if (!bestMatch) {
            const uploadedMatch = await tryMatchUploadedFaces(detection.descriptor);
            if (uploadedMatch) {
              bestMatch = uploadedMatch;
            }
          }
          
          const box = detection.detection.box;
          let label = 'Unknown';
          let color = '#ff4444';

          if (bestMatch) {
            label = `${bestMatch.name}\n(${bestMatch.relation})`;
            color = '#44ff44';
            updateLastSeen(bestMatch.id);
            
            // Announce detected person via TTS (only once per detection session)
            if (ttsService.current) {
              ttsService.current.announceDetectedPerson(bestMatch.name, bestMatch.relation);
            }
          } else {
            // Unknown face detected
            if (!pendingFace) {
              capturePendingFace(detection, box);
            }
          }

          currentFaces.push({ label, box, isKnown: !!bestMatch });

          // Draw box
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.strokeRect(box.x, box.y, box.width, box.height);

          // Draw label background
          ctx.fillStyle = color;
          const lines = label.split('\n');
          const lineHeight = 25;
          const padding = 5;
          const textWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
          
          ctx.fillRect(
            box.x,
            box.y - (lineHeight * lines.length) - padding * 2,
            textWidth + padding * 2,
            (lineHeight * lines.length) + padding * 2
          );

          // Draw label text
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 20px Arial';
          lines.forEach((line, i) => {
            ctx.fillText(line, box.x + padding, box.y - (lineHeight * (lines.length - i - 1)) - padding);
          });
        });

        setDetectedFaces(currentFaces);
      }
    }

    detectionInterval.current = setTimeout(detectFaces, 300); // Detect every 300ms
  };

  const findBestMatch = (descriptor, faceIndex) => {
    if (knownFaces.length === 0) return null;

    let bestMatch = null;
    let minDistance = 0.55; // Slightly stricter threshold for better accuracy

    // Filter out faces that have already been matched in this frame
    // Also filter out faces without descriptors (uploaded by caregiver but not yet processed)
    const availableFaces = knownFaces.filter(known => 
      !matchedFacesRef.current.has(known.id) && 
      known.descriptor && 
      known.descriptor.length > 0
    );

    availableFaces.forEach((known) => {
      try {
        const distance = faceapi.euclideanDistance(descriptor, known.descriptor);
        if (distance < minDistance) {
          minDistance = distance;
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

  // Try to match against uploaded faces (without descriptors) by generating descriptor from their images
  const tryMatchUploadedFaces = async (detectedDescriptor) => {
    const uploadedFaces = knownFaces.filter(f => !f.descriptor && f.imageData);
    
    for (const uploadedFace of uploadedFaces) {
      try {
        // Create image element from stored image data
        const img = await faceapi.fetchImage(uploadedFace.imageData);
        
        // Detect face in the uploaded image
        const detection = await faceapi
          .detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
          .withFaceLandmarks()
          .withFaceDescriptor();
        
        if (detection && detection.descriptor) {
          // Calculate similarity
          const distance = faceapi.euclideanDistance(detectedDescriptor, detection.descriptor);
          
          if (distance < 0.6) {
            // Match found! Update the stored face with the new descriptor
            const updatedFace = {
              ...uploadedFace,
              descriptor: Array.from(detection.descriptor)
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
    const canvas = document.createElement('canvas');
    const padding = 20;
    
    canvas.width = box.width + padding * 2;
    canvas.height = box.height + padding * 2;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(
      video,
      box.x - padding,
      box.y - padding,
      box.width + padding * 2,
      box.height + padding * 2,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    const faceData = {
      descriptor: Array.from(detection.descriptor),
      imageData,
    };
    
    // Store in both state and ref
    setPendingFace(faceData);
    pendingFaceRef.current = faceData; // Store in ref for immediate access
    
    console.log('Captured pending face:', faceData);
    console.log('pendingFaceRef.current:', pendingFaceRef.current);

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
          muted
          onLoadedMetadata={() => {
            if (canvasRef.current && videoRef.current) {
              canvasRef.current.width = videoRef.current.videoWidth;
              canvasRef.current.height = videoRef.current.videoHeight;
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
            <img src={pendingFace.imageData} alt="Detected face" />
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
