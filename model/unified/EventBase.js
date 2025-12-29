// Unified event base combining RFQ + RFI with basic dimensions only
cube(`EventBase`, {
  sql: `
    SELECT
      id,
      'RFQ' AS event_type,
      "number" AS event_number,
      name,
      short_description,
      current_state_id,
      purchase_organisation::jsonb->>'Code' AS purchase_organisation,
      company_code::jsonb->>'Code' AS company_code,
      purchase_group::jsonb->>'Code' AS purchase_group,
      (commercial_contact::jsonb->>'FirstName') || ' ' || (commercial_contact::jsonb->>'LastName') AS commercial_contact,
      NULL AS technical_contact,
      (created_by::jsonb->>'FirstName') || ' ' || (created_by::jsonb->>'LastName') AS created_by,
      created_by::jsonb->>'UserId' AS created_by_user_id,
      created_by::jsonb->>'Department' AS creator_department,
      (updated_by::jsonb->>'FirstName') || ' ' || (updated_by::jsonb->>'LastName') AS updated_by,
      created_at,
      updated_at,
      started_date,
      deadline,
      replies_opened_at,
      (replies_opened_by::jsonb->>'FirstName') || ' ' || (replies_opened_by::jsonb->>'LastName') AS replies_opened_by,
      domain,
      currency,
      total_price,
      round_number,
      document_language,
      is_in_edit_mode,
      has_document_changed,
      has_deadline_changed
    FROM buyer_d_fdw_rfq_service.material_rfq

    UNION ALL

    SELECT
      id,
      'RFI' AS event_type,
      "number" AS event_number,
      name,
      short_description,
      current_state_id,
      NULL AS purchase_organisation,
      NULL AS company_code,
      NULL AS purchase_group,
      (commercial_contact::jsonb->>'FirstName') || ' ' || (commercial_contact::jsonb->>'LastName') AS commercial_contact,
      (technical_contact::jsonb->>'FirstName') || ' ' || (technical_contact::jsonb->>'LastName') AS technical_contact,
      (created_by::jsonb->>'FirstName') || ' ' || (created_by::jsonb->>'LastName') AS created_by,
      created_by::jsonb->>'UserId' AS created_by_user_id,
      created_by::jsonb->>'Department' AS creator_department,
      (updated_by::jsonb->>'FirstName') || ' ' || (updated_by::jsonb->>'LastName') AS updated_by,
      created_at,
      updated_at,
      started_date,
      deadline,
      replies_opened_at,
      (replies_opened_by::jsonb->>'FirstName') || ' ' || (replies_opened_by::jsonb->>'LastName') AS replies_opened_by,
      domain,
      NULL AS currency,
      NULL AS total_price,
      round_number,
      document_language,
      is_in_edit_mode,
      has_document_changed,
      has_deadline_changed
    FROM buyer_d_fdw_rfq_service.request_for_information
  `,

  measures: {
    count: {
      type: `count`,
      drillMembers: [eventNumber, name, createdAt, createdBy]
    },

    rfqTotalPrice: {
      sql: `total_price`,
      type: `sum`,
      format: `currency`,
      filters: [{ sql: `${CUBE}.event_type = 'RFQ'` }],
      title: `RFQ Total Price`
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

    eventNumber: {
      sql: `event_number`,
      type: `string`,
      title: `Event Number`
    },

    name: {
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

    createdByUserId: {
      sql: `created_by_user_id`,
      type: `string`,
      title: `Created By User ID`
    },

    creatorDepartment: {
      sql: `creator_department`,
      type: `string`,
      title: `Creator Department`
    },

    updatedBy: {
      sql: `updated_by`,
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

    deadline: {
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

    domain: {
      sql: `domain`,
      type: `string`
    },

    currency: {
      sql: `currency`,
      type: `string`
    },

    roundNumber: {
      sql: `round_number`,
      type: `number`,
      title: `Round Number`
    },

    documentLanguage: {
      sql: `document_language`,
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
    }
  }
});
