// const db = require('../db/db')
// const jwt = require('jsonwebtoken')
// const multer = require('multer');
// const sharp = require('sharp');
// const fs = require('fs/promises');

// const app = express();
// const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10*1024*1024 } });

// app.post('/upload', upload.single('image'), async (req, res) => {
//   try {
//     if (!req.file) return res.status(400).json({ error: 'No file' });

//     // Validation simple
//     if (!req.file.mimetype.startsWith('image/')) return res.status(400).json({ error: 'Only images' });

//     const outDir = path.join(__dirname, 'uploads');
//     await fs.mkdir(outDir, { recursive: true });
//     const filename = `${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}.jpg`;

//     // Transformation via sharp
//     await sharp(req.file.buffer)
//       .rotate()
//       .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
//       .jpeg({ quality: 80 })
//       .toFile(path.join(outDir, filename));

//     // Ici, sauvegarder le chemin/URL en base si besoin
//     res.json({ ok: true, url: `/uploads/${filename}` });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Upload failed' });
//   }
// });

// app.listen(3000);