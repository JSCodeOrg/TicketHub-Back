import "reflect-metadata";
import express from "express";
import cors from "cors";
import { AppDataSource } from "../database/dbconnection";
import routes from "../routes/user.routes";

const app = express();

// Configuración CORS (debe ir antes de las rutas)
app.use(cors({
  origin: [
    'http://localhost:8081',       // Para emulador Android
    'http://localhost:19006',      // Para Expo Web
    /exp:\/\/192\.168\.\d+\.\d+:\d+/, // Para dispositivos en red local
    /exp:\/\/.*\.tunel\.dev:\d+/  // Para túneles como ngrok
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200 
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const connect = async () => {
    try {
        await AppDataSource.initialize();
        console.log("Conexión exitosa 😘😘😘");
    } catch (error) {
        console.log("Error en la conexión 😭😭😭", error);
    }
}

connect().then(() => {
    app.use('/api', routes);
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
}).catch(error => {
    console.error('Database connection error:', error);
});