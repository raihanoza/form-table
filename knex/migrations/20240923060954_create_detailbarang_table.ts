import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('detail_barang',function(table){
        table.increments('id').primary();
        table.string('nama').notNullable();
        table.timestamp('createdAt').defaultTo(knex.fn.now());
        table.timestamp('updatedAt').defaultTo(knex.fn.now());
      })
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('barang');
}

