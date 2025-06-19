import { Request, Response } from "express";
import { UserService } from "../services/UserService";

class UserController {
    userService: UserService;

    constructor(userService: UserService) {
        this.userService = userService;
    }

    public async login(req: Request, res: Response): Promise<void> {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ message: 'Email y contraseña requeridos.' });
            return;
        }
        try {
            const result = await this.userService.loginUser(email, password)
            if (result.error) {
                res.status(401).json({ message: result.error });
            } else if (result.token) {
                res.status(200).json({ message: 'Inicio de sesión exitoso.', token: result.token });
            } else {
                res.status(500).json({ message: 'Ocurrió un error inesperado durante el login.' });
            }

        } catch (error) {
            console.error('Error en el controlador de login:', error);
            res.status(500).json({ message: 'Error al intentar hacer login, por favor intenta más tarde' });
        }
    }
}