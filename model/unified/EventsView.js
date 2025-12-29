// Unified events cube with KPIs for both RFQ and RFI
cube('EventsView', {
  extends: EventBase,

  joins: {
    StateMaterialRfq: {
      sql: `${CUBE}.current_state_id = ${StateMaterialRfq}.id AND ${CUBE}.event_type = 'RFQ'`,
      relationship: `belongsTo`
    },
    StateRequestForInformation: {
      sql: `${CUBE}.current_state_id = ${StateRequestForInformation}.id AND ${CUBE}.event_type = 'RFI'`,
      relationship: `belongsTo`
    },
    OrderAward: {
      sql: `${CUBE}.id = ${OrderAward.rfqId} AND ${CUBE}.event_type = 'RFQ'`,
      relationship: `belongsTo`
    }
  },
  
  measures: {
    invitedSuppliersCount: {
      sql: `
        CASE 
          WHEN ${CUBE}.event_type = 'RFQ' THEN 
            (SELECT COUNT(DISTINCT rfts.id) 
             FROM buyer_d_fdw_rfq_service.request_for_to_supplier_material_rfq rfts 
             WHERE rfts.parent_id = ${CUBE}.id AND rfts.is_active = true)
          WHEN ${CUBE}.event_type = 'RFI' THEN 
            (SELECT COUNT(DISTINCT rfts.id) 
             FROM buyer_d_fdw_rfq_service.request_for_to_supplier_request_for_information rfts 
             WHERE rfts.parent_id = ${CUBE}.id AND rfts.is_active = true)
        END
      `,
      type: `sum`,
      title: `Invited Suppliers`
    },

    viewedSuppliersCount: {
      sql: `
        CASE 
          WHEN ${CUBE}.event_type = 'RFQ' THEN 
            (SELECT COUNT(DISTINCT rfts.id) 
             FROM buyer_d_fdw_rfq_service.request_for_to_supplier_material_rfq rfts 
             JOIN buyer_d_fdw_rfq_service.state_request_for_to_supplier_material_rfq s ON rfts.current_state_id = s.id 
             WHERE rfts.parent_id = ${CUBE}.id AND s.name = 'Seen')
          WHEN ${CUBE}.event_type = 'RFI' THEN 
            (SELECT COUNT(DISTINCT rfts.id) 
             FROM buyer_d_fdw_rfq_service.request_for_to_supplier_request_for_information rfts 
             JOIN buyer_d_fdw_rfq_service.state_request_for_to_supplier_request_for_information s ON rfts.current_state_id = s.id 
             WHERE rfts.parent_id = ${CUBE}.id AND s.name = 'Seen')
        END
      `,
      type: `sum`,
      title: `Viewed Suppliers`
    },

    offeredSuppliersCount: {
      sql: `
        CASE 
          WHEN ${CUBE}.event_type = 'RFQ' THEN 
            (SELECT COUNT(DISTINCT rfts.id) 
             FROM buyer_d_fdw_rfq_service.request_for_to_supplier_material_rfq rfts 
             JOIN buyer_d_fdw_rfq_service.state_request_for_to_supplier_material_rfq s ON rfts.current_state_id = s.id 
             WHERE rfts.parent_id = ${CUBE}.id AND s.name = 'SupplierReplySubmitted')
          WHEN ${CUBE}.event_type = 'RFI' THEN 
            (SELECT COUNT(DISTINCT rfts.id) 
             FROM buyer_d_fdw_rfq_service.request_for_to_supplier_request_for_information rfts 
             JOIN buyer_d_fdw_rfq_service.state_request_for_to_supplier_request_for_information s ON rfts.current_state_id = s.id 
             WHERE rfts.parent_id = ${CUBE}.id AND s.name = 'SupplierReplySubmitted')
        END
      `,
      type: `sum`,
      title: `Offered Suppliers`
    },

    rejectedSuppliersCount: {
      sql: `
        CASE 
          WHEN ${CUBE}.event_type = 'RFQ' THEN 
            (SELECT COUNT(DISTINCT rfts.id) 
             FROM buyer_d_fdw_rfq_service.request_for_to_supplier_material_rfq rfts 
             JOIN buyer_d_fdw_rfq_service.state_request_for_to_supplier_material_rfq s ON rfts.current_state_id = s.id 
             WHERE rfts.parent_id = ${CUBE}.id AND s.name = 'Rejected')
          WHEN ${CUBE}.event_type = 'RFI' THEN 
            (SELECT COUNT(DISTINCT rfts.id) 
             FROM buyer_d_fdw_rfq_service.request_for_to_supplier_request_for_information rfts 
             JOIN buyer_d_fdw_rfq_service.state_request_for_to_supplier_request_for_information s ON rfts.current_state_id = s.id 
             WHERE rfts.parent_id = ${CUBE}.id AND s.name = 'Rejected')
        END
      `,
      type: `sum`,
      title: `Rejected Suppliers`
    },

    bestQuotationTotal: {
      sql: `
        CASE 
          WHEN ${CUBE}.event_type = 'RFQ' THEN 
            (SELECT MIN(total_price) 
             FROM buyer_d_fdw_rfq_service.quotation q 
             WHERE q.request_for_id = ${CUBE}.id 
               AND q.is_opened = true 
               AND q.round_number = ${CUBE}.round_number 
               AND q.version_number = 0
               AND NOT EXISTS (
                 SELECT 1 
                 FROM buyer_d_fdw_rfq_service.quotation_document_item qdi
                 WHERE qdi.root_id = q.id 
                   AND qdi.unit_price <= 0
                   AND qdi.item_type <> 3
               ))
          ELSE NULL
        END
      `,
      type: `min`,
      format: `currency`,
      title: `Best Quotation (Lowest)`
    },

    quotationTotalValid: {
      sql: `
        CASE 
          WHEN ${CUBE}.event_type = 'RFQ' THEN 
            (SELECT SUM(total_price) 
             FROM buyer_d_fdw_rfq_service.quotation q 
             JOIN buyer_d_fdw_rfq_service.state_quotation sq ON q.current_state_id = sq.id
             WHERE q.request_for_id = ${CUBE}.id 
               AND q.is_opened = true 
               AND q.round_number = ${CUBE}.round_number
               AND q.version_number = 0
               AND sq.name = 'Submitted')
          ELSE NULL
        END
      `,
      type: `sum`,
      format: `currency`,
      title: `Valid Quotation Total`
    },

    quotationCountValid: {
      sql: `
        CASE 
          WHEN ${CUBE}.event_type = 'RFQ' THEN 
            (SELECT COUNT(*) 
             FROM buyer_d_fdw_rfq_service.quotation q 
             JOIN buyer_d_fdw_rfq_service.state_quotation sq ON q.current_state_id = sq.id
             WHERE q.request_for_id = ${CUBE}.id 
               AND q.is_opened = true 
               AND q.round_number = ${CUBE}.round_number
               AND q.version_number = 0
               AND sq.name = 'Submitted')
          ELSE NULL
        END
      `,
      type: `sum`,
      title: `Valid Quotations Count`
    },

    answerCount: {
      sql: `
        CASE 
          WHEN ${CUBE}.event_type = 'RFI' THEN 
            (SELECT COUNT(*) 
             FROM buyer_d_fdw_rfq_service.questionnaire_answer_request_for_information qa
             JOIN buyer_d_fdw_rfq_service.state_questionnaire_answer_request_for_information sa ON qa.current_state_id = sa.id
             WHERE qa.request_for_id = ${CUBE}.id
               AND sa.name = 'Submitted')
          ELSE NULL
        END
      `,
      type: `sum`,
      title: `Answer Count`
    },

    quotationTotalAvg: {
      sql: `
        CASE
          WHEN ${quotationCountValid} > 0
          THEN ${quotationTotalValid}::FLOAT / ${quotationCountValid}
          ELSE NULL
        END
      `,
      type: `number`,
      format: `currency`,
      title: `Average Quotation Total`
    },

    offerPeriodDays: {
      sql: `
        AVG(
          CASE
            WHEN ${CUBE}.started_date IS NOT NULL
             AND ${CUBE}.deadline IS NOT NULL
            THEN ROUND(EXTRACT(EPOCH FROM (${CUBE}.deadline - ${CUBE}.started_date)) / 86400)
            ELSE NULL
          END
        )::INTEGER
      `,
      type: `number`,
      title: `Offer Period (Days)`
    },

    cycleTimeDays: {
      sql: `AVG(ROUND(EXTRACT(EPOCH FROM (${OrderAward.awardedAtTime} - ${CUBE}.started_date)) / 86400))::INTEGER`,
      type: `number`,
      title: `Cycle Time (Days)`
    },

    quotationRate: {
      sql: `
        CASE
          WHEN ${CUBE}.event_type = 'RFQ' AND ${invitedSuppliersCount} > 0
          THEN (${quotationCountValid}::FLOAT / ${invitedSuppliersCount}) * 100
          ELSE NULL
        END
      `,
      type: `number`,
      format: `percent`,
      title: `Quotation Rate`
    },

    responseRate: {
      sql: `
        CASE
          WHEN ${CUBE}.event_type = 'RFI' AND ${invitedSuppliersCount} > 0
          THEN (${answerCount}::FLOAT / ${invitedSuppliersCount}) * 100
          ELSE NULL
        END
      `,
      type: `number`,
      format: `percent`,
      title: `Response Rate`
    },

    rejectRate: {
      sql: `
        CASE
          WHEN ${invitedSuppliersCount} > 0
          THEN (${rejectedSuppliersCount}::FLOAT / ${invitedSuppliersCount}) * 100
          ELSE NULL
        END
      `,
      type: `number`,
      format: `percent`,
      title: `Reject Rate`
    }
  },

  dimensions: {
    stateName: {
      sql: `COALESCE(${StateMaterialRfq.name}, ${StateRequestForInformation.name})`,
      type: `string`,
      title: `Status Name`
    },

    awardedAt: {
      sql: `${OrderAward.awardedAtTime}`,
      type: `time`,
      title: `Award Decision Date`
    }
  }
});
