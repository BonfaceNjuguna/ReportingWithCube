cube(`EventsView`, {
  sql: `
    SELECT
      id,
      'RFQ' as event_type,
      "number" as event_number,
      name,
      short_description,
      current_state_id,
      purchase_organisation::jsonb->>'Code' as purchase_organisation,
          company_code::jsonb->>'Code' as company_code,
          purchase_group::jsonb->>'Code' as purchase_group,
          (commercial_contact::jsonb->>'FirstName') || ' ' || (commercial_contact::jsonb->>'LastName') as commercial_contact,
          NULL as technical_contact,
          (created_by::jsonb->>'FirstName') || ' ' || (created_by::jsonb->>'LastName') as created_by,
          created_by::jsonb->>'UserId' as created_by_user_id,
          (updated_by::jsonb->>'FirstName') || ' ' || (updated_by::jsonb->>'LastName') as updated_by,
          created_at,
          updated_at,
          started_date,
          deadline,
          replies_opened_at,
          (replies_opened_by::jsonb->>'FirstName') || ' ' || (replies_opened_by::jsonb->>'LastName') as replies_opened_by,
          domain,
          currency,
          total_price,
          round_number,
          document_language,
          is_in_edit_mode,
          has_document_changed,
          has_deadline_changed,
          (SELECT MIN(o.created_at)
           FROM buyer_d_fdw_order_service."order" o
           JOIN buyer_d_fdw_rfq_service.quotation q ON o.source_document_id = q.id
           WHERE q.request_for_id = material_rfq.id) as awarded_at
    FROM buyer_d_fdw_rfq_service.material_rfq

    UNION ALL

    SELECT
      id,
      'RFI' as event_type,
      "number" as event_number,
      name,
      short_description,
      current_state_id,
      NULL as purchase_organisation,
      NULL as company_code,
      NULL as purchase_group,
      (commercial_contact::jsonb->>'FirstName') || ' ' || (commercial_contact::jsonb->>'LastName') as commercial_contact,
      (technical_contact::jsonb->>'FirstName') || ' ' || (technical_contact::jsonb->>'LastName') as technical_contact,
      (created_by::jsonb->>'FirstName') || ' ' || (created_by::jsonb->>'LastName') as created_by,
      created_by::jsonb->>'UserId' as created_by_user_id,
          (updated_by::jsonb->>'FirstName') || ' ' || (updated_by::jsonb->>'LastName') as updated_by,
          created_at,
          updated_at,
          started_date,
          deadline,
          replies_opened_at,
          (replies_opened_by::jsonb->>'FirstName') || ' ' || (replies_opened_by::jsonb->>'LastName') as replies_opened_by,
          domain,
          NULL as currency,
          NULL as total_price,
          round_number,
          document_language,
          is_in_edit_mode,
          has_document_changed,
          has_deadline_changed,
          NULL as awarded_at
    FROM buyer_d_fdw_rfq_service.request_for_information
  `,

  preAggregations: {
    comprehensive: {
      measures: [
        EventsView.count,
        EventsView.quotationRate,
        EventsView.rejectRate,
        EventsView.avgCycleTimeDays,
        EventsView.avgOfferPeriodDays,
        EventsView.invitedSuppliersCount,
        EventsView.offeredSuppliersCount,
        EventsView.viewedSuppliersCount,
        EventsView.rejectedSuppliersCount
      ],
      dimensions: [
        EventsView.number,
        EventsView.createdBy,
        EventsView.currentStateId,
        EventsView.purchaseOrganisation,
        EventsView.eventType
      ],
      timeDimension: EventsView.createdAt,
      granularity: `day`,
      refreshKey: {
        every: `1 hour`
      }
    },
    byCreator: {
      measures: [
        EventsView.count,
        EventsView.avgQuotationRate,
        EventsView.avgCycleTimeDays
      ],
      dimensions: [EventsView.createdBy],
      timeDimension: EventsView.createdAt,
      granularity: `month`
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
    
    RequestForToSupplierMaterialRfq: {
      sql: `${CUBE}.id = ${RequestForToSupplierMaterialRfq}.parent_id AND ${CUBE}.event_type = 'RFQ'`,
      relationship: `hasMany`
    },
    RequestForToSupplierRfi: {
      sql: `${CUBE}.id = ${RequestForToSupplierRfi}.parent_id AND ${CUBE}.event_type = 'RFI'`,
      relationship: `hasMany`
    },
    
    StateRequestForToSupplierMaterialRfq: {
      sql: `${RequestForToSupplierMaterialRfq}.current_state_id = ${StateRequestForToSupplierMaterialRfq}.id`,
      relationship: `belongsTo`
    },
    
    User: {
      sql: `${CUBE}.created_by_user_id::uuid = ${User}.id`,
      relationship: `belongsTo`
    },
    
    Quotation: {
      sql: `${CUBE}.id = ${Quotation}.request_for_id`,
      relationship: `hasMany`
    },
    Order: {
      sql: `EXISTS(
        SELECT 1 FROM buyer_d_fdw_rfq_service.quotation q
        JOIN buyer_d_fdw_order_service."order" o ON o.source_document_id = q.id
        WHERE q.request_for_id = ${CUBE}.id
      )`,
      relationship: `hasMany`
    }
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [number, name, eventType, createdAt, createdBy]
    },

    invitedSuppliersCount: {
      sql: `
        CASE
          WHEN ${CUBE}.event_type = 'RFQ' THEN (
            SELECT COUNT(DISTINCT rfts.id)
            FROM buyer_d_fdw_rfq_service.request_for_to_supplier_material_rfq rfts
            WHERE rfts.parent_id = ${CUBE}.id
          )
          WHEN ${CUBE}.event_type = 'RFI' THEN (
            SELECT COUNT(DISTINCT rfts.id)
            FROM buyer_d_fdw_rfq_service.request_for_to_supplier_request_for_information rfts
            WHERE rfts.parent_id = ${CUBE}.id
          )
          ELSE 0
        END
      `,
      type: `max`,
      title: `Number of Invited Suppliers`
    },

    viewedSuppliersCount: {
      sql: `
        CASE
          WHEN ${CUBE}.event_type = 'RFQ' THEN (
            SELECT COUNT(DISTINCT rfts.id)
            FROM buyer_d_fdw_rfq_service.request_for_to_supplier_material_rfq rfts
            WHERE rfts.parent_id = ${CUBE}.id
              AND rfts.has_active_status_changed = true
          )
          WHEN ${CUBE}.event_type = 'RFI' THEN (
            SELECT COUNT(DISTINCT rfts.id)
            FROM buyer_d_fdw_rfq_service.request_for_to_supplier_request_for_information rfts
            WHERE rfts.parent_id = ${CUBE}.id
              AND rfts.has_active_status_changed = true
          )
          ELSE 0
        END
      `,
      type: `max`,
      title: `Number of Suppliers (Viewed)`
    },

    offeredSuppliersCount: {
      sql: `
        CASE
          WHEN ${CUBE}.event_type = 'RFQ' THEN (
            SELECT COUNT(DISTINCT rfts.id)
            FROM buyer_d_fdw_rfq_service.request_for_to_supplier_material_rfq rfts
            WHERE rfts.parent_id = ${CUBE}.id
              AND EXISTS (
                SELECT 1
                FROM buyer_d_fdw_rfq_service.quotation q
                WHERE q.request_for_to_supplier_id = rfts.id
                  AND q.request_for_id = ${CUBE}.id
                  AND q.submitted_at IS NOT NULL
              )
          )
          WHEN ${CUBE}.event_type = 'RFI' THEN (
            SELECT COUNT(DISTINCT rfts.id)
            FROM buyer_d_fdw_rfq_service.request_for_to_supplier_request_for_information rfts
            WHERE rfts.parent_id = ${CUBE}.id
              AND EXISTS (
                SELECT 1
                FROM buyer_d_fdw_rfq_service.quotation q
                WHERE q.request_for_to_supplier_id = rfts.id
                  AND q.request_for_id = ${CUBE}.id
                  AND q.submitted_at IS NOT NULL
              )
          )
          ELSE 0
        END
      `,
      type: `max`,
      title: `Number of Suppliers (Offered/Submitted)`
    },

    rejectedSuppliersCount: {
      sql: `
        CASE
          WHEN ${CUBE}.event_type = 'RFQ' THEN (
            SELECT COUNT(DISTINCT rfts.id)
            FROM buyer_d_fdw_rfq_service.request_for_to_supplier_material_rfq rfts
            WHERE rfts.parent_id = ${CUBE}.id
              AND rfts.is_active = false
          )
          WHEN ${CUBE}.event_type = 'RFI' THEN (
            SELECT COUNT(DISTINCT rfts.id)
            FROM buyer_d_fdw_rfq_service.request_for_to_supplier_request_for_information rfts
            WHERE rfts.parent_id = ${CUBE}.id
              AND rfts.is_active = false
          )
          ELSE 0
        END
      `,
      type: `max`,
      title: `Number of Suppliers (Rejected)`
    },
    
    offerPeriodDays: {
      sql: `
            CASE 
              WHEN ${CUBE}.started_date IS NOT NULL AND ${CUBE}.deadline IS NOT NULL 
              THEN ROUND(EXTRACT(EPOCH FROM (${CUBE}.deadline - ${CUBE}.started_date)) / 86400)
              ELSE NULL
            END`,
      type: `max`,
      format: `number`,
      title: `Offer Period (Days)`,
      description: `Time between event start and submission deadline`
    },

    avgOfferPeriodDays: {
      sql: `
            CASE 
              WHEN ${CUBE}.started_date IS NOT NULL AND ${CUBE}.deadline IS NOT NULL 
              THEN ROUND(EXTRACT(EPOCH FROM (${CUBE}.deadline - ${CUBE}.started_date)) / 86400)
              ELSE NULL
            END`,
      type: `avg`,
      format: `number`,
      title: `Average Offer Period (Days)`
    },

    cycleTimeDays: {
      sql: `
            CASE
              WHEN ${CUBE}.awarded_at IS NOT NULL AND ${CUBE}.started_date IS NOT NULL
              THEN ROUND(EXTRACT(EPOCH FROM (${CUBE}.awarded_at - ${CUBE}.started_date)) / 86400)
              ELSE NULL
            END`,
      type: `max`,
      format: `number`,
      title: `Cycle Time (Days)`,
      description: `Time from event start to award decision (first order/contract created)`
    },

    avgCycleTimeDays: {
      sql: `
            CASE
              WHEN ${CUBE}.awarded_at IS NOT NULL AND ${CUBE}.started_date IS NOT NULL
              THEN ROUND(EXTRACT(EPOCH FROM (${CUBE}.awarded_at - ${CUBE}.started_date)) / 86400)
              ELSE NULL
            END`,
      type: `avg`,
      format: `number`,
      title: `Average Cycle Time (Days)`,
      description: `Average time from event start to award decision`
    },
    
    quotationRate: {
      sql: `
        CASE 
          WHEN ${CUBE}.event_type = 'RFQ' THEN
            CASE 
              WHEN (SELECT COUNT(DISTINCT id) FROM buyer_d_fdw_rfq_service.request_for_to_supplier_material_rfq WHERE parent_id = ${CUBE}.id) > 0 
              THEN (
                (SELECT COUNT(DISTINCT rfts.id)
                 FROM buyer_d_fdw_rfq_service.request_for_to_supplier_material_rfq rfts
                 JOIN buyer_d_fdw_rfq_service.quotation q ON q.request_for_id = rfts.parent_id AND q.request_for_to_supplier_id = rfts.id
                 WHERE rfts.parent_id = ${CUBE}.id 
                   AND q.submitted_at IS NOT NULL 
                   AND q.original_quotation_id IS NULL)::FLOAT /
                (SELECT COUNT(DISTINCT id) FROM buyer_d_fdw_rfq_service.request_for_to_supplier_material_rfq WHERE parent_id = ${CUBE}.id)
              ) * 100 
              ELSE 0 
            END
          WHEN ${CUBE}.event_type = 'RFI' THEN
            CASE 
              WHEN (SELECT COUNT(DISTINCT id) FROM buyer_d_fdw_rfq_service.request_for_to_supplier_request_for_information WHERE parent_id = ${CUBE}.id) > 0 
              THEN (
                (SELECT COUNT(DISTINCT rfts.id)
                 FROM buyer_d_fdw_rfq_service.request_for_to_supplier_request_for_information rfts
                 JOIN buyer_d_fdw_rfq_service.quotation q ON q.request_for_id = rfts.parent_id AND q.request_for_to_supplier_id = rfts.id
                 WHERE rfts.parent_id = ${CUBE}.id 
                   AND q.submitted_at IS NOT NULL 
                   AND q.original_quotation_id IS NULL)::FLOAT /
                (SELECT COUNT(DISTINCT id) FROM buyer_d_fdw_rfq_service.request_for_to_supplier_request_for_information WHERE parent_id = ${CUBE}.id)
              ) * 100 
              ELSE 0 
            END
          ELSE 0
        END`,
      type: `max`,
      format: `percent`,
      title: `Quotation Rate (%)`,
      description: `Number of valid quotations / Number of invited suppliers * 100`
    },
    
    avgQuotationRate: {
      sql: `
        CASE 
          WHEN ${CUBE}.event_type = 'RFQ' THEN
            CASE 
              WHEN (SELECT COUNT(DISTINCT id) FROM buyer_d_fdw_rfq_service.request_for_to_supplier_material_rfq WHERE parent_id = ${CUBE}.id) > 0 
              THEN (
                (SELECT COUNT(DISTINCT rfts.id)
                 FROM buyer_d_fdw_rfq_service.request_for_to_supplier_material_rfq rfts
                 JOIN buyer_d_fdw_rfq_service.quotation q ON q.request_for_id = rfts.parent_id AND q.request_for_to_supplier_id = rfts.id
                 WHERE rfts.parent_id = ${CUBE}.id 
                   AND q.submitted_at IS NOT NULL 
                   AND q.original_quotation_id IS NULL)::FLOAT /
                (SELECT COUNT(DISTINCT id) FROM buyer_d_fdw_rfq_service.request_for_to_supplier_material_rfq WHERE parent_id = ${CUBE}.id)
              ) * 100 
              ELSE 0 
            END
          WHEN ${CUBE}.event_type = 'RFI' THEN
            CASE 
              WHEN (SELECT COUNT(DISTINCT id) FROM buyer_d_fdw_rfq_service.request_for_to_supplier_request_for_information WHERE parent_id = ${CUBE}.id) > 0 
              THEN (
                (SELECT COUNT(DISTINCT rfts.id)
                 FROM buyer_d_fdw_rfq_service.request_for_to_supplier_request_for_information rfts
                 JOIN buyer_d_fdw_rfq_service.quotation q ON q.request_for_id = rfts.parent_id AND q.request_for_to_supplier_id = rfts.id
                 WHERE rfts.parent_id = ${CUBE}.id 
                   AND q.submitted_at IS NOT NULL 
                   AND q.original_quotation_id IS NULL)::FLOAT /
                (SELECT COUNT(DISTINCT id) FROM buyer_d_fdw_rfq_service.request_for_to_supplier_request_for_information WHERE parent_id = ${CUBE}.id)
              ) * 100 
              ELSE 0 
            END
          ELSE 0
        END`,
      type: `avg`,
      format: `percent`,
      title: `Average Quotation Rate (%)`
    },

    responseRate: {
      sql: `
        CASE 
          WHEN ${CUBE}.event_type = 'RFQ' THEN
            CASE 
              WHEN (SELECT COUNT(DISTINCT id) FROM buyer_d_fdw_rfq_service.request_for_to_supplier_material_rfq WHERE parent_id = ${CUBE}.id) > 0 
              THEN (
                (SELECT COUNT(DISTINCT id)
                 FROM buyer_d_fdw_rfq_service.request_for_to_supplier_material_rfq
                 WHERE parent_id = ${CUBE}.id 
                   AND has_active_status_changed = true)::FLOAT /
                (SELECT COUNT(DISTINCT id) FROM buyer_d_fdw_rfq_service.request_for_to_supplier_material_rfq WHERE parent_id = ${CUBE}.id)
              ) * 100 
              ELSE 0 
            END
          WHEN ${CUBE}.event_type = 'RFI' THEN
            CASE 
              WHEN (SELECT COUNT(DISTINCT id) FROM buyer_d_fdw_rfq_service.request_for_to_supplier_request_for_information WHERE parent_id = ${CUBE}.id) > 0 
              THEN (
                (SELECT COUNT(DISTINCT id)
                 FROM buyer_d_fdw_rfq_service.request_for_to_supplier_request_for_information
                 WHERE parent_id = ${CUBE}.id 
                   AND has_active_status_changed = true)::FLOAT /
                (SELECT COUNT(DISTINCT id) FROM buyer_d_fdw_rfq_service.request_for_to_supplier_request_for_information WHERE parent_id = ${CUBE}.id)
              ) * 100 
              ELSE 0 
            END
          ELSE 0
        END`,
      type: `max`,
      format: `percent`,
      title: `Response Rate (%)`,
      description: `Number of answers / Number of invited suppliers * 100`
    },
    
    rejectRate: {
      sql: `
        CASE 
          WHEN ${CUBE}.event_type = 'RFQ' THEN
            CASE 
              WHEN (SELECT COUNT(DISTINCT id) FROM buyer_d_fdw_rfq_service.request_for_to_supplier_material_rfq WHERE parent_id = ${CUBE}.id) > 0 
              THEN (
                (SELECT COUNT(DISTINCT id)
                 FROM buyer_d_fdw_rfq_service.request_for_to_supplier_material_rfq
                 WHERE parent_id = ${CUBE}.id 
                   AND is_active = false)::FLOAT /
                (SELECT COUNT(DISTINCT id) FROM buyer_d_fdw_rfq_service.request_for_to_supplier_material_rfq WHERE parent_id = ${CUBE}.id)
              ) * 100 
              ELSE 0 
            END
          WHEN ${CUBE}.event_type = 'RFI' THEN
            CASE 
              WHEN (SELECT COUNT(DISTINCT id) FROM buyer_d_fdw_rfq_service.request_for_to_supplier_request_for_information WHERE parent_id = ${CUBE}.id) > 0 
              THEN (
                (SELECT COUNT(DISTINCT id)
                 FROM buyer_d_fdw_rfq_service.request_for_to_supplier_request_for_information
                 WHERE parent_id = ${CUBE}.id 
                   AND is_active = false)::FLOAT /
                (SELECT COUNT(DISTINCT id) FROM buyer_d_fdw_rfq_service.request_for_to_supplier_request_for_information WHERE parent_id = ${CUBE}.id)
              ) * 100 
              ELSE 0 
            END
          ELSE 0
        END`,
      type: `max`,
      format: `percent`,
      title: `Reject Rate (%)`,
      description: `Number of rejected suppliers / Number of invited suppliers * 100`
    },
    
    bestQuotationTotal: {
      sql: `
        (
          SELECT MIN(quotation_total)
          FROM (
            SELECT q.id as quotation_id, q.total_price as quotation_total
            FROM buyer_d_fdw_rfq_service.quotation q
            WHERE q.request_for_id = ${CUBE}.id
              AND q.is_opened = true
              AND q.round_number = (
                SELECT MAX(inner_q.round_number)
                FROM buyer_d_fdw_rfq_service.quotation inner_q
                WHERE inner_q.request_for_id = q.request_for_id
              )
              AND NOT EXISTS (
                SELECT 1
                FROM buyer_d_fdw_rfq_service.quotation_document_item qdi
                WHERE qdi.root_id = q.id
                  AND qdi.unit_price <= 0
                  AND qdi.item_type <> 3
              )
          ) as ranked_quotations
        )
      `,
      type: `max`,
      format: `currency`,
      title: `Best Quotation Total`,
      description: `Lowest opened quotation from latest round (excludes quotations with invalid pricing)`
    },

    quotationTotalAvg: {
      sql: `
        (
          SELECT AVG(quotation_total)
          FROM (
            SELECT q.id as quotation_id, q.total_price as quotation_total
            FROM buyer_d_fdw_rfq_service.quotation q
            WHERE q.request_for_id = ${CUBE}.id
              AND q.is_opened = true
              AND q.round_number = (
                SELECT MAX(inner_q.round_number)
                FROM buyer_d_fdw_rfq_service.quotation inner_q
                WHERE inner_q.request_for_id = q.request_for_id
              )
              AND NOT EXISTS (
                SELECT 1
                FROM buyer_d_fdw_rfq_service.quotation_document_item qdi
                WHERE qdi.root_id = q.id
                  AND qdi.unit_price <= 0
                  AND qdi.item_type <> 3
              )
          ) as ranked_quotations
        )
      `,
      type: `max`,
      format: `currency`,
      title: `Quotation Total (Average)`
    },

    quotationTotal: {
      sql: `
        (
          SELECT SUM(quotation_total)
          FROM (
            SELECT q.id as quotation_id, q.total_price as quotation_total
            FROM buyer_d_fdw_rfq_service.quotation q
            WHERE q.request_for_id = ${CUBE}.id
              AND q.is_opened = true
              AND q.round_number = (
                SELECT MAX(inner_q.round_number)
                FROM buyer_d_fdw_rfq_service.quotation inner_q
                WHERE inner_q.request_for_id = q.request_for_id
              )
              AND NOT EXISTS (
                SELECT 1
                FROM buyer_d_fdw_rfq_service.quotation_document_item qdi
                WHERE qdi.root_id = q.id
                  AND qdi.unit_price <= 0
                  AND qdi.item_type <> 3
              )
          ) as ranked_quotations
        )
      `,
      type: `max`,
      format: `currency`,
      title: `Quotation Total`
    },

    openedQuotationsCount: {
      sql: `
        (
          SELECT COUNT(DISTINCT q.id)
          FROM buyer_d_fdw_rfq_service.quotation q
          WHERE q.request_for_id = ${CUBE}.id
        )
      `,
      type: `max`,
      title: `Opened Quotations Count`
    },

    lastRoundNumber: {
      sql: `${CUBE}.round_number`,
      type: `max`,
      title: `Last Round Number`
    },
    
    suppliersInProcessCount: {
      sql: `
        (
          SELECT COUNT(DISTINCT rfts.id)
          FROM buyer_d_fdw_rfq_service.request_for_to_supplier_material_rfq rfts
          JOIN buyer_d_fdw_rfq_service.state_request_for_to_supplier_material_rfq s
            ON s.id = rfts.current_state_id
          WHERE rfts.parent_id = ${CUBE}.id
            AND ${CUBE}.event_type = 'RFQ'
            AND s.name = 'InProcess'
        )
      `,
      type: `max`,
      title: `Suppliers In Process`
    },

    suppliersRejectedCount: {
      sql: `
        (
          SELECT COUNT(DISTINCT rfts.id)
          FROM buyer_d_fdw_rfq_service.request_for_to_supplier_material_rfq rfts
          JOIN buyer_d_fdw_rfq_service.state_request_for_to_supplier_material_rfq s
            ON s.id = rfts.current_state_id
          WHERE rfts.parent_id = ${CUBE}.id
            AND ${CUBE}.event_type = 'RFQ'
            AND s.name = 'Rejected'
        )
      `,
      type: `max`,
      title: `Suppliers Rejected`
    },

    suppliersSubmittedCount: {
      sql: `
        (
          SELECT COUNT(DISTINCT rfts.id)
          FROM buyer_d_fdw_rfq_service.request_for_to_supplier_material_rfq rfts
          JOIN buyer_d_fdw_rfq_service.state_request_for_to_supplier_material_rfq s
            ON s.id = rfts.current_state_id
          WHERE rfts.parent_id = ${CUBE}.id
            AND ${CUBE}.event_type = 'RFQ'
            AND s.name = 'SupplierReplySubmitted'
        )
      `,
      type: `max`,
      title: `Suppliers Submitted (Reply)`
    }
  },
  
  dimensions: {
    id: {
      sql: `id`,
      type: `string`,
      primaryKey: true
    },
    
    eventType: {
      sql: `event_type`,
      type: `string`,
      title: `Event Type`
    },
    
    number: {
      sql: `"event_number"`,
      type: `string`,
      title: `Event Number`
    },
    
    rfqNo: {
      sql: `"event_number"`,
      type: `string`,
      title: `Event Number`
    },
    
    name: {
      sql: `name`,
      type: `string`,
      title: `Event Name`
    },
    
    rfqName: {
      sql: `name`,
      type: `string`,
      title: `Event Name`
    },
    
    shortDescription: {
      sql: `short_description`,
      type: `string`
    },
    
    currentStateId: {
      sql: `current_state_id`,
      type: `string`,
      title: `Status ID`
    },
    
    stateName: {
      sql: `
        CASE 
          WHEN ${CUBE}.event_type = 'RFQ' THEN ${StateMaterialRfq.name}
          WHEN ${CUBE}.event_type = 'RFI' THEN ${StateRequestForInformation.name}
        END`,
      type: `string`,
      title: `Status Name`
    },
    
    status: {
      sql: `current_state_id`,
      type: `string`,
      title: `Status`
    },
    
    purchaseOrganisation: {
      sql: `purchase_organisation`,
      type: `string`,
      title: `Purchase Organisation`
    },
    
    companyCode: {
      sql: `company_code`,
      type: `string`,
      title: `Company Code`
    },
    
    purchaseGroup: {
      sql: `purchase_group`,
      type: `string`,
      title: `Purchase Group`
    },
    
    commercialContact: {
      sql: `commercial_contact`,
      type: `string`,
      title: `Commercial Contact`
    },
    
    technicalContact: {
      sql: `technical_contact`,
      type: `string`,
      title: `Technical Contact`
    },
    
    createdBy: {
      sql: `created_by`,
      type: `string`,
      title: `Created By`
    },
    
    updatedBy: {
      sql: `updated_by`,
      type: `string`,
      title: `Updated By`
    },
    
    creatorDepartment: {
      sql: `${User.department}`,
      type: `string`,
      title: `Department (Creator)`
    },
    
    creatorName: {
      sql: `created_by`,
      type: `string`,
      title: `Creator Name`
    },
    
    creatorId: {
      sql: `created_by`,
      type: `string`,
      title: `Creator ID`
    },
    
    domain: {
      sql: `domain`,
      type: `string`
    },
    
    currency: {
      sql: `currency`,
      type: `string`
    },
    
    totalPrice: {
      sql: `total_price`,
      type: `number`,
      format: `currency`
    },
    
    roundNumber: {
      sql: `round_number`,
      type: `number`,
      title: `Number of Rounds`
    },
    
    numberOfRounds: {
      sql: `round_number`,
      type: `number`,
      title: `Number of Rounds`
    },
    
    documentLanguage: {
      sql: `document_language`,
      type: `string`
    },
    
    createdAt: {
      sql: `created_at`,
      type: `time`,
      title: `Created At`
    },
    
    updatedAt: {
      sql: `updated_at`,
      type: `time`
    },
    
    startedDate: {
      sql: `started_date`,
      type: `time`,
      title: `Started/Published At`
    },
    
    startedAt: {
      sql: `started_date`,
      type: `time`,
      title: `Started/Published At`
    },
    
    deadline: {
      sql: `deadline`,
      type: `time`,
      title: `Submission Deadline`
    },
    
    submissionDeadline: {
      sql: `deadline`,
      type: `time`,
      title: `Submission Deadline`
    },
    
    repliesOpenedAt: {
      sql: `replies_opened_at`,
      type: `time`,
      title: `Replies Opened At`
    },
    
    repliesOpenedBy: {
      sql: `replies_opened_by`,
      type: `string`
    },
    
    isInEditMode: {
      sql: `is_in_edit_mode`,
      type: `boolean`
    },
    
    hasDocumentChanged: {
      sql: `has_document_changed`,
      type: `boolean`
    },
    
    hasDeadlineChanged: {
      sql: `has_deadline_changed`,
      type: `boolean`
    },
    
    hasOrders: {
      sql: `EXISTS(
        SELECT 1 FROM buyer_d_fdw_rfq_service.quotation q
        JOIN buyer_d_fdw_order_service."order" o ON o.source_document_id = q.id
        WHERE q.request_for_id = ${CUBE}.id
      )`,
      type: `boolean`,
      title: `Has Orders/Awards`
    },
    
    awardedAt: {
      sql: `awarded_at`,
      type: `time`,
      title: `Awarded At (First Order Date)`
    }
  }
});
