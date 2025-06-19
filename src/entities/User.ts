import { Entity, Column, OneToOne, JoinColumn, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { UserPerRoles } from './users_per_roles';

@Entity('Usuarios')
export class User {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column()
    email?: string;

    @Column()
    password?: string;

    @Column()
    nombre?: string;

    @Column()
    apellido?: string;

    @Column()
    documento?: number;

    @Column()
    foto?: string;

    @OneToMany(() => UserPerRoles, userPerRoles => userPerRoles.user)
    userPerRoles?: UserPerRoles[];


    
}



