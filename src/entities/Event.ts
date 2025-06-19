import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";
import { TicketTypes } from "./Ticket_Types";


@Entity('Eventos')
export class Eventos {

    @PrimaryGeneratedColumn()
    id?: number;

    @Column()
    nombre?: string;

    @Column()
    descripcion?: string;

    @Column()
    aforo?: number;

    @Column()
    fecha?: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'id_responsable' })
    responsable?: User;

    @OneToMany(() => TicketTypes, ticketType => ticketType.evento)
    ticketTypes?: TicketTypes[];


}