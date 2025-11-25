import { useState, useEffect } from 'react';
import { getPendingRequests, approveRequest, rejectRequest } from '../utils/caregiverApi';
import './ApprovalDashboard.css';

const ApprovalDashboard = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [editedRelation, setEditedRelation] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadPendingRequests();
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(loadPendingRequests, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadPendingRequests = async () => {
    const { success, pending } = await getPendingRequests();
    if (success) {
      setPendingRequests(pending);
    }
    setLoading(false);
  };

  const handleApprove = async (request) => {
    const confirmed = window.confirm(
      `Approve ${editedName || request.name} as ${editedRelation || request.relation}?`
    );
    
    if (!confirmed) return;

    const result = await approveRequest(request.id, {
      name: editedName || request.name,
      relation: editedRelation || request.relation,
    });

    if (result.success) {
      alert(`✅ Approved: ${result.person.name} (${result.person.relation})`);
      setSelectedRequest(null);
      setEditedName('');
      setEditedRelation('');
      loadPendingRequests();
    } else {
      alert(`❌ Error: ${result.error}`);
    }
  };

  const handleReject = async (request) => {
    const reason = rejectReason || 'Unknown person / Security concern';
    const confirmed = window.confirm(
      `Reject ${request.name}?\nReason: ${reason}`
    );
    
    if (!confirmed) return;

    const result = await rejectRequest(request.id, reason);

    if (result.success) {
      alert(`❌ Rejected: ${request.name}`);
      setSelectedRequest(null);
      setRejectReason('');
      loadPendingRequests();
    } else {
      alert(`❌ Error: ${result.error}`);
    }
  };

  const selectRequest = (request) => {
    setSelectedRequest(request);
    setEditedName(request.name);
    setEditedRelation(request.relation);
    setRejectReason('');
  };

  if (loading) {
    return (
      <div className="approval-dashboard">
        <div className="loading">Loading pending requests...</div>
      </div>
    );
  }

  return (
    <div className="approval-dashboard">
      <div className="dashboard-header">
        <h1>🛡️ Caregiver Approval Dashboard</h1>
        <p>Review and approve new people for the patient</p>
        <div className="stats">
          <span className="stat-badge">
            {pendingRequests.length} Pending
          </span>
        </div>
      </div>

      {pendingRequests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <h3>No Pending Requests</h3>
          <p>All face recognition requests have been processed</p>
        </div>
      ) : (
        <div className="requests-container">
          <div className="requests-grid">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className={`request-card ${selectedRequest?.id === request.id ? 'selected' : ''}`}
                onClick={() => selectRequest(request)}
              >
                <img
                  src={request.imageData}
                  alt={request.name}
                  className="face-image"
                />
                <div className="request-info">
                  <h3>{request.name}</h3>
                  <p className="relation">{request.relation}</p>
                  <p className="timestamp">
                    {new Date(request.timestamp).toLocaleString()}
                  </p>
                  <p className="patient-id">Patient: {request.patientId}</p>
                </div>
                <div className="badge-pending">PENDING</div>
              </div>
            ))}
          </div>

          {selectedRequest && (
            <div className="approval-panel">
              <h2>Review Request</h2>
              <div className="panel-content">
                <img
                  src={selectedRequest.imageData}
                  alt={selectedRequest.name}
                  className="large-face-image"
                />
                
                <div className="form-group">
                  <label>Name:</label>
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    placeholder="Edit name if needed"
                  />
                </div>

                <div className="form-group">
                  <label>Relation:</label>
                  <input
                    type="text"
                    value={editedRelation}
                    onChange={(e) => setEditedRelation(e.target.value)}
                    placeholder="Edit relation if needed"
                  />
                </div>

                <div className="action-buttons">
                  <button
                    onClick={() => handleApprove(selectedRequest)}
                    className="btn btn-approve"
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>

                <div className="reject-section">
                  <h3>Or Reject</h3>
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Reason for rejection (optional)"
                  />
                  <button
                    onClick={() => handleReject(selectedRequest)}
                    className="btn btn-reject"
                  >
                    ❌ Reject Request
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ApprovalDashboard;
