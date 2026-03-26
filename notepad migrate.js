const { MongoClient } = require('mongodb');
const uri = 'mongodb+srv://rgarrido24_db_user:HGjDliGFyJE1Z0Im@cluster0.zidelcz.mongodb.net/agentia_chatbot_ventas?retryWrites=true&w=majority';

MongoClient.connect(uri).then(client => {
  const db = client.db();
  return db.collection('prospectos').updateMany(
    { pipeline: { $exists: false } },
    { $set: { pipeline: 'Izzi', giro: 'Barbería' } }
  ).then(r => {
    console.log('Actualizados:', r.modifiedCount);
    client.close();
  });
}).catch(console.error);