exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('users').del()
    .then(function () {
      // Inserts seed entries
      return knex('users').insert([
        { email: 'user1@example.com', password: '$2a$10$3SRwdyzJpdT7c3cUWTCXAejqK0B5DWBDBj5Ykxpx8VLMV6m6QoAcu', createdAt: knex.fn.now(), updatedAt: knex.fn.now() },
        { email: 'user2@example.com', password: '$2a$10$3SRwdyzJpdT7c3cUWTCXAejqK0B5DWBDBj5Ykxpx8VLMV6m6QoAcu', createdAt: knex.fn.now(), updatedAt: knex.fn.now() },
        { email: 'user3@example.com', password: '$2a$10$3SRwdyzJpdT7c3cUWTCXAejqK0B5DWBDBj5Ykxpx8VLMV6m6QoAcu', createdAt: knex.fn.now(), updatedAt: knex.fn.now() }
      ]);
    });
};
