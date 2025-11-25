import { useState } from 'react';
import { uploadFace } from '../utils/caregiverApi';
import './FaceUpload.css';

const FaceUpload = () => {
  const [formData, setFormData] = useState({
    name: '',
    relation: '',
    patientId: '',
    imageFile: null,
    imagePreview: null
  });
  const [isUploading, setIsUploading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size must be less than 10MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          imageFile: file,
          imagePreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.relation || !formData.patientId || !formData.imagePreview) {
      alert('Please fill all fields and upload an image');
      return;
    }

    setIsUploading(true);

    try {
      const result = await uploadFace({
        name: formData.name,
        relation: formData.relation,
        patientId: formData.patientId,
        imageData: formData.imagePreview
      });

      if (result.success) {
        alert(`✅ Face uploaded successfully!\n\n${formData.name} will be recognized by the patient app.`);
        
        // Reset form
        setFormData({
          name: '',
          relation: '',
          patientId: '',
          imageFile: null,
          imagePreview: null
        });
        
        // Reset file input
        const fileInput = document.getElementById('face-image-input');
        if (fileInput) fileInput.value = '';
      } else {
        alert('❌ Failed to upload face: ' + result.error);
      }
    } catch (error) {
      alert('❌ Error uploading face: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setFormData({
      name: '',
      relation: '',
      patientId: '',
      imageFile: null,
      imagePreview: null
    });
    const fileInput = document.getElementById('face-image-input');
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="face-upload">
      <div className="upload-header">
        <h2>📸 Upload Person Face</h2>
        <p className="subtitle">Add a person directly to patient's recognized faces</p>
      </div>

      <div className="upload-container">
        <form onSubmit={handleSubmit} className="upload-form">
          {/* Image Upload Section */}
          <div className="image-upload-section">
            <label className="image-upload-label">
              {formData.imagePreview ? (
                <div className="image-preview">
                  <img src={formData.imagePreview} alt="Preview" />
                  <div className="image-overlay">
                    <span>Click to change</span>
                  </div>
                </div>
              ) : (
                <div className="image-placeholder">
                  <div className="upload-icon">📸</div>
                  <p>Click to upload face photo</p>
                  <small>JPG, PNG, JPEG (max 10MB)</small>
                </div>
              )}
              <input
                id="face-image-input"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {/* Form Fields */}
          <div className="form-fields">
            <div className="form-group">
              <label htmlFor="name">Person Name *</label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Budi Santoso"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="relation">Relation to Patient *</label>
              <select
                id="relation"
                value={formData.relation}
                onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                required
              >
                <option value="">-- Select Relation --</option>
                <option value="Istri">Istri (Wife)</option>
                <option value="Suami">Suami (Husband)</option>
                <option value="Anak">Anak (Child)</option>
                <option value="Cucu">Cucu (Grandchild)</option>
                <option value="Ibu">Ibu (Mother)</option>
                <option value="Ayah">Ayah (Father)</option>
                <option value="Kakak">Kakak (Older Sibling)</option>
                <option value="Adik">Adik (Younger Sibling)</option>
                <option value="Suster">Suster (Nurse)</option>
                <option value="Dokter">Dokter (Doctor)</option>
                <option value="Teman">Teman (Friend)</option>
                <option value="Tetangga">Tetangga (Neighbor)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="patientId">Patient ID *</label>
              <input
                id="patientId"
                type="text"
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                placeholder="e.g., patient_123456789_abc123"
                required
              />
              <small>Get Patient ID from patient app console: localStorage.getItem('arsik_patient_id')</small>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn-upload"
                disabled={isUploading || !formData.imagePreview}
              >
                {isUploading ? '⏳ Uploading...' : '✅ Upload Face'}
              </button>
              <button
                type="button"
                className="btn-clear"
                onClick={handleClear}
                disabled={isUploading}
              >
                Clear
              </button>
            </div>
          </div>
        </form>

        <div className="upload-info">
          <h3>ℹ️ Instructions</h3>
          <ul>
            <li>📷 Upload a clear, front-facing photo of the person</li>
            <li>😊 Face should be clearly visible and well-lit</li>
            <li>👤 Only one person in the photo</li>
            <li>📐 Image should be at least 200x200 pixels</li>
            <li>🆔 Get Patient ID from patient app (press F12 → Console → type: <code>localStorage.getItem('arsik_patient_id')</code>)</li>
            <li>✅ Face will be immediately available for patient recognition</li>
            <li>🔄 No approval needed - directly added to database</li>
          </ul>

          <div className="info-box">
            <strong>⚠️ Note:</strong> Face descriptor will be generated automatically by the patient app on first detection.
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceUpload;
