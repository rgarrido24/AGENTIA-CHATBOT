import mongoose from 'mongoose';

const AlumnoSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    token: { type: String, required: true, unique: true },
    nombreCorto: { type: String, required: true },
    nombreCompleto: { type: String, default: '' },
    nombreTutor: { type: String, default: '' },
    suenioDeGrande: { type: String, default: '' },
    comidaFavorita: { type: String, default: '' },
    colorFavorito: { type: String, default: '' },
    mejorAmigo: { type: String, default: '' },
    fraseFavorita: { type: String, default: '' },
    loQueMasLeGusto: { type: String, default: '' },
    dedicatoriaMama: { type: String, default: '', maxlength: 280 },
    dedicatoriaPapa: { type: String, default: '', maxlength: 280 },
    fotos: [{ url: String, publicId: String, caption: { type: String, default: '' } }],
    formularioEnviado: { type: Boolean, default: false },
    fechaEnvio: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.AnuarioAlumno || mongoose.model('AnuarioAlumno', AlumnoSchema, 'alumnos');
