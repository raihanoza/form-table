exports.up = function(knex) {
  return knex.schema.createTable('pengiriman', function(table) {
    table.increments('id').primary();
    table.string('namaPengirim').notNullable();
    table.string('alamatPengirim').notNullable();
    table.string('nohpPengirim').notNullable();
    table.string('namaPenerima').notNullable();
    table.string('alamatPenerima').notNullable();
    table.string('nohpPenerima').notNullable();
    // Mengubah tipe kolom totalHarga menjadi DECIMAL(15, 2)
    table.decimal('totalHarga', 15, 2).notNullable();
    table.dateTime('tanggalKeberangkatan').notNullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('pengiriman');
};
