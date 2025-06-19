import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Eventos } from "./Event";


@Entity('Tipos_tickets')
export class TicketTypes {
    @PrimaryGeneratedColumn()
    id?: number;

    @ManyToOne(() => Eventos, evento => evento.ticketTypes)
    @JoinColumn({ name: 'evento_id' })
    evento?: Eventos;

    @Column()
    nombre?: string;

    @Column('decimal', { precision: 10, scale: 2 })
    precio?: number;

    @Column()
    cantidad_total?: number;

    @Column()
    cantidad_disponible?: number;

    
}