import { Injectable } from "@nestjs/common"
import * as fs from "fs"
import * as path from "path"

@Injectable()
export class VehiclesService {
	private readonly modelsPath = path.resolve(
		process.cwd(),
		"..",
		"data",
		"models.json"
	)
	private cache: any | null = null
	private cacheAt = 0
	private ttlMs = 5 * 60 * 1000

	private ensureLoaded() {
		const now = Date.now()
		if (this.cache && now - this.cacheAt < this.ttlMs) return
		const raw = fs.readFileSync(this.modelsPath, "utf-8")
		this.cache = JSON.parse(raw)
		this.cacheAt = now
	}

	getBrands() {
		this.ensureLoaded()
		const brands = (this.cache?.data || []).map((b: any) => ({
			id: b.id,
			name: b.name,
			cyrillic_name: b.cyrillic_name ?? b.name,
		}))
		return { brands }
	}

	getModels(brandId: string) {
		this.ensureLoaded()
		const upper = (brandId || "").toUpperCase()
		const brand = (this.cache?.data || []).find((b: any) => b.id === upper)
		const models = (brand?.models || []).map((m: any) => ({
			id: m.id,
			name: m.name,
			cyrillic_name: m.cyrillic_name ?? m.name,
			full_name: `${brand.name} ${m.name}`,
		}))
		return { models }
	}

	search(query: string) {
		this.ensureLoaded()
		const q = (query || "").trim().toLowerCase()
		if (!q || q.length < 2) return { results: [] }
		const results: any[] = []
		for (const brand of this.cache?.data || []) {
			const brandName = brand.name.toLowerCase()
			const brandCyr = (brand.cyrillic_name || "").toLowerCase()
			if (brandName.includes(q) || brandCyr.includes(q)) {
				results.push({
					type: "brand",
					value: brand.name,
					label: `${brand.name} (${brand.cyrillic_name || brand.name})`,
				})
			}
			for (const model of brand.models || []) {
				const modelName = model.name.toLowerCase()
				const modelCyr = (model.cyrillic_name || "").toLowerCase()
				const full = `${brand.name} ${model.name}`.toLowerCase()
				if (modelName.includes(q) || modelCyr.includes(q) || full.includes(q)) {
					results.push({
						type: "model",
						value: `${brand.name} ${model.name}`,
						label: `${brand.name} ${model.name} (${
							model.cyrillic_name || model.name
						})`,
					})
				}
			}
		}
		return { results: results.slice(0, 20) }
	}
}
