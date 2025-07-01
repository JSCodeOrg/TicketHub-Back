import { Request, Response } from "express";
import { TicketTypes } from "../entities/Ticket_Types";
import { EventService } from "../services/event.service";
import { UserService } from "../services/UserService";
import { EventDTO } from "../dtos/Event/EventDTO";


export class EventController {

    eventService: EventService;

    constructor(eventService: EventService) {
        this.eventService = eventService;
    }

    public async createEvent(req: Request, res: Response): Promise<void> {
        const eventData: EventDTO = req.body;
        const { authorization } = req.headers;

        if (
            !eventData.aforo ||
            !eventData.descripcion ||
            !eventData.fecha ||
            !eventData.nombre ||
            !eventData.responsable ||
            !Array.isArray(eventData.ticketTypes) ||
            eventData.ticketTypes.length === 0
        ) {
            res.status(400).json({ message: "Falta información para crear el evento." });
            return;
        }

        if (!authorization || !authorization.startsWith('Bearer ')) {
            res.status(400).json({ message: 'Falta el token de usuario.' });
            return;
        }

        try {
            const new_event = await this.eventService.createEvent(eventData, authorization);

            if ((new_event as any).error) {
                res.status(400).json({ message: (new_event as any).error });
                return;
            }

            res.status(200).json({
                message: "Nuevo evento creado con éxito.",
                event: new_event
            });

        } catch (error) {
            res.status(500).json({ message: "Error interno al crear el evento.", error: (error as Error).message });
        }
    }

    public async getEvents(req: Request, res: Response): Promise<void> {
        const { authorization } = req.headers;

        if (!authorization || !authorization.startsWith('Bearer ')) {
            res.status(400).json({ message: 'Falta el token de usuario.' });
            return;
        }

        try {
            const events = await this.eventService.getRandomEvents();

            res.status(200).json({
                message: "Eventos obtenidos con éxito.",
                events
            });

        } catch (error) {
            res.status(500).json({ message: "Error interno al obtener los eventos.", error: (error as Error).message });
        }
    }

    public async updateEvent(req: Request, res: Response): Promise<void> {
        const eventData: EventDTO = req.body;
        const eventId: number = Number(req.params.id);  

        const { authorization } = req.headers;

        if (!authorization || !authorization.startsWith('Bearer ')) {
            res.status(403).json({ message: "El usuario no está autenticado." });
            return;
        }

        if (!eventData) {
            res.status(400).json({ message: "Se requiere la información del evento." });
            return;
        }

        try {
            const editedEvent = await this.eventService.updateEvent(eventId, eventData, authorization);

            if ((editedEvent as any).error) {
                res.status(400).json({ message: (editedEvent as any).error });
                return;
            }

            res.status(200).json({
                message: "Evento actualizado con éxito.",
                event: editedEvent
            });
        } catch (error) {
            console.error("Error al actualizar evento:", error);
            res.status(500).json({ message: "Error interno al actualizar el evento.", error: (error as Error).message });
        }
    }
}