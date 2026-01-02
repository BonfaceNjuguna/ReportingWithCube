// Unified events cube with KPIs for both RFQ and RFI
cube('EventsView', {
  extends: EventBase,

  preAggregations: {
    main: {
      measures: [
        EventsView.count,
        EventsView.invitedSuppliersCount,
        EventsView.viewedSuppliersCount,
        EventsView.offeredSuppliersCount,
        EventsView.rejectedSuppliersCount,
        EventsView.bestQuotationTotal,
        EventsView.rfqTotalPrice
      ],
      dimensions: [
        EventsView.eventType,
        EventsView.purchaseOrganisation,
        EventsView.companyCode,
        EventsView.purchaseGroup,
        EventsView.createdBy,
        EventsView.creatorDepartment
      ],
      timeDimension: EventsView.createdAt,
      granularity: `day`,
      refreshKey: {
        sql: `SELECT MAX(updated_at) FROM buyer_d_fdw_rfq_service.material_rfq`
      }
    }
  },

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
      title: `Invited Suppliers`,
      description: `Number of unique suppliers invited to the event`
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
      title: `Viewed Suppliers`,
      description: `Number of unique suppliers who viewed the event`
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
      title: `Offered Suppliers`,
      description: `Number of unique suppliers who submitted an offer or reply`
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
      title: `Rejected Suppliers`,
      description: `Number of unique suppliers who rejected the invitation`
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
      title: `Best Quotation (Lowest)`,
      description: `Lowest valid quotation price for the current RFQ round`
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
      title: `Valid Quotation Total`,
      description: `Sum of prices for all submitted and valid RFQ quotations`
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
      title: `Valid Quotations Count`,
      description: `Number of submitted and valid RFQ quotations`
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
      title: `Answer Count`,
      description: `Number of submitted questionnaire answers for RFIs`
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
      title: `Average Quotation Total`,
      description: `Average price of valid RFQ quotations`
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
      title: `Offer Period (Days)`,
      description: `Average duration allowed for suppliers to submit their response`
    },

    cycleTimeDays: {
      sql: `AVG(ROUND(EXTRACT(EPOCH FROM (${OrderAward.awardedAtTime} - ${CUBE}.started_date)) / 86400))::INTEGER`,
      type: `number`,
      title: `Cycle Time (Days)`,
      description: `Average duration from event start to first order award`
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
      title: `Quotation Rate`,
      description: `Percentage of invited suppliers who submitted a valid quotation (RFQs only)`
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
      title: `Response Rate`,
      description: `Percentage of invited suppliers who submitted answers (RFIs only)`
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
      title: `Reject Rate`,
      description: `Percentage of invited suppliers who rejected the invitation`
    }
  },

  dimensions: {
    stateName: {
      sql: `COALESCE(${StateMaterialRfq.name}, ${StateRequestForInformation.name})`,
      type: `string`,
      title: `Status Name`,
      description: `Human-readable status name of the event`
    },

    awardedAt: {
      sql: `${OrderAward.awardedAtTime}`,
      type: `time`,
      title: `Award Decision Date`,
      description: `Timestamp of the first order award`
    }
  }
});
