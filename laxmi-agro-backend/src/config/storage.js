const fs = require('fs/promises');
const path = require('path');
const { getStorage } = require('./firebase');

const LOCAL_STORAGE_DRIVER = 'local';
const FIREBASE_STORAGE_DRIVER = 'firebase';

function getStorageDriver() {
  const configured = (process.env.FILE_STORAGE_DRIVER || 'auto').trim().toLowerCase();
  const bucket = getStorage();

  if (configured === FIREBASE_STORAGE_DRIVER) {
    return bucket ? FIREBASE_STORAGE_DRIVER : LOCAL_STORAGE_DRIVER;
  }

  if (configured === LOCAL_STORAGE_DRIVER) {
    return LOCAL_STORAGE_DRIVER;
  }

  return bucket ? FIREBASE_STORAGE_DRIVER : LOCAL_STORAGE_DRIVER;
}

function getUploadsRoot() {
  return path.resolve(
    process.cwd(),
    process.env.LOCAL_UPLOADS_DIR || 'uploads'
  );
}

function sanitizeSegment(segment) {
  return String(segment || '')
    .replace(/\\/g, '/')
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean)
    .join('/');
}

function getPublicBaseUrl() {
  const configured = (process.env.PUBLIC_BASE_URL || '').trim().replace(/\/+$/, '');
  if (configured) return configured;
  return `http://localhost:${process.env.PORT || 5000}`;
}

async function saveBuffer({
  buffer,
  folder = 'uploads',
  filename,
  contentType = 'application/octet-stream',
  metadata = {},
}) {
  const driver = getStorageDriver();
  const normalizedFolder = sanitizeSegment(folder);
  const normalizedFilename = sanitizeSegment(filename);
  const relativePath = sanitizeSegment(
    normalizedFolder ? `${normalizedFolder}/${normalizedFilename}` : normalizedFilename
  );

  if (driver === FIREBASE_STORAGE_DRIVER) {
    const bucket = getStorage();
    const fileUpload = bucket.file(relativePath);

    await new Promise((resolve, reject) => {
      const stream = fileUpload.createWriteStream({
        metadata: {
          contentType,
          metadata,
        },
      });
      stream.on('error', reject);
      stream.on('finish', resolve);
      stream.end(buffer);
    });

    await fileUpload.makePublic();

    return {
      driver,
      publicId: relativePath,
      url: `https://storage.googleapis.com/${bucket.name}/${relativePath}`,
    };
  }

  const uploadsRoot = getUploadsRoot();
  const absolutePath = path.join(uploadsRoot, relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, buffer);

  return {
    driver,
    publicId: relativePath,
    url: `${getPublicBaseUrl()}/uploads/${relativePath.replace(/\\/g, '/')}`,
  };
}

async function deleteFile(publicId) {
  if (!publicId) return false;

  const driver = getStorageDriver();
  const relativePath = sanitizeSegment(publicId);

  if (driver === FIREBASE_STORAGE_DRIVER) {
    const bucket = getStorage();
    if (!bucket) return false;

    const file = bucket.file(relativePath);
    const [exists] = await file.exists();
    if (!exists) return false;
    await file.delete();
    return true;
  }

  const absolutePath = path.join(getUploadsRoot(), relativePath);
  try {
    await fs.unlink(absolutePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function deleteDirectory(publicIdPrefix) {
  if (!publicIdPrefix) return false;

  const relativePath = sanitizeSegment(publicIdPrefix);
  if (!relativePath) return false;

  if (getStorageDriver() === FIREBASE_STORAGE_DRIVER) {
    const bucket = getStorage();
    if (!bucket) return false;
    await bucket.deleteFiles({ prefix: `${relativePath}/` });
    return true;
  }

  const absolutePath = path.join(getUploadsRoot(), relativePath);
  try {
    await fs.rm(absolutePath, { recursive: true, force: true });
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

module.exports = {
  saveBuffer,
  deleteFile,
  deleteDirectory,
  getStorageDriver,
  getUploadsRoot,
};
