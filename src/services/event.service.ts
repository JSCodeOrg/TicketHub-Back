import { Repository } from "typeorm";
import { Ticket } from "../entities/Ticket";
import { TicketTypes } from "../entities/Ticket_Types";
import { EventDTO } from "../dtos/Event/EventDTO";
import jwt from 'jsonwebtoken';
import { User } from "../entities/User";
import { UserPerRoles } from "../entities/users_per_roles";
import { Eventos } from "../entities/Event";

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

    public async getAllEvents(): Promise<EventDTO[] | { message: string }> {
        try {
            const events = await this.eventRepository.find({
                relations: ['responsable', 'ticketTypes']
            });

            if (!events || events.length === 0) {
                return { message: "No hay eventos disponibles." };
            }

            const eventDTOs: EventDTO[] = events.map(event => ({
                id: event.id!,
                nombre: event.nombre!,
                descripcion: event.descripcion!,
                aforo: event.aforo!,
                fecha: event.fecha!,
                responsable: {
                    id: event.responsable?.id!,
                    nombre: event.responsable?.nombre!,
                    foto: event.responsable?.foto 
                },
                ticketTypes: event.ticketTypes?.map(tt => ({
                    id: tt.id!,
                    nombre: tt.nombre!,
                    precio: tt.precio!,
                    cantidad_total: tt.cantidad_total!,
                    cantidad_disponible: tt.cantidad_disponible!
                })) || []
            }));

            return eventDTOs;

        } catch (error) {
            console.error('Error al obtener eventos:', error);
            throw new Error('Error al obtener eventos');
        }
    }
}