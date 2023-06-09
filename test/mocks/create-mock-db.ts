import { ModelCtor, Sequelize } from 'sequelize-typescript';

export async function createMockDB(models: ModelCtor[]): Promise<Sequelize> {
  const memDb = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
  });
  memDb.addModels(models);

  await memDb.sync();

  return memDb;
}
