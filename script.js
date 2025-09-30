const fs = require("fs");
const path = require("path");
const AWS = require("aws-sdk");

// ----------------- CONFIG -----------------
const LOCAL_PUBLIC_DIR = "/var/www/html/public"; // Path to where your files folder location
const S3_BUCKET = "AWS_BUCKET_NAME";
const S3_REGION = "AWS_REGION_NAME";

// AWS Credentials
const AWS_ACCESS_KEY_ID = "";
const AWS_SECRET_ACCESS_KEY = "";

AWS.config.update({
  region: S3_REGION,
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
});

const s3 = new AWS.S3();

// ----------------- UTILITY FUNCTIONS -----------------
function getAllFiles(dir, baseDir = dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];

  for (let entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getAllFiles(fullPath, baseDir));
    } else {
      const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, "/");
      files.push({ fullPath, relativePath });
    }
  }
  return files;
}

async function uploadFile(file) {
  try {
    console.log(`\n➡️ Uploading: ${file.relativePath},`);

    const fileStream = fs.createReadStream(file.fullPath);
    const params = {
      Bucket: S3_BUCKET,
      Key: `uploads/${file.relativePath}`, // keep folder structure
      Body: fileStream,
    };

    await s3.upload(params).promise();
    console.log(`✅ Uploaded successfully`);
  } catch (err) {
    console.error(`❌ Error uploading ${file.relativePath}:`, err.message);
  }
}

// ----------------- MAIN SCRIPT -----------------
async function migrate() {
  const allFiles = getAllFiles(LOCAL_PUBLIC_DIR);

  for (let file of allFiles) {
    await uploadFile(file);
  }
  
  console.log("Full folder migration completed!");
  return;
}

// ----------------- RUN -----------------
migrate().catch((err) => console.error("Migration failed:", err));
