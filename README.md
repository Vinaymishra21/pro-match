# Pro Match

Full-stack dating app where users can discover and match only with people from the same profession.

## Project Structure

- `src/` React Native (Expo) frontend
- `backend/` Express backend API with JSON persistence

## Run Backend

```bash
cd backend
copy .env.example .env
npm install
npm run dev
```

Backend runs on `http://localhost:4000`.

## Run Frontend

```bash
npm install
npm run start
```

Android emulator uses `10.0.2.2` for localhost by default in `src/constants/api.js`.
For physical devices, replace `API_BASE_URL` with your machine LAN IP.