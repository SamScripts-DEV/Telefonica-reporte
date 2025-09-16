import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { FormsService } from "./forms.service";

@Injectable()
export class FormsSchedulerService {
    private readonly logger = new Logger(FormsSchedulerService.name)


    constructor(private readonly formsService: FormsService) {}

    @Cron(CronExpression.EVERY_HOUR)
    async checkPeriodicForms() {
        this.logger.debug('Checking periodic forms...');

        try {
            await this.formsService.checkAndUpdatePeriodicForms();
            this.logger.log('Periodic forms check completed.');
            
        } catch (error) {
            this.logger.error('Error checking periodic forms:', error.message);
        }
    }

    @Cron('0 6 * * *')
    async dailyFormsCheck() {
        this.logger.log('Performing daily forms check...');
        await this.formsService.checkAndUpdatePeriodicForms();
    }



    @Cron('0 0 * * 0')
    async midnightFormsCheck() {
        this.logger.log('Performing weekly forms check at midnight on Sunday...');
        await this.formsService.checkAndUpdatePeriodicForms();
    }
}