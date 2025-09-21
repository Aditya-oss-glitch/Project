# RoadRescue360 Render Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Backend Deployment

1. **Connect Repository to Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Backend Service**
   - **Name**: `roadrescue360-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid for better performance)

3. **Set Environment Variables**
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/roadrescue360
   JWT_SECRET=your-super-secret-jwt-key-here-make-it-very-long-and-random
   JWT_EXPIRES_IN=7d
   PORT=3000
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note your backend URL (e.g., `https://roadrescue360-backend.onrender.com`)

### 2. Frontend Deployment

1. **Create Static Site**
   - Go to Render Dashboard
   - Click "New +" → "Static Site"
   - Connect your GitHub repository

2. **Configure Frontend**
   - **Name**: `roadrescue360-frontend`
   - **Build Command**: `echo "Frontend uses static files"`
   - **Publish Directory**: `frontend`
   - **Plan**: Free

3. **Deploy**
   - Click "Create Static Site"
   - Wait for deployment to complete
   - Note your frontend URL (e.g., `https://roadrescue360-frontend.onrender.com`)

### 3. Database Setup

1. **MongoDB Atlas (Recommended)**
   - Go to [MongoDB Atlas](https://cloud.mongodb.com)
   - Create a free cluster
   - Get your connection string
   - Add it to your backend environment variables

2. **Render MongoDB (Alternative)**
   - In Render Dashboard, create a new MongoDB database
   - Use the provided connection string

## 🔧 Configuration Files

### Backend Configuration
- `backend/server.js` - Main server file
- `backend/package.json` - Dependencies and scripts
- `render.yaml` - Render deployment configuration

### Frontend Configuration
- `frontend/config.js` - API endpoint configuration
- `frontend/index.html` - Main HTML file
- `frontend/styles.css` - Styling

## 🌐 Environment Detection

The application automatically detects the environment:

- **Local Development**: Uses `http://localhost:3000` for API
- **Render Frontend**: Uses your backend URL for API
- **Production**: Uses production backend URL

## 🔍 Health Checks

### Backend Health Check
```bash
curl https://your-backend-url.onrender.com/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "production",
  "database": "Connected"
}
```

### API Endpoints Test
```bash
# Test pricing endpoint
curl https://your-backend-url.onrender.com/api/pricing

# Test service creation
curl -X POST https://your-backend-url.onrender.com/api/services \
  -H "Content-Type: application/json" \
  -d '{"type":"battery","address":"Test Address","description":"Test Service"}'
```

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version (requires 16+)
   - Verify all dependencies are in package.json
   - Check build logs in Render dashboard

2. **Database Connection Issues**
   - Verify MongoDB URI is correct
   - Check if IP whitelist allows Render's IPs
   - Ensure database user has proper permissions

3. **CORS Issues**
   - Check CORS configuration in server.js
   - Verify frontend URL is in allowed origins

4. **Environment Variable Issues**
   - Ensure all required variables are set
   - Check variable names are correct
   - Verify JWT_SECRET is set

### Debug Steps

1. **Check Logs**
   - Go to Render dashboard
   - Click on your service
   - View logs tab

2. **Test Endpoints**
   - Use the health check endpoint
   - Test individual API endpoints
   - Check browser console for errors

3. **Verify Configuration**
   - Check environment variables
   - Verify database connection
   - Test frontend-backend communication

## 📊 Monitoring

### Render Dashboard
- View service status
- Monitor resource usage
- Check deployment logs
- View error rates

### Application Monitoring
- Health check endpoint
- Database connection status
- API response times
- Error tracking

## 🔄 Updates and Maintenance

### Updating the Application
1. Push changes to GitHub
2. Render automatically redeploys
3. Check deployment logs
4. Test the application

### Database Maintenance
- Regular backups
- Monitor connection limits
- Update indexes as needed
- Clean up old data

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section
2. Review Render documentation
3. Check GitHub issues
4. Contact support

## 📈 Performance Optimization

### Backend Optimization
- Use connection pooling
- Implement caching
- Optimize database queries
- Add rate limiting

### Frontend Optimization
- Minify CSS/JS
- Optimize images
- Use CDN for static assets
- Implement lazy loading

---

**Note**: This deployment guide assumes you're using the free tier of Render. For production applications, consider upgrading to paid plans for better performance and reliability.
