import { Entity, Column, OneToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('Usuarios')
export class User {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column()
    username?: string;

    @Column()
    password?: string;
}



