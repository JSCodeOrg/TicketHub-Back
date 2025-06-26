import { Router } from 'express';
import { AppDataSource } from '../database/dbconnection';
import { UserService } from '../services/UserService';
import { UserController } from '../controllers/user.controller';
import { User } from '../entities/User';
import { UserPerRoles } from '../entities/users_per_roles';
import { Roles } from '../entities/Roles';

const router = Router();

const userRepository = AppDataSource.getRepository(User);
const rolesRepository = AppDataSource.getRepository(Roles);
const userPerRolesRepository = AppDataSource.getRepository(UserPerRoles);

const userService = new UserService(userRepository, rolesRepository, userPerRolesRepository);
const userController = new UserController(userService);

router.post('/auth/login', (req, res) => userController.login(req, res));
router.post('/auth/register', (req, res) => userController.register(req, res));
router.post('/auth/verify', (req, res) => userController.verify(req, res));
router.put('/auth/updateProfile', (req, res) => userController.updateProfile(req, res));
router.get('/auth/user/:id', (req, res) => userController.getUserProfile(req, res));

export default router;
