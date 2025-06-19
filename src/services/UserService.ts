import { Repository } from "typeorm";
import { User } from "../entities/User";
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { Roles } from "../entities/Roles";
import { UserPerRoles } from "../entities/users_per_roles";


export class UserService {

    private userRepository: Repository<User>;
    private rolesRepository: Repository<Roles>;
    private userPerRolesRepository: Repository<UserPerRoles>;

    constructor(userRepository: Repository<User>, rolesRepository: Repository<Roles>, userPerRolesRepository: Repository<UserPerRoles>) {
        this.userRepository = userRepository;
        this.rolesRepository = rolesRepository;
        this.userPerRolesRepository = userPerRolesRepository;
    }


    public async loginUser(email: string, password: string): Promise<{ token?: string; error?: string }> {

        try {
            const user = await this.userRepository.findOne({ where: { email } });

            if (!user || !user.password) {
                return { error: "Usuario no enconrado" };
            }

            const encrypted_password = await bcrypt.compare(password, user.password);

            if (!encrypted_password) {
                return { error: "Usuario o contraseña incorrectos" };
            }

            const token = jwt.sign({ id: user.id }, "CLAVESECRETA123456@$PEMI", { expiresIn: "12h" })

            return { token };

        } catch (error) {
            console.error("Error al logear al usuario:", error);
            return { error: "Error interno del servidor" }

        }
    }

    public async registerUser(userData: Partial<User>): Promise<{ user?: User; error?: string }> {
        try {
            const existing = await this.userRepository.findOne({ where: { email: userData.email } });
            if (existing) {
                return { error: 'Ya existe un usuario registrado con ese correo electrónico.' };
            }

            const hashedPassword = await bcrypt.hash(userData.password || '', 10);
            const newUser = this.userRepository.create({
                ...userData,
                password: hashedPassword,
            });
            const savedUser = await this.userRepository.save(newUser);

            const defaultRole = await this.rolesRepository.findOne({ where: { nombre: 'usuario' } });
            if (!defaultRole) {
                return { error: 'Rol por defecto "usuario" no encontrado.' };
            }

            const userRole = this.userPerRolesRepository.create({
                user: savedUser,
                role: defaultRole,
            });

            await this.userPerRolesRepository.save(userRole);

            return { user: savedUser };
        } catch (error) {
            console.error('Error al registrar usuario:', error);
            return { error: 'Error al registrar usuario.' };
        }
    }
}