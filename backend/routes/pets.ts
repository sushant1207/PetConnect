import { Router } from "express";
import { createPet, getPetsByOwner, getPetById, getPetByPetId, updatePet, deletePet } from "../controller/petController";

const router = Router();

router.post("/", createPet);
router.get("/owner/:ownerId", getPetsByOwner);
router.get("/:id", getPetById);
router.get("/petId/:petId", getPetByPetId);
router.put("/:id", updatePet);
router.delete("/:id", deletePet);

export default router;

