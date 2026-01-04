import { Request, Response } from "express";
import Pet from "../models/Pet";
import mongoose from "mongoose";

export async function createPet(req: Request, res: Response) {
	try {
		const { ownerId, name, species, breed, age, gender, color, microchipped, vaccinations, notes } = req.body;

		if (!ownerId || !name || !species) {
			return res.status(400).json({ message: "ownerId, name, and species are required" });
		}

		// Generate unique petId if not provided
		let petId = req.body.petId;
		if (!petId) {
			const timestamp = Date.now().toString(36).toUpperCase();
			const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
			petId = `PET${timestamp}${random}`;
		}

		const pet = await Pet.create({
			ownerId,
			petId,
			name,
			species,
			breed,
			age,
			gender,
			color,
			microchipped,
			vaccinations,
			notes
		});

		return res.status(201).json({ message: "Pet registered successfully", pet });
	} catch (error: any) {
		console.error("Create pet error:", error);
		if (error.code === 11000) {
			return res.status(409).json({ message: "Pet ID already exists" });
		}
		return res.status(500).json({ message: error.message || "Failed to create pet" });
	}
}

export async function getPetsByOwner(req: Request, res: Response) {
	try {
		const { ownerId } = req.params;
		if (!ownerId) {
			return res.status(400).json({ message: "ownerId is required" });
		}

		const pets = await Pet.find({ ownerId }).sort({ createdAt: -1 });
		return res.json({ pets });
	} catch (error: any) {
		console.error("Get pets error:", error);
		return res.status(500).json({ message: "Failed to fetch pets" });
	}
}

export async function getPetById(req: Request, res: Response) {
	try {
		const { id } = req.params;
		const pet = await Pet.findById(id).populate("ownerId", "firstName lastName email");
		if (!pet) {
			return res.status(404).json({ message: "Pet not found" });
		}
		return res.json({ pet });
	} catch (error: any) {
		console.error("Get pet error:", error);
		return res.status(500).json({ message: "Failed to fetch pet" });
	}
}

export async function getPetByPetId(req: Request, res: Response) {
	try {
		const { petId } = req.params;
		const pet = await Pet.findOne({ petId }).populate("ownerId", "firstName lastName email phone");
		if (!pet) {
			return res.status(404).json({ message: "Pet not found" });
		}
		return res.json({ pet });
	} catch (error: any) {
		console.error("Get pet by petId error:", error);
		return res.status(500).json({ message: "Failed to fetch pet" });
	}
}

export async function updatePet(req: Request, res: Response) {
	try {
		const { id } = req.params;
		const updates = req.body;

		const pet = await Pet.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
		if (!pet) {
			return res.status(404).json({ message: "Pet not found" });
		}
		return res.json({ message: "Pet updated successfully", pet });
	} catch (error: any) {
		console.error("Update pet error:", error);
		return res.status(500).json({ message: "Failed to update pet" });
	}
}

export async function deletePet(req: Request, res: Response) {
	try {
		const { id } = req.params;
		const pet = await Pet.findByIdAndDelete(id);
		if (!pet) {
			return res.status(404).json({ message: "Pet not found" });
		}
		return res.json({ message: "Pet deleted successfully" });
	} catch (error: any) {
		console.error("Delete pet error:", error);
		return res.status(500).json({ message: "Failed to delete pet" });
	}
}

