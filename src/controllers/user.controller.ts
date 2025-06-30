import { Request, Response } from "express";
import { UserService } from "../services/UserService";

export class UserController {
    userService: UserService;

    constructor(userService: UserService) {
        this.userService = userService;
    }

    public async login(req: Request, res: Response): Promise<void> {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({
                success: false,
                message: 'Email y contraseña requeridos.'
            });
            return;
        }

        try {
            const result = await this.userService.loginUser(email, password);

            if (result.error) {
                res.status(401).json({
                    success: false,
                    message: result.error
                });
            } else if (result.token) {
                res.status(200).json({
                    success: true,
                    message: 'Inicio de sesión exitoso.',
                    token: result.token,

                    user: {
                        id: result.user?.id,
                        email: result.user?.email,

                    }
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Ocurrió un error inesperado durante el login.'
                });
            }
        } catch (error) {
            console.error('Error en el controlador de login:', error);
            res.status(500).json({
                success: false,
                message: 'Error al intentar hacer login, por favor intenta más tarde'
            });
        }
    }

    public async register(req: Request, res: Response): Promise<void> {
        const { email, password, nombre, apellido, documento, foto } = req.body;

        if (!email || !password || !nombre || !apellido || !documento) {
            res.status(400).json({ message: 'Faltan campos requeridos.' });
            return;
        }

        try {
            const result = await this.userService.registerUser({ email, password, nombre, apellido, documento });

            if (result.error) {
                res.status(409).json({ message: result.error });
            } else {
                res.status(201).json({ message: 'Usuario registrado correctamente.', user: result.user });
            }
        } catch (error) {
            console.error('Error en el controlador de registro:', error);
            res.status(500).json({ message: 'Error interno al registrar usuario.' });
        }
    }

    public async verify(req: Request, res: Response): Promise<void> {
        console.log('Cuerpo de la solicitud:', req.body);

        const { email, code } = req.body;

        if (!email || !code) {
            console.error('Faltan campos:', { email, code });
            res.status(400).json({ message: 'Faltan campos requeridos.' });
            return;
        }

        try {
            const result = await this.userService.verifyUser(email, code);

            if (result.error) {
                console.error('Error en verificación:', result.error);
                res.status(400).json({ message: result.error });
            } else {
                console.log('Usuario verificado:', email);
                res.status(200).json({
                    message: 'Usuario verificado correctamente.',
                    user: result.user
                });
            }
        } catch (error: unknown) {
            console.error('Error en el controlador de verificación:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            res.status(500).json({
                message: 'Error interno al verificar usuario.',
                error: errorMessage
            });
        }
    }

    public async updateProfile(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const { nombre, apellido, documento, password } = req.body;

        try {
            const result = await this.userService.updateUserProfile(
                parseInt(id),
                { nombre, apellido, documento, password }
            );

            if (result.error) {
                res.status(400).json({ 
                    success: false,
                    message: result.error 
                });
            } else {
                res.status(200).json({ 
                    success: true,
                    message: 'Perfil actualizado correctamente.',
                    user: result.user 
                });
            }
        } catch (error) {
            console.error('Error al actualizar perfil:', error);
            res.status(500).json({ 
                success: false,
                message: 'Error interno al actualizar perfil.' 
            });
        }
    }


    public async getUserProfile(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        try {
            const user = await this.userService.getUserById(parseInt(id));

            if (!user) {
                res.status(404).json({ 
                    success: false,
                    message: 'Usuario no encontrado' 
                });
                return;
            }

            res.status(200).json({ 
                success: true,
                user: {
                    id: user.id,
                    nombre: user.nombre,
                    apellido: user.apellido,
                    email: user.email,
                    documento: user.documento
                }
            });
        } catch (error) {
            console.error('Error al obtener perfil:', error);
            res.status(500).json({ 
                success: false,
                message: 'Error interno al obtener perfil' 
            });
        }
    }

    public async verifypassword(req: Request, res: Response): Promise<void> {
        try {
            const { userId, currentPassword } = req.body;
            
            // Validar entrada
            if (!userId || !currentPassword) {
                res.status(400).json({ 
                    success: false,
                    message: 'Se requieren userId y currentPassword' 
                });
                return;
            }

            // Usar el servicio para verificar la contraseña
            const result = await this.userService.verifyUserPassword(
                parseInt(userId), 
                currentPassword
            );
            
            if (result.error) {
                res.status(401).json({ 
                    success: false,
                    message: result.error 
                });
                return;
            }

            res.json({ 
                success: true,
                isValid: result.isValid 
            });
        } catch (error) {
            console.error('Error en verifypassword:', error);
            
            res.status(500).json({ 
                success: false,
                message: 'Error al verificar credenciales' 
            });
        }
    }
        
}