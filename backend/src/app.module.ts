import { Module } from "@nestjs/common"
import { PdfModule } from "./pdf/pdf.module"
import { UtilsModule } from "./utils/utils.module"
import { VehiclesModule } from "./vehicles/vehicles.module"

@Module({
	imports: [PdfModule, UtilsModule, VehiclesModule],
})
export class AppModule {}
