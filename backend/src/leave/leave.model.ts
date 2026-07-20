import { AutoIncrement, BelongsTo, Column, DataType, ForeignKey, IsEmail, Model, PrimaryKey, Table } from "sequelize-typescript";
import { LeaveStatus } from "src/common/enums/leave-status.enum";
import { LeaveType } from "src/common/enums/leave-type.enum";
import { User } from "src/users/user.model";

@Table({})
export class LeaveModel extends Model{
    @PrimaryKey
    @AutoIncrement
    @Column({
        type: DataType.INTEGER,
    })
    declare leaveId: number;

    @ForeignKey(()=> User)
    @Column({
        type: DataType.INTEGER,
    })
    declare userId: number;

    @BelongsTo(()=> User)
    declare user: User;

    
    @Column({
        type: DataType.STRING
    })
    declare email: string;

    @Column({
        type: DataType.DATEONLY,
        allowNull: false,
    })
    declare start: string;

    @Column({
        type: DataType.DATEONLY,
        allowNull: false,
    })
    declare end: string;

    @Column({
        type: DataType.ENUM(...Object.values(LeaveType)),
        allowNull: false,
    })
    declare leaveType: LeaveType;

    @Column({
        type: DataType.TEXT,
        allowNull: false,
    })
    declare reason: string;

    @Column({
        type: DataType.ENUM(...Object.values(LeaveStatus)),
        defaultValue: LeaveStatus.PENDING,
        allowNull: false,
    })
    declare status: LeaveStatus;
}