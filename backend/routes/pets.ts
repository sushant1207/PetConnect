import { Router } from "express";
import { createPet, getPetsByOwner, getPetById, getPetByPetId, updatePet, deletePet } from "../controller/petController";

const router = Router();

/**
 * @swagger
 * /api/pets:
 *   post:
 *     tags: [Pets]
 *     summary: Register a pet
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Pet created
 *       400:
 *         description: Validation error
 */
router.post("/", createPet);

/**
 * @swagger
 * /api/pets/owner/{ownerId}:
 *   get:
 *     tags: [Pets]
 *     summary: Get pets for an owner
 *     parameters:
 *       - in: path
 *         name: ownerId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: includeInactive
 *         required: false
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *         description: Set to "true" to include inactive pets in the response
 *     responses:
 *       200:
 *         description: Owner pets list
 */
router.get("/owner/:ownerId", getPetsByOwner);

/**
 * @swagger
 * /api/pets/{id}:
 *   get:
 *     tags: [Pets]
 *     summary: Get pet by database ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pet details
 *       404:
 *         description: Pet not found
 */
router.get("/:id", getPetById);

/**
 * @swagger
 * /api/pets/petId/{petId}:
 *   get:
 *     tags: [Pets]
 *     summary: Get pet by public petId
 *     parameters:
 *       - in: path
 *         name: petId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pet details
 *       404:
 *         description: Pet not found
 */
router.get("/petId/:petId", getPetByPetId);

/**
 * @swagger
 * /api/pets/{id}:
 *   put:
 *     tags: [Pets]
 *     summary: Edit pet details or mark pet as inactive
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               species:
 *                 type: string
 *               breed:
 *                 type: string
 *               age:
 *                 type: number
 *               gender:
 *                 type: string
 *               color:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *                 description: Set false to soft delete (inactive) pet record
 *     responses:
 *       200:
 *         description: Pet updated
 *       404:
 *         description: Pet not found
 */
router.put("/:id", updatePet);

/**
 * @swagger
 * /api/pets/{id}:
 *   delete:
 *     tags: [Pets]
 *     summary: Permanently delete a pet record
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pet deleted
 *       404:
 *         description: Pet not found
 */
router.delete("/:id", deletePet);

export default router;

