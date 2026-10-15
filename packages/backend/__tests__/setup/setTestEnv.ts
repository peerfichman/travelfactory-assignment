// Must run before any module is loaded — sets test DB so AppDataSource connects to it
process.env.POSTGRES_DB = process.env.POSTGRES_DB_TEST ?? 'travelfactory_test';
process.env.NODE_ENV = 'test';
