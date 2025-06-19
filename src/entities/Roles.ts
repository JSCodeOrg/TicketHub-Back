import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { UserPerRoles } from "./users_per_roles";


@Entity('Roles')
export class Roles {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column()
    nombre?: string;

    @OneToMany(() => UserPerRoles, userPerRoles => userPerRoles.role)
    userPerRoles?: UserPerRoles[];

}
