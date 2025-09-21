# Road Rescue 360 - Deployment Guide

## 🚀 Render Deployment

### Backend Deployment

1. **Prerequisites:**
   - GitHub repository with your code
   - Render account (free tier available)

2. **Deploy Backend:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Use these settings:
     - **Name:** `roadrescue360-backend`
     - **Environment:** `Node`
     - **Build Command:** `npm run build`
     - **Start Command:** `npm start`
     - **Plan:** Free

3. **Environment Variables:**
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: (Auto-generated from database)
   - `JWT_SECRET`: (Auto-generated)
   - `JWT_EXPIRES_IN`: `7d`
   - `PORT`: `3000`

4. **Database Setup:**
   - In Render Dashboard, create a new MongoDB database
   - Name: `roadrescue360-db`
   - Plan: Free

### Frontend Deployment

1. **Deploy as Static Site:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Static Site"
   - Connect your GitHub repository
   - Use these settings:
     - **Name:** `roadrescue360-frontend`
     - **Build Command:** (leave empty)
     - **Publish Directory:** `frontend`
     - **Plan:** Free

2. **Environment Variables:**
   - `REACT_APP_API_URL`: `https://roadrescue360-backend.onrender.com`

## 🔧 Local Development

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
# Open index.html in browser or use a local server
python -m http.server 8000
```

## 📝 Troubleshooting

### Common Issues:

1. **"Cannot find module 'express'"**
   - Solution: Ensure `npm run build` installs dependencies in backend folder
   - Check that package.json has correct scripts

2. **CORS Errors**
   - Solution: Backend CORS is configured for all origins
   - Check that frontend is using correct API URL

3. **Database Connection Issues**
   - Solution: Ensure MONGODB_URI is set correctly
   - Check that database is created and accessible

4. **Port Issues**
   - Solution: Render automatically assigns PORT environment variable
   - Backend uses `process.env.PORT || 3000`

## 🎯 Deployment Checklist

- [ ] Backend dependencies installed
- [ ] Environment variables configured
- [ ] Database created and connected
- [ ] Frontend API URL updated
- [ ] CORS configured
- [ ] Health check endpoint working
- [ ] All routes tested

## 📞 Support

If you encounter issues:
1. Check Render logs for error details
2. Verify environment variables
3. Test API endpoints manually
4. Check database connectivity
