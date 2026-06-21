import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.ANUARIO_K3_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.ANUARIO_K3_CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.ANUARIO_K3_CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const token = formData.get('token');

    if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: `anuario-k3/${token}`, resource_type: 'image' },
          (error, uploadResult) => {
            if (error) reject(error);
            else resolve(uploadResult);
          }
        )
        .end(buffer);
    });

    return NextResponse.json({ url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error al subir imagen' }, { status: 500 });
  }
}
