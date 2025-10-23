import os
from datetime import timedelta

from minio import Minio
from minio.error import S3Error

MINIO_ENDPOINT = os.getenv('MINIO_ENDPOINT', '127.0.0.1:9000')
MINIO_ACCESS_KEY = os.getenv('MINIO_ACCESS_KEY', 'minioadmin')
MINIO_SECRET_KEY = os.getenv('MINIO_SECRET_KEY', 'minioadmin')
MINIO_SECURE = os.getenv('MINIO_SECURE', '1') in ('1', 'true', 'True')
MINIO_BUCKET = os.getenv('MINIO_BUCKET', 'dms')

client = Minio(
    MINIO_ENDPOINT,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=MINIO_SECURE,
)

DEFAULT_PRESIGNED_EXPIRY = timedelta(minutes=15)

def ensure_bucket(bucket: str = MINIO_BUCKET):
    """Ensure the bucket exists -> create it if it does not."""
    try:
        if not client.bucket_exists(bucket):
            client.make_bucket(bucket)
    except S3Error:
        raise

def upload_file(bucket: str, object_name: str, data, length: int, content_type: str | None = None):
    """Upload a file-like object (data) to the given bucket under object_name.

    - data: file-like object supporting read().
    - length: number of bytes to read from data.
    - content_type: optional MIME type.
    """
    ensure_bucket(bucket)
    client.put_object(bucket, object_name, data, length, content_type=content_type)

def presigned_get(bucket: str, object_name: str, expires: timedelta | None = None) -> str:
    """Return a presigned GET URL for the given object."""
    if expires is None:
        expires = DEFAULT_PRESIGNED_EXPIRY
    return client.presigned_get_object(bucket, object_name, expires=expires)

