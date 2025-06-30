import { TicketTypeDTO } from "../TicketTypes/TicketTypeDTO"

export interface EventDTO {
    nombre: string,
    ubicacion: string,
    descripcion: string,
    aforo: number,
    fecha: Date,
    responsable: number
    ticketTypes: TicketTypeDTO[]
}