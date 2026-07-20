import { AutoIncrement, BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import { User } from "src/users/user.model";

@Table({})
export class AttendanceModel extends Model{
    @PrimaryKey
    @AutoIncrement
    @Column({
        type: DataType.INTEGER,
    })
    declare attendanceId: number;

    @ForeignKey(()=> User)
    @Column({
        type: DataType.INTEGER,
    })
    declare userId: number;

    @BelongsTo(()=> User)
    declare user: User;

    @Column({
        type: DataType.DATEONLY,
    })
    declare date: string;

    @Column({
        type: DataType.DATE,
    })
    declare checkIn: Date;

    @Column({
        type: DataType.DATE,
    })
    declare checkOut: Date;

    @Column({
        type: DataType.FLOAT,
    })
    declare hours: number;


}