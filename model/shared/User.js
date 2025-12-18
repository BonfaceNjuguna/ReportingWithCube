// Cube.js schema for User (foreign table from user service)
// Maps to: public.user (foreign table)

cube(`User`, {
  sql: `SELECT * FROM public."user"`,
  
  measures: {
    count: {
      type: `count`,
      title: `User Count`
    }
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `string`,
      primaryKey: true
    },
    
    department: {
      sql: `department`,
      type: `string`,
      title: `Department`
    },
    
    firstName: {
      sql: `first_name`,
      type: `string`,
      title: `First Name`
    },
    
    lastName: {
      sql: `last_name`,
      type: `string`,
      title: `Last Name`
    },
    
    email: {
      sql: `email`,
      type: `string`,
      title: `Email`
    }
  }
});
