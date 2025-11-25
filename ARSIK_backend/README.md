# ARSIK Backend Server

Backend API for managing face recognition approvals between patient and caregiver apps.

## Setup

```bash
npm install
npm start
```

Server runs on `http://localhost:3001`

## API Endpoints

### Patient App (ARSIK)
- `POST /api/pending` - Submit new person for approval
- `GET /api/approved/:patientId` - Get approved people
- `GET /api/pending/:id/status` - Check approval status

### Caregiver App (ARSIK_suster)
- `GET /api/caregiver/pending` - Get all pending requests
- `POST /api/caregiver/approve/:id` - Approve a request
- `POST /api/caregiver/reject/:id` - Reject a request
- `GET /api/caregiver/approved` - Get all approved people
- `DELETE /api/caregiver/approved/:id` - Delete approved person

## Data Storage

Currently uses in-memory storage (Map). For production, replace with:
- PostgreSQL
- MongoDB
- Redis

## Security Notes

Add these for production:
- Authentication (JWT tokens)
- Rate limiting
- Input validation
- HTTPS only
- Database persistence
