import { Repository } from "typeorm";
import { Ticket } from "../entities/Ticket";
import { TicketTypes } from "../entities/Ticket_Types";
import { EventDTO } from "../dtos/Event/EventDTO";
import jwt from 'jsonwebtoken';
import { User } from "../entities/User";
import { UserPerRoles } from "../entities/users_per_roles";
import { Eventos } from "../entities/Event";
import { EventSummaryDTO } from "../dtos/Event/EventSummaryDTO";

export class EventService {


    private eventRepository: Repository<Eventos>;
    private ticketRepository: Repository<Ticket>
    private ticketTypeRep: Repository<TicketTypes>;
    private secretkey = "CLAVESECRETA123456@$PEMI"
    private userRepository: Repository<User>;
    private userPerRolesRepository: Repository<UserPerRoles>;

    constructor(eventRepository: Repository<Eventos>, ticketRepository: Repository<Ticket>, ticketTypeRepository: Repository<TicketTypes>, userRepository: Repository<User>, userPerRolesRepository: Repository<UserPerRoles>) {
        this.eventRepository = eventRepository;
        this.ticketRepository = ticketRepository;
        this.ticketTypeRep = ticketTypeRepository;
        this.userRepository = userRepository;
        this.userPerRolesRepository = userPerRolesRepository;
    }

    public async createEvent(eventData: EventDTO, userToken: string) {

        const token = userToken.substring(7);
        const decoded = jwt.verify(token, this.secretkey) as jwt.JwtPayload;

        const userId = decoded.id;

        const user: User | null = await this.userRepository.findOne({ where: { id: userId } });

        if (!user) {
            return { error: "El usuario creador no se ha encontrado" }
        }

        const userPerRole = await this.userPerRolesRepository.findOne({
            where: {
                user: { id: userId },
                role: { id: 2 }
            }
        });

        if (!userPerRole) {
            return { error: "El usuario no tiene permisos para crear eventos" }
        }

        const sumaCantidadTotal = eventData.ticketTypes.reduce((sum, t) => sum + t.cantidad_total, 0);

        if (sumaCantidadTotal !== eventData.aforo) {
            return { error: `La suma de los tickets (${sumaCantidadTotal}) no coincide con el aforo del evento (${eventData.aforo})` };
        }

        const newEvent = this.eventRepository.create({
            nombre: eventData.nombre.toString(),
            descripcion: eventData.descripcion.toString(),
            aforo: eventData.aforo,
            fecha: new Date(eventData.fecha),
            responsable: user
        });

        const savedEvent = await this.eventRepository.save(newEvent);


        const ticketTypes = eventData.ticketTypes.map(ticketType => this.ticketTypeRep.create({
            nombre: ticketType.nombre,
            precio: ticketType.precio,
            cantidad_total: ticketType.cantidad_total,
            cantidad_disponible: ticketType.cantidad_total, // todos disponibles al inicio
            evento: savedEvent
        }));

        await this.ticketTypeRep.save(ticketTypes);

        return savedEvent;

    }

    public async getRandomEvents(): Promise<EventSummaryDTO[]> {
        try {
            const events = await this.eventRepository
                .createQueryBuilder("event")
                .leftJoinAndSelect("event.responsable", "responsable")
                .orderBy("RANDOM()") 
                .limit(5)
                .getMany();

            const eventDTOs: EventSummaryDTO[] = events.map(event => ({
                nombre: event.nombre!,
                banner: event["banner"] || "https://via.placeholder.com/600x300.png?text=Evento",
                descripcion: event.descripcion!,
                fecha: event.fecha!,
                responsable: {
                    nombre: event.responsable?.nombre!,
                    foto: event.responsable?.foto
                }
            }));

            return eventDTOs;

        } catch (error) {
            console.error("Error al obtener eventos aleatorios:", error);
            throw new Error("Error al obtener eventos aleatorios");
        }
    }
}