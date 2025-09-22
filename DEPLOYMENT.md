# GameGPT Deployment Guide for Render

This guide will help you deploy your GameGPT application to Render.com.

## Prerequisites

1. A Render.com account (free tier available)
2. Your Google Gemini API key
3. Git repository with your code

## Project Structure

```
gamegpt-user-prompt/
├── backend/           # FastAPI backend
│   ├── render.yaml    # Backend deployment config
│   ├── Dockerfile     # Backend container config
│   └── requirements.txt
├── frontend/          # React frontend
│   ├── render.yaml    # Frontend deployment config
│   ├── Dockerfile     # Frontend container config
│   └── nginx.conf     # Nginx configuration
└── DEPLOYMENT.md      # This file
```

## Deployment Steps

### 1. Backend Deployment

1. **Connect Repository to Render:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository

2. **Configure Backend Service:**
   - **Name:** `gamegpt-backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory:** `backend`

3. **Set Environment Variables:**
   - `GOOGLE_API_KEY`: Your Google Gemini API key (mark as secret)
   - `HOST`: `0.0.0.0`
   - `DEBUG`: `False`
   - `LOG_LEVEL`: `INFO`
   - `ALLOWED_ORIGINS`: `https://gamegpt-frontend.onrender.com,https://gamegpt-user-prompt.onrender.com`

4. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note the backend URL (e.g., `https://gamegpt-backend.onrender.com`)

### 2. Frontend Deployment

1. **Create Static Site:**
   - Go to Render Dashboard
   - Click "New +" → "Static Site"
   - Connect your GitHub repository

2. **Configure Frontend Service:**
   - **Name:** `gamegpt-frontend`
   - **Build Command:** `cd frontend && npm install && npm run build`
   - **Publish Directory:** `frontend/dist`
   - **Root Directory:** `frontend`

3. **Set Environment Variables:**
   - `VITE_API_URL`: `https://gamegpt-backend.onrender.com`
   - `VITE_S3_UPLOAD_URL`: `https://gamegpt-backend.onrender.com/upload`
   - `VITE_NODE_API_URL`: `https://gamegpt-backend.onrender.com/api/reaction`
   - `VITE_NODE_API_URL_EMOTION`: `https://gamegpt-backend.onrender.com/api/emotions`
   - `VITE_NODE_API_URL_GET_EMOTION`: `https://gamegpt-backend.onrender.com/api/getemotions`

4. **Deploy:**
   - Click "Create Static Site"
   - Wait for deployment to complete
   - Note the frontend URL (e.g., `https://gamegpt-frontend.onrender.com`)

### 3. Update CORS Settings

After both services are deployed, update the backend CORS settings:

1. Go to your backend service in Render Dashboard
2. Navigate to "Environment" tab
3. Update `ALLOWED_ORIGINS` to include your actual frontend URL:
   ```
   https://gamegpt-frontend.onrender.com,https://gamegpt-user-prompt.onrender.com
   ```
4. Redeploy the backend service

## Environment Variables Reference

### Backend Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `GOOGLE_API_KEY` | Google Gemini API key | - | Yes |
| `HOST` | Server host | `0.0.0.0` | No |
| `PORT` | Server port | `8000` | No |
| `DEBUG` | Debug mode | `False` | No |
| `LOG_LEVEL` | Logging level | `INFO` | No |
| `ALLOWED_ORIGINS` | CORS allowed origins | See config | No |
| `GOOGLE_MODEL` | Gemini model to use | `gemini-2.0-flash-exp` | No |
| `REQUEST_TIMEOUT` | Request timeout (seconds) | `60` | No |
| `MAX_TOKENS` | Maximum tokens | `4000` | No |
| `TEMPERATURE` | LLM temperature | `0.7` | No |

### Frontend Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | Yes |
| `VITE_S3_UPLOAD_URL` | File upload URL | Yes |
| `VITE_NODE_API_URL` | Reaction API URL | Yes |
| `VITE_NODE_API_URL_EMOTION` | Emotions API URL | Yes |
| `VITE_NODE_API_URL_GET_EMOTION` | Get emotions API URL | Yes |

## Troubleshooting

### Common Issues

1. **CORS Errors:**
   - Ensure `ALLOWED_ORIGINS` includes your frontend URL
   - Check that URLs are exact matches (including https://)

2. **Build Failures:**
   - Check that all dependencies are in `requirements.txt` (backend)
   - Verify `package.json` has all required dependencies (frontend)

3. **API Connection Issues:**
   - Verify environment variables are set correctly
   - Check that backend is running and accessible
   - Ensure API endpoints match between frontend and backend

4. **Google API Issues:**
   - Verify `GOOGLE_API_KEY` is set and valid
   - Check API quotas and billing

### Monitoring

- Use Render's built-in logs to monitor both services
- Check the health endpoints:
  - Backend: `https://your-backend-url.onrender.com/health`
  - Frontend: Should load without errors

## Custom Domain (Optional)

To use a custom domain:

1. Go to your service settings in Render
2. Navigate to "Custom Domains"
3. Add your domain
4. Update DNS records as instructed
5. Update CORS settings to include your custom domain

## Scaling

- **Free Tier:** Limited to 750 hours/month per service
- **Paid Plans:** Start at $7/month for always-on services
- **Auto-scaling:** Available on paid plans

## Security Considerations

1. **API Keys:** Always mark sensitive environment variables as "Secret" in Render
2. **CORS:** Restrict `ALLOWED_ORIGINS` to your actual domains in production
3. **HTTPS:** Render provides HTTPS by default
4. **Environment:** Use different API keys for development and production

## Support

- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com)
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [Vite Documentation](https://vitejs.dev)
