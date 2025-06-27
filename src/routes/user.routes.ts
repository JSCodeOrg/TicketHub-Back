import { Router } from 'express';
import { AppDataSource } from '../database/dbconnection';
import { UserService } from '../services/UserService';
import { UserController } from '../controllers/user.controller';
import { User } from '../entities/User';
import { UserPerRoles } from '../entities/users_per_roles';
import { Roles } from '../entities/Roles';
import { EventController } from '../controllers/event.controller';
import { EventService } from '../services/event.service';
import { Eventos } from '../entities/Event';
import { Ticket } from '../entities/Ticket';
import { TicketTypes } from '../entities/Ticket_Types';

const router = Router();

const userRepository = AppDataSource.getRepository(User);
const rolesRepository = AppDataSource.getRepository(Roles);
const userPerRolesRepository = AppDataSource.getRepository(UserPerRoles);
const eventRepository = AppDataSource.getRepository(Eventos);
const ticketRepository = AppDataSource.getRepository(Ticket);
const ticketTipeRepository = AppDataSource.getRepository(TicketTypes);

const userService = new UserService(userRepository, rolesRepository, userPerRolesRepository);
const userController = new UserController(userService);
const eventService = new EventService(eventRepository, ticketRepository, ticketTipeRepository, userRepository, userPerRolesRepository);
const eventController = new EventController(eventService);

router.post('/auth/login', (req, res) => userController.login(req, res));
router.post('/register', (req, res) => userController.register(req, res));
router.post('/auth/verify', (req, res) => userController.verify(req, res));
router.post('/eventos', (req,res) => eventController.createEvent(req, res));
router.get('/eventos', (req,res) => eventController.getEvents(req, res));
export default router;
