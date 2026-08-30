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
    paginasAnuario: [{ type: String }],
    formularioEnviado: { type: Boolean, default: false },
    fechaEnvio: { type: Date },
    /** Experiencia cinematográfica “Memoria” (Apple Event / Memories) */
    memoria: {
      portadaUrl: { type: String, default: '' },
      perfilUrl: { type: String, default: '' },
      recuerdos: [
        {
          url: { type: String, required: true },
          publicId: { type: String, default: '' },
          caption: { type: String, default: '' },
        },
      ],
      mensajes: [
        {
          autor: { type: String, default: 'Familia' },
          texto: { type: String, default: '' },
        },
      ],
      /** Extensible sin romper arquitectura */
      videos: [{ url: String, publicId: String, caption: { type: String, default: '' } }],
      audios: [{ url: String, publicId: String, label: { type: String, default: '' } }],
      published: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export default mongoose.models.AnuarioAlumno || mongoose.model('AnuarioAlumno', AlumnoSchema, 'alumnos');
