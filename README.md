# CertiBlock

CertiBlock is a modular blockchain-based certificate verification system with a React dashboard, Express API, PostgreSQL persistence, IPFS support, and a Solidity registry deployed through Hardhat.

## Stack

- `frontend/` React + Vite + Tailwind + role-based dashboards + QR scanning + PDF report export
- `backend/` Express + JWT + Sequelize + PostgreSQL + audit logs + IPFS/email integration hooks
- `blockchain/` Hardhat + Solidity contract for issuer authorization, issuance, verification, and revocation

## Core capabilities

- Admin, issuer, and verifier roles with JWT authentication
- Issue certificate by uploading PDF or image, generating SHA-256 proof, pinning to IPFS, and writing the hash on-chain
- Verify by certificate ID, QR scan, or original document upload
- Revocation flow with audit logging
- MetaMask wallet connect helper on the issuer flow
- Downloadable verification report (PDF)
- Multi-chain aware configuration for Sepolia and Polygon Amoy
- Swagger-like OpenAPI JSON at `backend/docs/openapi.json` and `GET /api/docs`

## Folder structure

```text
backend/
  docs/
  models/
  routes/
  services/
  sample-data/
blockchain/
  contracts/
  scripts/
  test/
frontend/
  src/
```

## Environment setup

Copy the example files first:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp blockchain/.env.example blockchain/.env
```

### Backend

Required minimum values:

- `DATABASE_URL`
- `JWT_SECRET`
- `ENCRYPTION_KEY`
- `RPC_URL`
- `PRIVATE_KEY`
- `CONTRACT_ADDRESS`

Optional integrations:

- `PINATA_JWT` for IPFS pinning
- `SMTP_*` values for issuance notifications
- `POLYGON_CONTRACT_ADDRESS` for Polygon Amoy support

### Frontend

- `VITE_API_BASE_URL`
- `VITE_PUBLIC_APP_URL`
- `VITE_ETHERSCAN_BASE_URL`
- `VITE_POLYGON_EXPLORER_BASE_URL`

### Blockchain

- `SEPOLIA_RPC_URL`
- `POLYGON_AMOY_RPC_URL`
- `DEPLOYER_PRIVATE_KEY`

## Local development

Install dependencies:

```bash
cd backend && npm install
cd ../frontend && npm install
cd ../blockchain && npm install
```

Start PostgreSQL locally, then deploy the smart contract:

```bash
cd blockchain
npx hardhat run scripts/deploy.js --network sepolia
```

Copy the deployed address into `backend/.env`, then start apps:

```bash
cd backend
npm run dev
```

```bash
cd frontend
npm run dev
```

## Smart contract

The registry supports:

- authorized issuer management
- `issueCertificate(bytes32 hash, string certificateId, string metadataURI, string metadataDigest)`
- `verifyCertificate(bytes32 hash)`
- `getCertificateById(string certificateId)`
- `revokeCertificate(bytes32 hash, string reason)`

## API highlights

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/users`
- `POST /api/users`
- `POST /api/certificates/issue`
- `POST /api/certificates/batch-issue`
- `GET /api/certificates`
- `GET /api/certificates/stats`
- `GET /api/certificates/verify/:id`
- `POST /api/certificates/verify-file`
- `GET /api/certificates/:id/report`
- `POST /api/certificates/:id/revoke`

See `backend/docs/openapi.json` or import `backend/docs/postman_collection.json`.

## Sample data

- `backend/sample-data/demo-users.json`
- `backend/sample-data/demo-certificates.json`

## Tests

Backend:

```bash
cd backend
npm test
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

Blockchain:

```bash
cd blockchain
npm test
```

## Docker

```bash
docker compose up --build
```

This boots PostgreSQL, the backend API, and the frontend. Replace placeholder blockchain credentials before using it beyond local development.

## Deployment targets

- Frontend: Vercel or Netlify
- Backend: Render or Railway
- Smart contract: Sepolia and Polygon Amoy testnets
- Database: managed PostgreSQL (Neon, Supabase, Railway, Render)

## Notes

- The backend encrypts sensitive stored values with `ENCRYPTION_KEY`.
- If IPFS credentials are not configured, uploads fall back to a local cache URL for development.
- Frontend bundle is currently large because QR scanning and PDF export libraries are included; a future optimization would lazy-load those modules.
