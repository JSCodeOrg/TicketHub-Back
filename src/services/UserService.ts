import { Repository } from "typeorm";
import { User } from "../entities/User";
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { Roles } from "../entities/Roles";
import { UserPerRoles } from "../entities/users_per_roles";
import { emailService } from '../services/email.service';


export class UserService {

    private userRepository: Repository<User>;
    private rolesRepository: Repository<Roles>;
    private userPerRolesRepository: Repository<UserPerRoles>;

    constructor(userRepository: Repository<User>, rolesRepository: Repository<Roles>, userPerRolesRepository: Repository<UserPerRoles>) {
        this.userRepository = userRepository;
        this.rolesRepository = rolesRepository;
        this.userPerRolesRepository = userPerRolesRepository;
    }


    public async loginUser(email: string, password: string): Promise<{ 
        token?: string; 
        user?: { id: number; email: string }; 
        error?: string 
    }> {
        try {
            const user = await this.userRepository.findOne({ 
                where: { email },
                select: ['id', 'email', 'password', 'isVerified']
            });

            if (!user) {
                return { error: "Usuario no encontrado" };
            }

            if (!user.isVerified) {
                return { error: "Por favor verifica tu cuenta antes de iniciar sesión" };
            }

            if (!user.password) {
                return { error: "Credenciales inválidas" };
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return { error: "Usuario o contraseña incorrectos" };
            }

            if (!user.id || !user.email) {
                return { error: "Datos de usuario incompletos" };
            }

            const token = jwt.sign({ id: user.id }, "CLAVESECRETA123456@$PEMI", { expiresIn: "12h" });

            return { 
                token, 
                user: { 
                    id: user.id, 
                    email: user.email 
                } 
            };

        } catch (error) {
            console.error("Error al logear al usuario:", error);
            return { error: "Error interno del servidor" };
        }
    }

    

    public async registerUser(userData: {
    email: string;
    password: string;
    nombre: string;
    apellido: string;
    documento: number;
    rol?: number; 
}): Promise<{ user?: User; error?: string }> {
    try {
        const existing = await this.userRepository.findOne({ 
            where: { email: userData.email } 
        });
        if (existing) {
            return { error: 'Ya existe un usuario registrado con ese correo electrónico.' };
        }

        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
        
        // Crear el usuario sin el campo rol
        const newUser = this.userRepository.create({
            email: userData.email,
            password: hashedPassword,
            nombre: userData.nombre,
            apellido: userData.apellido,
            documento: userData.documento,
            isVerified: false,
            verificationCode: verificationCode
        });

        const savedUser = await this.userRepository.save(newUser);

        // Manejar el rol por separado
        const roleId = userData.rol || 1; // Default a 1 si no se especifica
        const role = await this.rolesRepository.findOne({ 
            where: { id: roleId } 
        });
        
        if (!role) {
            return { error: 'Rol no encontrado.' };
        }

        const userRole = this.userPerRolesRepository.create({
            user: savedUser,
            role: role
        });

        await this.userPerRolesRepository.save(userRole);
        
        await emailService.sendVerificationCode(savedUser.email!, verificationCode);
        console.log(`Código de verificación para ${savedUser.email}: ${verificationCode}`);

        return { user: savedUser };
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        return { error: 'Error al registrar usuario.' };
    }
}



    public async verifyUser(email: string, code: string): Promise<{ 
        success: boolean; 
        error?: string;
        user?: User; 
    }> {
        try {
            const user = await this.userRepository.findOne({ where: { email } });
            
            if (!user) {
                return { success: false, error: 'Usuario no encontrado.' };
            }
            
            if (user.isVerified) {
                return { success: false, error: 'El usuario ya está verificado.' };
            }
            
            if (user.verificationCode !== code) {
                return { success: false, error: 'Código de verificación incorrecto.' };
            }
            
            user.isVerified = true;
            const updatedUser = await this.userRepository.save(user);
            
            return { success: true, user: updatedUser }; 
        } catch (error) {
            console.error('Error al verificar usuario:', error);
            return { success: false, error: 'Error al verificar usuario.' };
        }
    }


    public async updateUserProfile(
        userId: number, 
        updateData: { 
            nombre?: string; 
            apellido?: string; 
            documento?: number; 
            password?: string 
        }
    ): Promise<{ user?: User; error?: string }> {
        try {
            const user = await this.userRepository.findOne({ where: { id: userId } });
            
            if (!user) {
                return { error: 'Usuario no encontrado.' };
            }

            if (updateData.nombre) user.nombre = updateData.nombre;
            if (updateData.apellido) user.apellido = updateData.apellido;
            if (updateData.documento) user.documento = updateData.documento;


            if (updateData.password) {
                user.password = await bcrypt.hash(updateData.password, 10);
            }

            const updatedUser = await this.userRepository.save(user);
            
            return { user: updatedUser };
        } catch (error) {
            console.error('Error al actualizar perfil:', error);
            return { error: 'Error al actualizar perfil.' };
        }
    }


    public async getUserById(userId: number): Promise<User | null> {
    try {
        return await this.userRepository.findOne({ 
            where: { id: userId },
            select: ['id', 'nombre', 'apellido', 'email', 'documento']
        });
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        return null;
    }
}

    public async verifyUserPassword(
        userId: number, 
        currentPassword: string
    ): Promise<{ 
        isValid: boolean; 
        error?: string 
    }> {
        try {

        const user = await this.userRepository.findOne({
            where: { id: userId },
            select: ['id', 'password'] 
        });

        if (!user) {
            return { isValid: false, error: 'Usuario no encontrado' };
        }

        if (!user.password) {
            return { isValid: false, error: 'Credenciales inválidas' };
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        
        return { isValid: isMatch };
    } catch (error) {
        console.error('Error en verifyUserPassword:', error);
        return { isValid: false, error: 'Error al verificar contraseña' };
    }
}
    
}