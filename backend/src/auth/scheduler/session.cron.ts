import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { SessionModel } from "../session.model";
import { InjectModel } from "@nestjs/sequelize";
import { Op } from "sequelize";


@Injectable()
export class SessionCron{
    constructor(
        @InjectModel(SessionModel)
        private readonly sessionModel: typeof SessionModel,
    ){}

    @Cron('0 8 * * *')
    async removeExpiredSessions() {
        const expiryTime = new Date(Date.now() - 15 * 60 * 1000);
        await this.sessionModel.destroy({
            where: {
                 lastActive: {
                    [Op.lt]: expiryTime,
                },
            },
        });
    }
}