# Auth Backend (Node + Express + MongoDB Atlas)

## Local chalane ka tareeqa
1. `npm install`
2. `.env.example` ko copy karke `.env` banayein aur values bharein
3. `npm run dev`
(SMTP set na ho to verification/reset links terminal mein print honge.)

## API Endpoints  (base: /api/auth)
| Method | Route | Auth | Kaam |
|---|---|---|---|
| POST | /signup | - | {name,email,password} |
| POST | /login | - | {email,password} -> token |
| GET | /verify-email/:token | - | Email verify |
| POST | /forgot-password | - | {email} |
| POST | /reset-password/:token | - | {password} |
| POST | /logout | Bearer | Token invalid |
| POST | /resend-verification | Bearer | Verify email dobara |
| PUT | /change-password | Bearer | {currentPassword,newPassword} |
| GET | /me | Bearer | Current user |
| GET | /me/qr | Bearer | QR code (base64) |
| PUT | /avatar | Bearer | form-data, key: avatar (image) |

Protected routes ke liye header: `Authorization: Bearer <token>`

## MongoDB Atlas
1. atlas.mongodb.com par free cluster banayein
2. Database Access -> user banayein
3. Network Access -> `0.0.0.0/0` allow karein (Render ke liye)
4. Connect -> Drivers -> connection string `MONGO_URI` mein daalein

## GitHub par upload
```
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/USERNAME/auth-backend.git
git push -u origin main
```

## Render par deploy
1. render.com -> New -> Web Service -> GitHub repo select karein
2. Build Command: `npm install`   |   Start Command: `npm start`
3. Environment tab mein `.env` ki saari values daalein
   (`BASE_URL` mein apna Render URL, jaise https://auth-backend.onrender.com)
4. Deploy. Phir Postman mein `https://YOUR-URL.onrender.com/api/auth/signup` test karein.
