# MinIO Storage Setup Guide

## 📦 Overview

MinIO is used for storing audio files from Speaking exercises. The AI Service downloads these files for transcription using OpenAI Whisper API.

## 🔧 Configuration

### Automatic Setup (Recommended)

The `setup.sh` script automatically configures MinIO:

```bash
./setup.sh
```

This will:
1. Create MinIO alias with credentials
2. Create `ielts-audio` bucket
3. Set bucket policy to allow public downloads

### Manual Setup

If you need to configure MinIO manually:

```bash
# 1. Configure MinIO alias
docker exec ielts_minio mc alias set myminio http://localhost:9000 ielts_admin ielts_minio_password_2025

# 2. Create bucket
docker exec ielts_minio mc mb myminio/ielts-audio --ignore-existing

# 3. Set public download policy
docker exec ielts_minio mc anonymous set download myminio/ielts-audio
```

## 🗂️ Bucket Structure

```
ielts-audio/
├── audio/
│   └── <user_id>/
│       └── <submission_id>.mp3
```

## 📋 Common Commands

### List all buckets
```bash
docker exec ielts_minio mc ls myminio
```

### List files in ielts-audio bucket
```bash
docker exec ielts_minio mc ls myminio/ielts-audio --recursive
```

### Check bucket policy
```bash
docker exec ielts_minio mc anonymous get myminio/ielts-audio
```

### Set bucket policy
```bash
# Private (no public access)
docker exec ielts_minio mc anonymous set private myminio/ielts-audio

# Download only (public read)
docker exec ielts_minio mc anonymous set download myminio/ielts-audio

# Upload and download (public read/write)
docker exec ielts_minio mc anonymous set upload myminio/ielts-audio

# Public (full access)
docker exec ielts_minio mc anonymous set public myminio/ielts-audio
```

### Delete a file
```bash
docker exec ielts_minio mc rm myminio/ielts-audio/audio/<user_id>/<submission_id>.mp3
```

### Copy a file
```bash
docker exec ielts_minio mc cp myminio/ielts-audio/audio/source.mp3 myminio/ielts-audio/audio/dest.mp3
```

## 🔍 Troubleshooting

### Issue: AI Service gets 403 Access Denied

**Symptoms**: Speaking exercise evaluation fails with "Evaluation Failed"

**Logs show**:
```
❌ [AI Service] Download failed with status 403: Access Denied
```

**Solution**:
```bash
# Check current policy
docker exec ielts_minio mc anonymous get myminio/ielts-audio

# If it shows "private", set to download
docker exec ielts_minio mc anonymous set download myminio/ielts-audio
```

### Issue: Bucket doesn't exist

**Symptoms**: AI Service can't find audio files

**Solution**:
```bash
# Create bucket if missing
docker exec ielts_minio mc mb myminio/ielts-audio --ignore-existing
docker exec ielts_minio mc anonymous set download myminio/ielts-audio
```

### Issue: MinIO container not running

**Symptoms**: Commands fail with connection error

**Solution**:
```bash
# Check MinIO status
docker-compose ps minio

# Restart MinIO
docker-compose restart minio

# View MinIO logs
docker logs ielts_minio
```

## 🔐 Security

### Production Recommendations

1. **Use strong credentials**: Change default `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` in `.env`
2. **Restrict bucket policy**: Use signed URLs instead of public download
3. **Enable SSL/TLS**: Configure HTTPS for MinIO
4. **Set up bucket lifecycle**: Auto-delete old files to save storage
5. **Enable versioning**: Keep file history for recovery

### Generate Presigned URLs (More Secure)

Instead of public download policy, use presigned URLs:

```bash
# Generate temporary download URL (expires in 1 hour)
docker exec ielts_minio mc share download myminio/ielts-audio/audio/<user_id>/<submission_id>.mp3 --expire=1h
```

Update AI Service to use presigned URLs from Storage Service.

## 📊 Monitoring

### Check storage usage
```bash
docker exec ielts_minio mc du myminio/ielts-audio
```

### List recent uploads
```bash
docker exec ielts_minio mc ls myminio/ielts-audio/audio --recursive --sort time --max-keys 10
```

### Count total files
```bash
docker exec ielts_minio mc ls myminio/ielts-audio/audio --recursive | wc -l
```

## 🔗 Related Documentation

- [Storage Service README](../services/storage-service/README.md)
- [AI Service README](../services/ai-service/README.md)
- [MinIO Official Docs](https://min.io/docs/minio/linux/index.html)
- [MC Client Guide](https://min.io/docs/minio/linux/reference/minio-mc.html)

## 🐛 Known Issues

### Issue: Policy resets after restart

MinIO policies should persist, but if they reset:

**Workaround**: Add MinIO configuration to a startup script or docker-compose healthcheck

```yaml
# docker-compose.yml
minio:
  # ... existing config ...
  healthcheck:
    test: ["CMD", "mc", "alias", "set", "myminio", "http://localhost:9000", "ielts_admin", "ielts_minio_password_2025"]
    interval: 30s
    timeout: 10s
    retries: 3
```

### Issue: File upload succeeds but download fails

**Cause**: Bucket policy is private or file path is incorrect

**Debug**:
```bash
# Check if file exists
docker exec ielts_minio mc ls myminio/ielts-audio/audio/<user_id>/

# Check bucket policy
docker exec ielts_minio mc anonymous get myminio/ielts-audio

# Try to download manually
docker exec ielts_minio mc cp myminio/ielts-audio/audio/<user_id>/<file>.mp3 /tmp/test.mp3
```

