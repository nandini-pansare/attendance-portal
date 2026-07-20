import { AutoIncrement, Column, DataType, Model, PrimaryKey, Table } from "sequelize-typescript";

@Table({})
export class NotificationImage extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column({ type: DataType.INTEGER })
    declare id: number;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare imageUrl: string;
    
    @Column({ type: DataType.STRING, allowNull: false, defaultValue: 'image/png' })
    declare mimeType: string;
}