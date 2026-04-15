const { google } = require('googleapis');
const stream = require('stream');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

let drive;
let isOAuthConfigured = false;

async function getOAuthClient() {
    const tokenPath = path.join(process.cwd(), 'token.json');
    const credentialsPath = path.join(process.cwd(), 'client_secret.json');
    
    if (!fs.existsSync(tokenPath)) {
        console.log(' token.json not found. Run node auth.js first!');
        return null;
    }
    
    const token = JSON.parse(fs.readFileSync(tokenPath));
    const credentials = JSON.parse(fs.readFileSync(credentialsPath));
    const key = credentials.installed || credentials.web;
    
    const oAuth2Client = new google.auth.OAuth2(
        key.client_id,
        key.client_secret,
        key.redirect_uris ? key.redirect_uris[0] : 'http://localhost:3000/oauth2callback'
    );
    
    oAuth2Client.setCredentials({
        refresh_token: token.refresh_token
    });
    
    return oAuth2Client;
}

async function uploadCVToGoogleDrive(file, candidateName) {
    console.log('Uploading CV to Google Drive for:', candidateName);
    
    try {
        const auth = await getOAuthClient();
        if (!auth) {
            throw new Error('OAuth not configured');
        }
        
        const drive = google.drive({ version: 'v3', auth });
        
        const fileName = `${candidateName.replace(/\s/g, '_')}_${Date.now()}.pdf`;
        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
        
        const bufferStream = new stream.PassThrough();
        bufferStream.end(file.buffer);
        
        const response = await drive.files.create({
            requestBody: {
                name: fileName,
                mimeType: 'application/pdf',
                parents: folderId ? [folderId] : []
            },
            media: {
                mimeType: 'application/pdf',
                body: bufferStream
            },
            fields: 'id, webViewLink'
        });
        
        const fileId = response.data.id;
        
        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone'
            }
        });
        
        const url = `https://drive.google.com/file/d/${fileId}/view`;
        
        console.log(`CV uploaded to Google Drive: ${fileName} (ID: ${fileId})`);
        
        return {
            fileId: fileId,
            url: url
        };
        
    } catch (error) {
        console.error(' Google Drive upload failed:', error.message);
        console.log(' Falling back to local storage');
        return saveCVToLocal(file, candidateName);
    }
}

async function saveCVToLocal(file, candidateName) {
    const uploadDir = path.join(__dirname, '../../uploads');
    
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const fileName = `${candidateName.replace(/\s/g, '_')}_${Date.now()}.pdf`;
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, file.buffer);
    
    console.log(` CV saved locally: ${fileName}`);
    
    return {
        fileId: fileName,
        url: `/uploads/${fileName}`
    };
}

module.exports = { uploadCVToGoogleDrive };
