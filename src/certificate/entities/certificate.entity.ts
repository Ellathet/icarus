import {
  Model,
  Table,
  Column,
  PrimaryKey,
  DataType,
  BeforeUpdate,
  BeforeCreate,
  CreatedAt,
  UpdatedAt,
  Scopes,
  DefaultScope,
} from 'sequelize-typescript';
import { CryptoService } from '../../common/crypto/crypto.service';

export const WITH_PASSWORD_SCOPE = 'withPassword';

@DefaultScope(() => ({
  attributes: {
    exclude: ['password'],
  },
}))
@Scopes(() => ({
  [WITH_PASSWORD_SCOPE]: {
    attributes: {
      include: ['password'],
    },
  },
}))
@Table({
  tableName: 'certificate',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Certificate extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  public id: string;

  @Column({
    type: DataType.STRING,
    unique: true,
  })
  public key: string;

  @Column({
    type: DataType.STRING,
  })
  public password: string;

  @BeforeUpdate
  @BeforeCreate
  static hashPassword(instance: Certificate) {
    const crypto = new CryptoService();
    instance.dataValues.password = crypto.encrypt(instance.dataValues.password);
  }

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
