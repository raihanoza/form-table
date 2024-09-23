exports.up = function(knex) {
    return knex.schema.createTable('barang', function(table) {
      table.increments('id').primary();
      table.string('namaBarang').notNullable();
      table.integer('jumlahBarang').notNullable();
      table.float('harga').notNullable();
      table.integer('pengirimanId')
        .unsigned()
        .references('id')
        .inTable('pengiriman')
        .onDelete('CASCADE')
        .notNullable();
      table.timestamp('createdAt').defaultTo(knex.fn.now());
      table.timestamp('updatedAt').defaultTo(knex.fn.now());
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('barang');
  };
  