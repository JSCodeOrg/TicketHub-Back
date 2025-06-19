// Ticket.ts
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { TicketTypes } from "./Ticket_Types";
import { User } from "./User";

@Entity('Tickets') 
export class Ticket {

    @PrimaryGeneratedColumn()
    id?: number;
    
    @ManyToOne(() => TicketTypes)
    @JoinColumn({ name: 'tipo_ticket_id' })
    tipoTicket?: TicketTypes;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'usuario_id' }) 
    usuario?: User;

    @Column()
    estado?: string;
}