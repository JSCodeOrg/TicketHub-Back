import { Repository } from "typeorm";
import { User } from "../entities/User";
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';


export class UserService {
    private userRepository: Repository<User>;

    constructor(userRepository: Repository<User>) {
        this.userRepository = userRepository;
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
}