// Aggregation cube exposing earliest order date per RFQ for cycle-time KPIs.
cube(`OrderAward`, {
  sql: `
    SELECT
      q.request_for_id AS rfq_id,
      MIN(o.created_at) AS awarded_at
    FROM buyer_d_fdw_order_service."order" o
    JOIN buyer_d_fdw_rfq_service.quotation q ON o.source_document_id = q.id
    WHERE q.domain = 'material_rfq'
    GROUP BY 1
  `,

  measures: {
    firstOrderAt: {
      sql: `awarded_at`,
      type: `min`,
      title: `Awarded At (First Order Date)`
    }
  },

  dimensions: {
    rfqId: {
      sql: `rfq_id`,
      type: `string`,
      primaryKey: true,
      title: `RFQ ID`
    },

    awardedAtTime: {
      sql: `awarded_at`,
      type: `time`,
      title: `Awarded At`
    }
  }
});
