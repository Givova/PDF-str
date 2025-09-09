import { Controller, Get, Param, Query } from "@nestjs/common"
import { VehiclesService } from "./vehicles.service"

@Controller()
export class VehiclesController {
	constructor(private readonly vehicles: VehiclesService) {}

	@Get("vehicle-brands")
	brands() {
		return this.vehicles.getBrands()
	}

	@Get("vehicle-models/:brand_id")
	models(@Param("brand_id") brandId: string) {
		return this.vehicles.getModels(brandId)
	}

	@Get("search-vehicles")
	search(@Query("q") q?: string) {
		return this.vehicles.search(q ?? "")
	}
}
