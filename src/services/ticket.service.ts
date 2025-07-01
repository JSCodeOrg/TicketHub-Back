import { Repository } from "typeorm";
import { Eventos } from "../entities/Event";
import { Ticket } from "../entities/Ticket";
import { TicketTypes } from "../entities/Ticket_Types";

export class TicketService {

    private eventRepository: Repository<Eventos>;
    private ticketRepository: Repository<Ticket>;
    private ticketTypeRep: Repository<TicketTypes>;

    constructor(eventRepository: Repository<Eventos>, ticketRepository: Repository<Ticket>, ticketTypeRep: Repository<TicketTypes>) {
        this.eventRepository = eventRepository;
        this.ticketRepository = ticketRepository;
        this.ticketTypeRep = ticketTypeRep;

    }
    public async getTickets(EventId: number): Promise<{ nombre: string; cantidad_disponible: number }[]> {
        const ticketTypes = await this.ticketTypeRep.find({
            where: {
                evento: { id: EventId }
            },
            select: ['nombre', 'cantidad_disponible']
        });

        const result = ticketTypes.map(tt => ({
            nombre: tt.nombre ?? '',
            cantidad_disponible: tt.cantidad_disponible ?? 0
        }));

        return result;
    }
}