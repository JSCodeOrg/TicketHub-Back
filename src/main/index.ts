//* Ejecución y configuración de express;

import "reflect-metadata";
import express from "express";
import { AppDataSource } from "../database/dbconnection";
import routes from "../routes/user.routes";

const app = express();

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
    app.use('/tickethub', routes); 
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
}).catch(error => {
    console.error('Database connection error:', error);
});
