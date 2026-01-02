// Cube.js schema for User (foreign table from user service)
// Maps to: buyer_d_fdw_user_service.user (foreign table)

cube(`User`, {
  sql: `SELECT * FROM buyer_d_fdw_user_service."user"`,
  
  preAggregations: {
    main: {
      measures: [User.count],
      dimensions: [User.department],
      refreshKey: {
        sql: `SELECT MAX(updated_at) FROM buyer_d_fdw_user_service."user"`
      }
    }
  },
  
  measures: {
    count: {
      type: `count`,
      title: `User Count`,
      description: `Total number of users`
    }
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `string`,
      primaryKey: true,
      description: `Unique identifier for the user`
    },
    
    department: {
      sql: `department`,
      type: `string`,
      title: `Department`,
      description: `User's department name`
    },
    
    firstName: {
      sql: `first_name`,
      type: `string`,
      title: `First Name`,
      description: `User's first name`
    },
    
    lastName: {
      sql: `last_name`,
      type: `string`,
      title: `Last Name`,
      description: `User's last name`
    },
    
    email: {
      sql: `email`,
      type: `string`,
      title: `Email`,
      description: `User's email address`
    }
  }
});
