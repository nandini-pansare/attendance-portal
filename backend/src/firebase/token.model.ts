import { AutoIncrement, BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import { User } from "src/users/user.model";

@Table({})
export class DeviceTokens extends Model{

    @PrimaryKey
    @AutoIncrement
    @Column({
        type: DataType.INTEGER,
    })
    declare id: number;

    @ForeignKey(()=> User)
    @Column({
        type: DataType.INTEGER,
    })
    declare userId: number;

    @BelongsTo(()=> User)
    declare user: User;

    @Column({
        type: DataType.STRING,
    })
    declare token: string;
}