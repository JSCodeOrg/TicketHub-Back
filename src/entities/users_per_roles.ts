import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from './User'; // Assuming User is in the same directory or adjust path
import { Roles } from './Roles'; // Assuming Roles is in the same directory or adjust path

@Entity('Roles_Usuarios')
export class UserPerRoles {
    @PrimaryGeneratedColumn()
    id?: number;

    @ManyToOne(() => User, user => user.userPerRoles)
    @JoinColumn({ name: 'user_id' })
    user?: User;

    @ManyToOne(() => Roles, role => role.userPerRoles)
    @JoinColumn({ name: 'role_id' }) 
    role?: Roles; 

}