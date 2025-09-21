# RoadRescue360 - Emergency Roadside Assistance Platform

A comprehensive web application for emergency roadside assistance services, connecting users with qualified technicians for vehicle repairs and emergency services.

## 🚀 Features

- **User Authentication** - Secure login/registration for users and technicians
- **Service Booking** - Book various roadside assistance services
- **Real-time Tracking** - Track technician location and service progress
- **Emergency SOS** - Quick emergency service requests
- **Payment Processing** - Secure payment handling
- **Technician Management** - Technician profiles and availability
- **Location Services** - GPS-based service location detection

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.IO** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **HTML5** - Markup
- **CSS3** - Styling
- **JavaScript (ES6+)** - Client-side logic
- **Fetch API** - HTTP requests
- **Geolocation API** - Location services

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Aditya-oss-glitch/roadrescue360_web.git
   cd roadrescue360_web
   ```

2. **Install dependencies**
   ```bash
   npm run install-backend
   ```

3. **Set up environment variables**
   Create a `.env` file in the `backend` directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/roadrescue360
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=7d
   PORT=3000
   NODE_ENV=development
   ```

4. **Start MongoDB**
   ```bash
   mongod
   ```

5. **Start the application**
   ```bash
   npm start
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3000/api
   - Health Check: http://localhost:3000/health

## 🚀 Deployment on Render

### Backend Deployment

1. **Connect your GitHub repository to Render**

2. **Create a new Web Service**
   - Choose your repository
   - Set the following:
     - **Build Command**: `npm run build`
     - **Start Command**: `npm start`
     - **Environment**: Node

3. **Set Environment Variables**
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A secure random string
   - `JWT_EXPIRES_IN`: `7d`
   - `PORT`: `3000` (Render will set this automatically)

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy your backend

### Frontend Deployment

1. **Create a new Static Site**
   - Choose your repository
   - Set the following:
     - **Build Command**: `echo "Frontend uses static files"`
     - **Publish Directory**: `frontend`

2. **Deploy**
   - Click "Create Static Site"
   - Your frontend will be available at `https://your-app-name.onrender.com`

### Database Setup

1. **Create a MongoDB Database**
   - Use MongoDB Atlas (recommended) or Render's MongoDB service
   - Get your connection string
   - Add it to your environment variables

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/technician/register` - Technician registration
- `POST /api/auth/technician/login` - Technician login
- `GET /api/auth/user` - Get user profile

### Services
- `POST /api/services` - Create service request
- `GET /api/services` - Get all services
- `GET /api/services/:id` - Get service by ID
- `GET /api/services/:id/cost` - Calculate service cost
- `PUT /api/services/:id/status` - Update service status

### Technicians
- `GET /api/technicians` - Get all technicians
- `GET /api/technicians/:id` - Get technician by ID
- `PUT /api/technicians/:id/location` - Update technician location

### Payments
- `POST /api/payments/process` - Process payment
- `GET /api/payments/history` - Payment history

### Emergency
- `POST /api/emergency` - Create emergency request
- `GET /api/emergency` - Get all emergencies

### Pricing
- `GET /api/pricing` - Get pricing data

## 🧪 Testing

### Health Check
```bash
curl https://your-backend-url.onrender.com/health
```

### Test API Endpoints
```bash
# Test pricing endpoint
curl https://your-backend-url.onrender.com/api/pricing

# Test service creation
curl -X POST https://your-backend-url.onrender.com/api/services \
  -H "Content-Type: application/json" \
  -d '{"type":"battery","address":"Test Address","description":"Test Service"}'
```

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Input validation
- Rate limiting (can be added)

## 📱 Mobile Responsiveness

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- Various screen sizes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, email support@roadrescue360.com or create an issue on GitHub.

## 🗺️ Roadmap

- [ ] Mobile app development
- [ ] Push notifications
- [ ] Advanced tracking features
- [ ] Multi-language support
- [ ] Admin dashboard
- [ ] Analytics and reporting

---

**RoadRescue360** - Your trusted roadside assistance partner! 🚗🔧
