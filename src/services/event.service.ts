import { Repository } from "typeorm";
import { Ticket } from "../entities/Ticket";
import { TicketTypes } from "../entities/Ticket_Types";
import { EventDTO } from "../dtos/Event/EventDTO";
import jwt from 'jsonwebtoken';
import { User } from "../entities/User";
import { UserPerRoles } from "../entities/users_per_roles";
import { Eventos } from "../entities/Event";
import { EventSummaryDTO } from "../dtos/Event/EventSummaryDTO";
import { DataSource } from "typeorm";



export class EventService {


    private eventRepository: Repository<Eventos>;
    private ticketRepository: Repository<Ticket>
    private ticketTypeRep: Repository<TicketTypes>;
    private secretkey = "CLAVESECRETA123456@$PEMI"
    private userRepository: Repository<User>;
    private userPerRolesRepository: Repository<UserPerRoles>;
    private datasource: DataSource;

    constructor(eventRepository: Repository<Eventos>, ticketRepository: Repository<Ticket>, ticketTypeRepository: Repository<TicketTypes>, userRepository: Repository<User>, userPerRolesRepository: Repository<UserPerRoles>, datasource: DataSource) {
        this.eventRepository = eventRepository;
        this.ticketRepository = ticketRepository;
        this.ticketTypeRep = ticketTypeRepository;
        this.userRepository = userRepository;
        this.userPerRolesRepository = userPerRolesRepository;
        this.datasource = datasource;
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

    
    public async getRandomEvents(): Promise<EventDTO[]> {
    try {
        const events = await this.eventRepository
            .createQueryBuilder("event")
            .leftJoinAndSelect("event.responsable", "responsable")
            .leftJoinAndSelect("event.ticketTypes", "ticketTypes")
            .orderBy("RANDOM()")
            .limit(5)
            .getMany();

        return events.map(event => {
            if (!event.responsable) {
                throw new Error("Evento sin responsable asignado");
            }

            return {
                nombre: event.nombre || 'Evento sin nombre',
                banner: event.banner || "",
                descripcion: event.descripcion || 'Sin descripción',
                fecha: event.fecha || new Date(),
                aforo: event.aforo || 0,
                ubicacion: event.ubicacion || event.responsable.nombre || 'Ubicación no disponible',
                responsable: {
                    id: event.responsable.id!, // ← aquí va el "!"
                    nombre: event.responsable.nombre || 'Responsable sin nombre',
                    foto: event.responsable.foto
                },
                ticketTypes: event.ticketTypes?.map(ticket => ({
                    id: ticket.id || 0,
                    nombre: ticket.nombre || 'Ticket sin nombre',
                    precio: ticket.precio || 0,
                    cantidad_total: ticket.cantidad_total || 0,
                    cantidad_disponible: ticket.cantidad_disponible || 0
                })) || []
            };
        });
    } catch (error) {
        console.error("Error al obtener eventos aleatorios:", error);
        throw new Error("Error al obtener eventos aleatorios");
    }
}


    public async updateEvent(eventId: number, eventData: EventDTO, userToken: string) {
        const token = userToken.substring(7);
        const decoded = jwt.verify(token, this.secretkey) as jwt.JwtPayload;
        const userId = decoded.id;

        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            return { error: "Usuario no encontrado." };
        }

        const event = await this.eventRepository.findOne({
            where: { id: eventId },
            relations: ['responsable', 'ticketTypes']
        });

        if (!event) {
            return { error: "Evento no encontrado." };
        }

        if (event.responsable?.id !== user.id) {
            return { error: "No tienes permisos para actualizar este evento." };
        }

        const vendidos = await this.ticketRepository.count({
            where: { tipoTicket: { evento: { id: eventId } } }
        });

        if (eventData.aforo < vendidos) {
            return { error: `No puedes establecer un aforo menor a los ${vendidos} tickets ya vendidos.` };
        }

        return await this.datasource.transaction(async manager => {
            event.nombre = eventData.nombre || event.nombre;
            event.descripcion = eventData.descripcion || event.descripcion;
            event.aforo = eventData.aforo || event.aforo;
            event.fecha = eventData.fecha ? new Date(eventData.fecha) : event.fecha;

            await manager.save(event);
            const existingTypes = event.ticketTypes || [];
            const incomingTypes = eventData.ticketTypes || [];

            for (const incomingType of incomingTypes) {
                const existingType = existingTypes.find(et => et.id === incomingType.id);

                if (existingType) {
                   
                    const vendidosTipo = await this.ticketRepository.count({
                        where: { tipoTicket: { id: existingType.id } }
                    });

                    if (incomingType.cantidad_total < vendidosTipo) {
                        throw new Error(`No puedes reducir el total de ${existingType.nombre} por debajo de los ${vendidosTipo} vendidos.`);
                    }

                    existingType.nombre = incomingType.nombre || existingType.nombre;
                    existingType.precio = incomingType.precio ?? existingType.precio;
                    existingType.cantidad_total = incomingType.cantidad_total;
                    existingType.cantidad_disponible = incomingType.cantidad_disponible ?? existingType.cantidad_disponible;

                    await manager.save(existingType);
                } else {
                    const nuevo = this.ticketTypeRep.create({
                        nombre: incomingType.nombre,
                        precio: incomingType.precio,
                        cantidad_total: incomingType.cantidad_total,
                        cantidad_disponible: incomingType.cantidad_total,
                        evento: event
                    });
                    await manager.save(nuevo);
                }
            }

            for (const existingType of existingTypes) {
                if (!incomingTypes.find(it => it.id === existingType.id)) {
                    const vendidosTipo = await this.ticketRepository.count({
                        where: { tipoTicket: { id: existingType.id } }
                    });
                    if (vendidosTipo > 0) {
                        throw new Error(`No puedes eliminar el tipo de ticket ${existingType.nombre} porque ya tiene ventas.`);
                    }
                    await manager.delete(TicketTypes, existingType.id);
                }
            }

            return event;
        });
    }












    public async getEventsByUser(userId: number): Promise<Eventos[]> {
    try {
        return await this.eventRepository.find({
            where: { responsable: { id: userId } },
            relations: ['responsable', 'ticketTypes']
        });
    } catch (error) {
        console.error("Error al obtener eventos del usuario:", error);
        throw new Error("Error al obtener eventos del usuario");
    }
}
}