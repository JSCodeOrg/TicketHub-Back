import { TicketTypeDTO } from "../TicketTypes/TicketTypeDTO"

export interface EventDTO {

    nombre: string,
    descripcion: String,
    aforo: number,
    fecha: Date,
    responsable: number
    ticketTypes: TicketTypeDTO[]

}