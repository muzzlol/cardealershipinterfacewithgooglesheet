import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Google Drive API
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, 'keys.json'),
  scopes: ['https://www.googleapis.com/auth/drive.file']
});

const drive = google.drive({ version: 'v3', auth });

// Create a folder in Google Drive if it doesn't exist
async function createOrGetFolder(folderName: string): Promise<string> {
  try {
    // Check if folder already exists
    const response = await drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
    });

    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id!;
    }

    // Create new folder
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };

    const folder = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id',
    });

    return folder.data.id!;
  } catch (error) {
    console.error('Error creating/getting folder:', error);
    throw error;
  }
}

// Upload file to Google Drive
async function uploadFile(
  file: Express.Multer.File,
  folderId: string,
  fileType: 'document' | 'photo'
): Promise<string> {
  try {
    const fileMetadata = {
      name: `${Date.now()}_${file.originalname}`,
      parents: [folderId],
    };

    const media = {
      mimeType: file.mimetype,
      body: fs.createReadStream(file.path),
    };

    const uploadedFile = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    });

    // Make the file publicly accessible
    await drive.permissions.create({
      fileId: uploadedFile.data.id!,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Clean up temporary file
    fs.unlinkSync(file.path);

    return uploadedFile.data.webViewLink!;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

// Delete file from Google Drive
async function deleteFile(fileUrl: string): Promise<void> {
  try {
    // Extract file ID from webViewLink
    const fileId = fileUrl.split('/')[5];
    await drive.files.delete({ fileId });
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

export { createOrGetFolder, uploadFile, deleteFile }; 